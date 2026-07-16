// Real subway track geometry, derived from the MTA's static GTFS `shapes.txt`
// (the actual curves and turns each train physically follows) rather than a
// straight line between the boarding and alighting stations. Loaded once at
// startup from a pre-processed JSON file kept at FULL point resolution (see
// mta_data/process_shapes_raw.py for how it was generated from the raw feed)
// so that every real station snaps to its true nearest track point -- an
// earlier simplified version occasionally dropped the exact point nearest a
// station, causing valid legs to fail matching. Simplification is applied
// only to the small extracted board->alight segment right before it's sent
// to the client, not to the full route.

import { readFileSync } from "fs";
import path from "path";
import { haversineKm } from "./subway-router";
import type { RouteGeometry } from "./geometry-types";

// Resolved relative to process.cwd() (not __dirname) because the bundled
// server output (dist/index.cjs) is a single file with no dist-relative
// data folder alongside it -- see server/routes.ts for the same pattern.
const dataDir = path.join(process.cwd(), "server", "data");
const rawShapes: Record<string, [number, number][][]> = JSON.parse(
  readFileSync(path.join(dataDir, "subway-shapes-raw.json"), "utf-8"),
);

// The station-facing route codes (e.g. "S", "SIR") don't always match the
// GTFS route_ids used in shapes.txt (which distinguishes shuttles as GS/FS/H
// and Staten Island Railway as SI, plus express variants like 6X/7X/FX that
// share the same physical track as their parent line).
const ROUTE_ID_ALIASES: Record<string, string[]> = {
  "6": ["6", "6X"],
  "7": ["7", "7X"],
  F: ["F", "FX"],
  S: ["GS", "FS", "H"],
  SIR: ["SI"],
};

function shapeRouteIdsFor(route: string): string[] {
  return ROUTE_ID_ALIASES[route] ?? [route];
}

// Maximum distance (km) a station can be from a shape's track points and
// still be considered "on" that shape. Stations are set right on the
// centerline in this feed, so this only needs to absorb minor rounding --
// but keep it generous enough for slightly offset station reference points.
const MAX_SNAP_KM = 0.25;

function nearestIndex(points: [number, number][], target: { lat: number; lon: number }) {
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const [lat, lon] = points[i];
    const d = haversineKm({ lat, lon }, target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { index: bestIdx, distanceKm: bestDist };
}

// Douglas-Peucker simplification, applied only to the small extracted
// segment (never the full route) so client polylines stay lightweight
// without losing the station-snapped endpoints.
function perpendicularDistance(pt: [number, number], start: [number, number], end: [number, number]): number {
  const [x, y] = pt;
  const [x1, y1] = start;
  const [x2, y2] = end;
  if (x1 === x2 && y1 === y2) return Math.hypot(x - x1, y - y1);
  const num = Math.abs((x2 - x1) * (y - y1) - (x - x1) * (y2 - y1));
  const den = Math.hypot(x2 - x1, y2 - y1);
  return num / den;
}

function simplify(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon);
    const right = simplify(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

const SIMPLIFY_EPSILON_DEG = 0.00003; // ~3m -- only kicks in for long express legs
const SIMPLIFY_MIN_POINTS = 400;

/**
 * Returns the real track geometry between two stations on a given subway
 * route, following the actual curves the train makes, or null if no
 * confident match is found (callers should fall back to a straight line).
 */
export function getLegGeometry(
  route: string,
  board: { lat: number; lon: number },
  alight: { lat: number; lon: number },
): RouteGeometry | null {
  const ids = shapeRouteIdsFor(route);
  let best: { points: [number, number][]; iBoard: number; iAlight: number; cost: number } | null = null;

  for (const id of ids) {
    const variants = rawShapes[id];
    if (!variants) continue;
    for (const points of variants) {
      const nb = nearestIndex(points, board);
      if (nb.distanceKm > MAX_SNAP_KM) continue;
      const na = nearestIndex(points, alight);
      if (na.distanceKm > MAX_SNAP_KM) continue;
      const cost = nb.distanceKm + na.distanceKm;
      if (!best || cost < best.cost) {
        best = { points, iBoard: nb.index, iAlight: na.index, cost };
      }
    }
  }

  if (!best || best.iBoard === best.iAlight) return null;

  const lo = Math.min(best.iBoard, best.iAlight);
  const hi = Math.max(best.iBoard, best.iAlight);
  let slice = best.points.slice(lo, hi + 1);
  if (best.iBoard > best.iAlight) slice = slice.slice().reverse();
  if (slice.length > SIMPLIFY_MIN_POINTS) slice = simplify(slice, SIMPLIFY_EPSILON_DEG);

  return {
    type: "LineString",
    coordinates: slice.map(([lat, lon]) => [lon, lat]),
  };
}
