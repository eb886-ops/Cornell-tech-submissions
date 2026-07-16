// A lightweight subway trip planner built directly from the MTA's static
// station/route data (server/data/subway-stations.json + subway-routes.json).
//
// The MTA does not publish a free multi-leg journey-planning API, so this
// approximates real trip planning using the data we do have: which routes
// serve which stations. It finds direct rides (shared route, no transfer),
// then one-transfer rides (a station that serves a route reaching the origin
// AND a route reaching the destination, filtered to stations that don't
// create a wild detour), then falls back to known major transfer hubs for a
// best-effort two-leg path. This is a heuristic, not an official schedule --
// but it is derived from real line/station data rather than a straight line.

export interface Station {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lon: number;
  routes: string[];
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function nearestStation(
  point: { lat: number; lon: number },
  stations: Station[],
): { station: Station; distanceKm: number } {
  let best: { station: Station; distanceKm: number } | null = null;
  for (const station of stations) {
    const d = haversineKm(point, station);
    if (!best || d < best.distanceKm) best = { station, distanceKm: d };
  }
  return best!;
}

export const SUBWAY_AVG_KMH = 27;
export const TRANSIT_OVERHEAD_SEC = 150; // boarding/alighting + dwell per leg
export const TRANSFER_OVERHEAD_SEC = 210; // extra platform-change + wait time per transfer

export interface TransitLeg {
  route: string;
  board: Station;
  alight: Station;
  distanceKm: number;
}

export interface TransitPath {
  legs: TransitLeg[];
  transferCount: number; // 0 = direct, 1/2 = transfers, -1 = uncertain fallback
  subwaySec: number;
}

// A short list of major multi-line transfer complexes used as a fallback
// when no single shared-route or clean one-transfer path exists.
const MAJOR_HUBS = [
  "Times Sq-42 St",
  "Fulton St",
  "14 St-Union Sq",
  "Grand Central-42 St",
  "Atlantic Av-Barclays Ctr",
  "Jay St-MetroTech",
  "Court Sq",
  "Broadway Junction",
];

export function findTransitPath(from: Station, to: Station, stations: Station[]): TransitPath {
  if (from.id === to.id) {
    return { legs: [], transferCount: 0, subwaySec: 0 };
  }

  // Direct: origin and destination stations share at least one route.
  const shared = from.routes.filter((r) => to.routes.includes(r));
  if (shared.length > 0) {
    const distanceKm = haversineKm(from, to);
    return {
      legs: [{ route: shared[0], board: from, alight: to, distanceKm }],
      transferCount: 0,
      subwaySec: (distanceKm / SUBWAY_AVG_KMH) * 3600 + TRANSIT_OVERHEAD_SEC,
    };
  }

  const directKm = haversineKm(from, to);

  // One transfer: some station T serves a route reaching `from` and a
  // different route reaching `to`. Reject detours that are wildly out of the
  // way (heuristic guard since we lack real stop-sequence ordering).
  let best: { station: Station; r1: string; r2: string; cost: number } | null = null;
  for (const s of stations) {
    if (s.id === from.id || s.id === to.id) continue;
    const r1 = from.routes.find((r) => s.routes.includes(r));
    if (!r1) continue;
    const r2 = to.routes.find((r) => s.routes.includes(r) && r !== r1);
    if (!r2) continue;
    const legCost = haversineKm(from, s) + haversineKm(s, to);
    if (legCost > directKm * 1.6 + 1.2) continue; // too much of a detour to be realistic
    if (!best || legCost < best.cost) best = { station: s, r1, r2, cost: legCost };
  }
  if (best) {
    const d1 = haversineKm(from, best.station);
    const d2 = haversineKm(best.station, to);
    return {
      legs: [
        { route: best.r1, board: from, alight: best.station, distanceKm: d1 },
        { route: best.r2, board: best.station, alight: to, distanceKm: d2 },
      ],
      transferCount: 1,
      subwaySec:
        (d1 / SUBWAY_AVG_KMH) * 3600 +
        TRANSIT_OVERHEAD_SEC +
        TRANSFER_OVERHEAD_SEC +
        (d2 / SUBWAY_AVG_KMH) * 3600 +
        TRANSIT_OVERHEAD_SEC,
    };
  }

  // Fallback: route through a major named hub even if it isn't the closest
  // shared station (covers cases where the direct 1-transfer search above
  // found nothing, e.g. outer-borough-to-outer-borough trips).
  for (const hubName of MAJOR_HUBS) {
    const hub1 = stations.find((s) => s.name === hubName && from.routes.some((r) => s.routes.includes(r)));
    const hub2 = stations.find((s) => s.name === hubName && to.routes.some((r) => s.routes.includes(r)));
    if (hub1 && hub2) {
      const r1 = from.routes.find((r) => hub1.routes.includes(r))!;
      const r2 = to.routes.find((r) => hub2.routes.includes(r))!;
      const d1 = haversineKm(from, hub1);
      const d2 = haversineKm(hub2, to);
      return {
        legs: [
          { route: r1, board: from, alight: hub1, distanceKm: d1 },
          { route: r2, board: hub2, alight: to, distanceKm: d2 },
        ],
        transferCount: 1,
        subwaySec:
          (d1 / SUBWAY_AVG_KMH) * 3600 +
          TRANSIT_OVERHEAD_SEC +
          TRANSFER_OVERHEAD_SEC +
          (d2 / SUBWAY_AVG_KMH) * 3600 +
          TRANSIT_OVERHEAD_SEC,
      };
    }
  }

  // Give up gracefully: report a single uncertain leg rather than crashing.
  const distanceKm = haversineKm(from, to);
  return {
    legs: [{ route: from.routes[0] ?? "?", board: from, alight: to, distanceKm }],
    transferCount: -1,
    subwaySec: (distanceKm / SUBWAY_AVG_KMH) * 3600 + TRANSIT_OVERHEAD_SEC,
  };
}
