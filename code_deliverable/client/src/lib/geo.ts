export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface SubwayStation {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lon: number;
  routes: string[];
}

export function nearestStation(point: LatLon, stations: SubwayStation[]): { station: SubwayStation; distanceKm: number } | null {
  let best: { station: SubwayStation; distanceKm: number } | null = null;
  for (const station of stations) {
    const d = haversineKm(point, station);
    if (!best || d < best.distanceKm) {
      best = { station, distanceKm: d };
    }
  }
  return best;
}
