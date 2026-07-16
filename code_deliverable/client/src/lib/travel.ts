import { apiRequest } from "@/lib/queryClient";
import type { SubwayStation } from "@/lib/geo";
import type { Person } from "@shared/schema";

export interface SubwayAlert {
  id: string;
  routes: string[];
  headerText: string;
  descriptionText: string;
  severity: "info" | "delay" | "suspended";
}

export type TravelMode = "driving" | "transit";

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface DrivingResult {
  mode: "driving";
  rawSec: number;
  adjustedSec: number;
  geometry: RouteGeometry | null;
}

export interface TransitLegResult {
  route: string;
  board: SubwayStation;
  alight: SubwayStation;
  // Real subway track geometry (actual curves/turns), null if no confident
  // match was found -- render a straight line between board/alight instead.
  geometry: RouteGeometry | null;
}

export interface TransitResult {
  mode: "transit";
  rawSec: number;
  adjustedSec: number;
  walkToStationSec: number;
  walkToGeometry: RouteGeometry | null;
  legs: TransitLegResult[];
  // 0 = direct ride, 1+ = number of transfers, -1 = no confident path found
  transferCount: number;
  alertMultiplier: number;
  matchedAlerts: SubwayAlert[];
}

export interface PersonSpotResult {
  personName: string;
  driving?: DrivingResult;
  transit?: TransitResult;
}

// A dynamically computed meeting point -- not one of a fixed set of
// landmarks. Shaped compatibly with the old MeetupSpot so the map and
// tracker components need minimal changes.
export interface FairSpot {
  id: "dynamic";
  name: string; // the reverse-geocoded street address, e.g. "137 E 13th St"
  neighborhood: string;
  lat: number;
  lon: number;
  nearestStationHint: string;
}

export interface FairSpotSnapshot {
  mode: TravelMode;
  spot: FairSpot;
  perPerson: PersonSpotResult[];
  totalTime: number;
  maxTrip: number;
  score: number;
  spreadSec: number;
  toleranceLowSec: number;
  toleranceHighSec: number;
  withinTolerance: boolean;
}

interface FindSpotApiResponse {
  mode: TravelMode;
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
  perPerson: Array<
    | {
        personName: string;
        mode: "driving";
        rawSec: number;
        adjustedSec: number;
        geometry: RouteGeometry | null;
      }
    | {
        personName: string;
        mode: "transit";
        rawSec: number;
        adjustedSec: number;
        walkToStationSec: number;
        walkToGeometry: RouteGeometry | null;
        legs: TransitLegResult[];
        transferCount: number;
        alertMultiplier: number;
        matchedAlerts: SubwayAlert[];
      }
  >;
}

// Searches for a genuinely fair meeting point given the current people and
// mode -- computed against real streets/routes on the backend, not picked
// from a fixed list and not a straight-line midpoint.
export async function findFairSpot(people: Person[], mode: TravelMode): Promise<FairSpotSnapshot> {
  const res = await apiRequest("POST", "/api/meetup/find", { people, mode });
  const data: FindSpotApiResponse = await res.json();

  const perPerson: PersonSpotResult[] = data.perPerson.map((p) => {
    if (p.mode === "driving") {
      return {
        personName: p.personName,
        driving: { mode: "driving", rawSec: p.rawSec, adjustedSec: p.adjustedSec, geometry: p.geometry },
      };
    }
    return {
      personName: p.personName,
      transit: {
        mode: "transit",
        rawSec: p.rawSec,
        adjustedSec: p.adjustedSec,
        walkToStationSec: p.walkToStationSec,
        walkToGeometry: p.walkToGeometry,
        legs: p.legs,
        transferCount: p.transferCount,
        alertMultiplier: p.alertMultiplier,
        matchedAlerts: p.matchedAlerts,
      },
    };
  });

  return {
    mode: data.mode,
    spot: {
      id: "dynamic",
      name: data.address,
      neighborhood: data.neighborhood,
      lat: data.lat,
      lon: data.lon,
      nearestStationHint: data.nearestStationHint,
    },
    perPerson,
    totalTime: data.totalTime,
    maxTrip: data.maxTrip,
    score: data.score,
    spreadSec: data.spreadSec,
    toleranceLowSec: data.toleranceLowSec,
    toleranceHighSec: data.toleranceHighSec,
    withinTolerance: data.withinTolerance,
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
