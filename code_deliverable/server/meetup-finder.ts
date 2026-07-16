// Searches for a genuinely fair meeting point -- not a pick among four fixed
// landmarks, and not a geographic straight-line midpoint. For driving, it
// iteratively evaluates real Mapbox road routes from every person toward a
// moving candidate point until everyone's real drive time converges within a
// tolerance band. For transit, it scores every real subway station using the
// heuristic line/transfer path-finder in subway-router.ts plus real walking
// directions, and keeps the station that minimizes the same fairness score
// used for ranking elsewhere in the app.

import { mapboxDirections, mapboxReverseGeocode } from "./mapbox";
import { findTransitPath, nearestStation, haversineKm, type Station } from "./subway-router";
import { delayMultiplierForRoutes, type SubwayAlert } from "./mta";
import { getLegGeometry } from "./subway-shapes";
import type { RouteGeometry } from "./geometry-types";

export interface PersonInput {
  name: string;
  lat: number;
  lon: number;
  delayFactor: number;
}

// NYC bounding box (same soft bounds used for address autocomplete) so the
// driving search never wanders somewhere nonsensical (or into NJ).
const NYC_BOUNDS = { minLon: -74.26, maxLon: -73.68, minLat: 40.49, maxLat: 40.92 };

export const TOLERANCE_LOW_SEC = 5 * 60;
export const TOLERANCE_HIGH_SEC = 8 * 60;
const WALK_FALLBACK_KMH = 4.8;
const DRIVE_FALLBACK_KMH = 32;

function clampToNyc(p: { lat: number; lon: number }) {
  return {
    lat: Math.min(NYC_BOUNDS.maxLat, Math.max(NYC_BOUNDS.minLat, p.lat)),
    lon: Math.min(NYC_BOUNDS.maxLon, Math.max(NYC_BOUNDS.minLon, p.lon)),
  };
}

function centroid(people: PersonInput[]) {
  return {
    lat: people.reduce((s, p) => s + p.lat, 0) / people.length,
    lon: people.reduce((s, p) => s + p.lon, 0) / people.length,
  };
}

export type { RouteGeometry };

export interface DrivingPersonResult {
  personName: string;
  mode: "driving";
  rawSec: number;
  adjustedSec: number;
  geometry: RouteGeometry | null;
}

export interface TransitLegOut {
  route: string;
  board: Station;
  alight: Station;
  // Real subway track geometry between board and alight, following the
  // actual curves the train makes. Null when no confident match was found
  // in the static shape data (callers fall back to a straight line).
  geometry: RouteGeometry | null;
}

export interface TransitPersonResult {
  personName: string;
  mode: "transit";
  rawSec: number;
  adjustedSec: number;
  walkToStationSec: number;
  walkToGeometry: RouteGeometry | null;
  legs: TransitLegOut[];
  transferCount: number;
  alertMultiplier: number;
  matchedAlerts: SubwayAlert[];
}

export type PersonResult = DrivingPersonResult | TransitPersonResult;

export interface FairSpotResult {
  mode: "driving" | "transit";
  lat: number;
  lon: number;
  address: string;
  neighborhood: string;
  nearestStationHint: string;
  spreadSec: number;
  toleranceLowSec: number;
  toleranceHighSec: number;
  withinTolerance: boolean;
  totalTime: number;
  maxTrip: number;
  score: number;
  perPerson: PersonResult[];
}

async function drivingSecTo(person: PersonInput, point: { lat: number; lon: number }) {
  try {
    const r = await mapboxDirections({ lat: person.lat, lon: person.lon }, point, "driving-traffic");
    return { sec: r.durationSec, geometry: r.geometry as RouteGeometry };
  } catch {
    const km = haversineKm(person, point);
    return { sec: (km / DRIVE_FALLBACK_KMH) * 3600, geometry: null };
  }
}

// Iteratively nudges a candidate point toward whoever currently has the
// longest adjusted drive time (and slightly away from whoever has the
// shortest), re-checking real road routes each round, until the spread
// between people's adjusted times falls inside the tolerance band or the
// iteration budget runs out.
async function findFairDrivingSpot(people: PersonInput[]) {
  let candidate = clampToNyc(centroid(people));
  let best: { candidate: { lat: number; lon: number }; legs: { sec: number; geometry: RouteGeometry | null }[]; spread: number } | null = null;

  const MAX_ITERS = 7;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    const legs = await Promise.all(people.map((p) => drivingSecTo(p, candidate)));
    const adjusted = legs.map((l, i) => l.sec * people[i].delayFactor);
    const max = Math.max(...adjusted);
    const min = Math.min(...adjusted);
    const spread = max - min;

    if (!best || spread < best.spread) {
      best = { candidate, legs, spread };
    }
    if (spread <= TOLERANCE_HIGH_SEC) break;

    const slowIdx = adjusted.indexOf(max);
    const fastIdx = adjusted.indexOf(min);
    const step = 0.24 * Math.pow(0.82, iter);
    candidate = clampToNyc({
      lat: candidate.lat + (people[slowIdx].lat - candidate.lat) * step - (people[fastIdx].lat - candidate.lat) * step * 0.35,
      lon: candidate.lon + (people[slowIdx].lon - candidate.lon) * step - (people[fastIdx].lon - candidate.lon) * step * 0.35,
    });
  }

  return best!;
}

async function findFairTransitSpot(people: PersonInput[], stations: Station[], alerts: SubwayAlert[]) {
  // Each person's nearest home station + a real walking route to it (computed once).
  const home = await Promise.all(
    people.map(async (p) => {
      const near = nearestStation({ lat: p.lat, lon: p.lon }, stations);
      let walkSec = (near.distanceKm / WALK_FALLBACK_KMH) * 3600;
      let walkGeometry: RouteGeometry | null = null;
      try {
        const r = await mapboxDirections({ lat: p.lat, lon: p.lon }, near.station, "walking");
        walkSec = r.durationSec;
        walkGeometry = r.geometry as RouteGeometry;
      } catch {
        // keep haversine fallback
      }
      return { person: p, station: near.station, walkSec, walkGeometry };
    }),
  );

  // Score every real station (445 total -- cheap, no external calls). Unlike
  // the driving search (which can nudge a candidate point continuously),
  // transit candidates are a fixed set of stations, so instead of a single
  // blended score we explicitly optimize for fairness first: prefer stations
  // where everyone's adjusted time falls within the tolerance band, and only
  // among those (or, failing that, among the closest-to-tolerance stations)
  // break ties by overall speed. A pure "total + max*1.5" score can pick a
  // station that's fast overall but wildly uneven between people, which is
  // exactly what "genuinely fair" is supposed to avoid.
  type Candidate = {
    candidate: Station;
    perPerson: TransitPersonResult[];
    spread: number;
    total: number;
    max: number;
    score: number;
  };
  const evaluated: Candidate[] = [];

  for (const candidate of stations) {
    const perPerson: TransitPersonResult[] = home.map((h) => {
      const path = findTransitPath(h.station, candidate, stations);
      const legRoutes = path.legs.map((l) => l.route);
      const { multiplier, matched } = delayMultiplierForRoutes(alerts, legRoutes);
      const rawSec = h.walkSec + path.subwaySec * multiplier;
      return {
        personName: h.person.name,
        mode: "transit",
        rawSec,
        adjustedSec: rawSec * h.person.delayFactor,
        walkToStationSec: h.walkSec,
        walkToGeometry: h.walkGeometry,
        // Real track geometry is looked up only for the winning candidate
        // below (getLegGeometry is too costly to run for all 445 candidates).
        legs: path.legs.map((l) => ({ route: l.route, board: l.board, alight: l.alight, geometry: null })),
        transferCount: path.transferCount,
        alertMultiplier: multiplier,
        matchedAlerts: matched,
      };
    });
    const adjustedTimes = perPerson.map((p) => p.adjustedSec);
    const max = Math.max(...adjustedTimes);
    const min = Math.min(...adjustedTimes);
    const spread = max - min;
    const total = adjustedTimes.reduce((a, b) => a + b, 0);
    const score = total + max * 1.5;
    evaluated.push({ candidate, perPerson, spread, total, max, score });
  }

  const withinTolerance = evaluated.filter((e) => e.spread <= TOLERANCE_HIGH_SEC);
  let winner: Candidate;
  if (withinTolerance.length > 0) {
    // Among genuinely fair options, pick the fastest (lowest total time).
    withinTolerance.sort((a, b) => a.total - b.total);
    winner = withinTolerance[0];
  } else {
    // No station achieves the tolerance band (can happen when people are
    // spread very far apart across the system) -- fall back to whichever
    // station minimizes the spread itself, not overall speed, since fairness
    // is the priority. Break ties by total time.
    evaluated.sort((a, b) => (a.spread !== b.spread ? a.spread - b.spread : a.total - b.total));
    winner = evaluated[0];
  }

  // Now that the winning station is known, look up the real track geometry
  // (actual curves/turns) for just its legs -- too costly to do for all 445
  // candidates above.
  winner.perPerson.forEach((p) => {
    p.legs = p.legs.map((l) => ({ ...l, geometry: getLegGeometry(l.route, l.board, l.alight) }));
  });

  return winner;
}

export async function findFairSpot(
  people: PersonInput[],
  mode: "driving" | "transit",
  stations: Station[],
  alerts: SubwayAlert[],
): Promise<FairSpotResult> {
  if (mode === "driving") {
    const result = await findFairDrivingSpot(people);
    const perPerson: DrivingPersonResult[] = people.map((p, i) => ({
      personName: p.name,
      mode: "driving",
      rawSec: result.legs[i].sec,
      adjustedSec: result.legs[i].sec * p.delayFactor,
      geometry: result.legs[i].geometry,
    }));
    const adjustedTimes = perPerson.map((p) => p.adjustedSec);
    const totalTime = adjustedTimes.reduce((a, b) => a + b, 0);
    const maxTrip = Math.max(...adjustedTimes);
    const score = totalTime + maxTrip * 1.5;

    const geocode = await mapboxReverseGeocode(result.candidate.lat, result.candidate.lon);
    const nearStation = nearestStation(result.candidate, stations);

    return {
      mode: "driving",
      lat: result.candidate.lat,
      lon: result.candidate.lon,
      address: geocode?.address ?? `${result.candidate.lat.toFixed(4)}, ${result.candidate.lon.toFixed(4)}`,
      neighborhood: geocode?.neighborhood ?? nearStation.station.borough,
      nearestStationHint: nearStation.station.name,
      spreadSec: result.spread,
      toleranceLowSec: TOLERANCE_LOW_SEC,
      toleranceHighSec: TOLERANCE_HIGH_SEC,
      withinTolerance: result.spread <= TOLERANCE_HIGH_SEC,
      totalTime,
      maxTrip,
      score,
      perPerson,
    };
  }

  const result = await findFairTransitSpot(people, stations, alerts);
  const geocode = await mapboxReverseGeocode(result.candidate.lat, result.candidate.lon);

  return {
    mode: "transit",
    lat: result.candidate.lat,
    lon: result.candidate.lon,
    address: geocode?.address ?? result.candidate.name,
    neighborhood: geocode?.neighborhood ?? result.candidate.borough,
    nearestStationHint: result.candidate.name,
    spreadSec: result.spread,
    toleranceLowSec: TOLERANCE_LOW_SEC,
    toleranceHighSec: TOLERANCE_HIGH_SEC,
    withinTolerance: result.spread <= TOLERANCE_HIGH_SEC,
    totalTime: result.total,
    maxTrip: result.max,
    score: result.score,
    perPerson: result.perPerson,
  };
}
