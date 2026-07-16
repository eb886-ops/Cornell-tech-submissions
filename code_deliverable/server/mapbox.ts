// The Mapbox credential is injected via a pass-through endpoint when this
// server process is started with api_credentials=["custom-cred:api.mapbox.com"]
// (or, for the published site, via publish_website's `credentials` param).
// CUSTOM_CRED_API_MAPBOX_COM_URL is an internal proxy base URL
// (agent-proxy.perplexity.ai/agent_pass_through), and
// CUSTOM_CRED_API_MAPBOX_COM_TOKEN is the proxy's own bearer credential
// (an `agp_...` token) sent as the `x-api-key` header — NOT a real Mapbox
// `pk.*` token, and NOT something to append as a `?access_token=` query
// param. The proxy authenticates to the real Mapbox API on our behalf.
const MAPBOX_BASE_URL = process.env.CUSTOM_CRED_API_MAPBOX_COM_URL;
const MAPBOX_TOKEN = process.env.CUSTOM_CRED_API_MAPBOX_COM_TOKEN;

function mapboxUrl(pathAndQuery: string): string {
  if (!MAPBOX_BASE_URL) {
    throw new Error("Mapbox credential is not configured on this server.");
  }
  return `${MAPBOX_BASE_URL}${pathAndQuery}`;
}

function mapboxHeaders(): Record<string, string> {
  return MAPBOX_TOKEN ? { "x-api-key": MAPBOX_TOKEN } : {};
}

export interface GeocodeSuggestion {
  name: string;
  fullAddress: string;
  lat: number;
  lon: number;
}

export async function mapboxAutocomplete(query: string): Promise<GeocodeSuggestion[]> {
  const path = `/geocoding/v5/mapbox.places/${encodeURIComponent(
    query,
  )}.json?autocomplete=true&limit=5&bbox=-74.3,40.47,-73.65,40.95&types=address,poi,place,neighborhood`;
  const res = await fetch(mapboxUrl(path), { headers: mapboxHeaders() });
  if (!res.ok) {
    throw new Error(`Mapbox geocoding failed: ${res.status}`);
  }
  const data: any = await res.json();
  // The bbox param above is a soft bias, not a hard filter — Fort Lee, NJ
  // and similar Hudson-adjacent NJ spots still fall inside those lat/lon
  // bounds. The original app spec excludes New Jersey entirely, so drop
  // any result whose place name resolves there.
  return (data.features || [])
    .filter((f: any) => !String(f.place_name || "").includes("New Jersey"))
    .map((f: any) => ({
      name: f.text,
      fullAddress: f.place_name,
      lat: f.center[1],
      lon: f.center[0],
    }));
}

export interface ReverseGeocodeResult {
  address: string; // e.g. "137 E 13th St" (house number + street, when available)
  fullAddress: string;
  neighborhood: string | null;
}

// Reverse-geocodes a point to the nearest real street address. Used so a
// computed "fair meeting point" can be shown with an actual street number
// instead of a bare lat/lon.
export async function mapboxReverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
  const path = `/geocoding/v5/mapbox.places/${lon},${lat}.json?types=address&limit=1`;
  const res = await fetch(mapboxUrl(path), { headers: mapboxHeaders() });
  if (!res.ok) return null;
  const data: any = await res.json();
  const f = data.features?.[0];
  if (!f) return null;
  const address = f.address ? `${f.address} ${f.text}` : f.text;
  const neighborhood =
    (f.context || []).find((c: any) => String(c.id || "").startsWith("neighborhood"))?.text ??
    (f.context || []).find((c: any) => String(c.id || "").startsWith("locality"))?.text ??
    (f.context || []).find((c: any) => String(c.id || "").startsWith("place"))?.text ??
    null;
  return { address, fullAddress: f.place_name, neighborhood };
}

export interface DirectionsResult {
  durationSec: number;
  distanceMeters: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
}

// profile: "driving-traffic" | "walking"
export async function mapboxDirections(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  profile: "driving-traffic" | "walking",
): Promise<DirectionsResult> {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const path = `/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full`;
  const res = await fetch(mapboxUrl(path), { headers: mapboxHeaders() });
  if (!res.ok) {
    throw new Error(`Mapbox directions failed: ${res.status}`);
  }
  const data: any = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    throw new Error("No route found");
  }
  return {
    durationSec: route.duration,
    distanceMeters: route.distance,
    geometry: route.geometry,
  };
}
