// Shared geometry type, split out so subway-shapes.ts and meetup-finder.ts
// can both depend on it without an import cycle.
export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}
