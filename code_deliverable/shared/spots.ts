// The four fixed meetup spots, per the original app spec. Coordinates are
// the real-world locations so live directions/routing can be computed
// against them.
export interface MeetupSpot {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lon: number;
  // Nearby subway complex ids (from server/data/subway-stations.json) used
  // as the "walk to station" endpoint for the transit leg.
  nearestStationHint: string;
}

export const MEETUP_SPOTS: MeetupSpot[] = [
  {
    id: "herald-square",
    name: "Herald Square",
    neighborhood: "Midtown",
    lat: 40.7500,
    lon: -73.9877,
    nearestStationHint: "34 St-Herald Sq",
  },
  {
    id: "union-square",
    name: "Union Square",
    neighborhood: "Downtown",
    lat: 40.7359,
    lon: -73.9911,
    nearestStationHint: "14 St-Union Sq",
  },
  {
    id: "world-trade-center",
    name: "World Trade Center",
    neighborhood: "Lower Manhattan",
    lat: 40.7126,
    lon: -74.0099,
    nearestStationHint: "World Trade Center",
  },
  {
    id: "atlantic-terminal",
    name: "Atlantic Terminal",
    neighborhood: "Brooklyn",
    lat: 40.6840,
    lon: -73.9772,
    nearestStationHint: "Atlantic Av-Barclays Ctr",
  },
];
