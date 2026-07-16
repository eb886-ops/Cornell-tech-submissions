import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import type { FairSpot, PersonSpotResult, TravelMode } from "@/lib/travel";

// Distinct, warm-palette-friendly colors for up to 5 people.
const PERSON_COLORS = ["#c1502e", "#2e6b73", "#a5762f", "#4c7a4a", "#8b4a6b"];

function pinIcon(color: string, label: string, large = false, textColor = "white") {
  const size = large ? 30 : 24;
  const fontSize = label.length > 1 ? (large ? 10 : 9) : large ? 13 : 11;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};color:${textColor};display:flex;align-items:center;justify-content:center;
      font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:${fontSize}px;
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [JSON.stringify(points)]);
  return null;
}

interface MapPreviewProps {
  spot: FairSpot;
  perPerson: PersonSpotResult[];
  peopleLatLon: { name: string; lat: number; lon: number }[];
  mode: TravelMode;
}

export function MapPreview({ spot, perPerson, peopleLatLon, mode }: MapPreviewProps) {
  const { data: stationsData } = useQuery<{ routes: Record<string, { color?: string; textColor?: string }> }>({
    queryKey: ["/api/stations"],
  });

  const points = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [[spot.lat, spot.lon]];
    peopleLatLon.forEach((p) => pts.push([p.lat, p.lon]));
    return pts;
  }, [spot, peopleLatLon]);

  return (
    <div className="rounded-md overflow-hidden border border-card-border h-[360px] relative" data-testid="map-preview">
      <MapContainer
        center={[spot.lat, spot.lon]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        <Marker position={[spot.lat, spot.lon]} icon={pinIcon("#18222b", "M", true)}>
          <Tooltip permanent direction="top" offset={[0, -14]}>
            {spot.name}
          </Tooltip>
        </Marker>

        {peopleLatLon.map((p, i) => {
          const color = PERSON_COLORS[i % PERSON_COLORS.length];
          const result = perPerson.find((r) => r.personName === p.name);

          return (
            <div key={p.name}>
              <Marker position={[p.lat, p.lon]} icon={pinIcon(color, p.name.charAt(0).toUpperCase())}>
                <Tooltip direction="top" offset={[0, -12]}>
                  {p.name}
                </Tooltip>
              </Marker>

              {mode === "driving" && result?.driving?.geometry && (
                <Polyline
                  positions={result.driving.geometry.coordinates.map(([lon, lat]) => [lat, lon])}
                  pathOptions={{ color, weight: 3, opacity: 0.75 }}
                />
              )}

              {mode === "transit" && result?.transit && (
                <>
                  {result.transit.walkToGeometry && (
                    <Polyline
                      positions={result.transit.walkToGeometry.coordinates.map(([lon, lat]) => [lat, lon])}
                      pathOptions={{ color, weight: 3, opacity: 0.6, dashArray: "4 6" }}
                    />
                  )}
                  {result.transit.legs.map((leg, i) => {
                    const meta = stationsData?.routes?.[leg.route];
                    const lineColor = meta?.color ?? "#4c4c4c";
                    const textColor = meta?.textColor ?? "#ffffff";
                    // Real track geometry when available, otherwise fall back
                    // to a straight line between the two stations.
                    const positions: [number, number][] = leg.geometry
                      ? leg.geometry.coordinates.map(([lon, lat]) => [lat, lon])
                      : [
                          [leg.board.lat, leg.board.lon],
                          [leg.alight.lat, leg.alight.lon],
                        ];
                    return (
                      <div key={i}>
                        <Polyline positions={positions} pathOptions={{ color: lineColor, weight: 4, opacity: 0.9 }} />
                        <Marker position={[leg.board.lat, leg.board.lon]} icon={pinIcon(lineColor, leg.route, false, textColor)}>
                          <Tooltip direction="top" offset={[0, -12]}>
                            {leg.board.name} ({leg.route} train)
                          </Tooltip>
                        </Marker>
                        {i === result.transit!.legs.length - 1 && (
                          <Marker position={[leg.alight.lat, leg.alight.lon]} icon={pinIcon(lineColor, leg.route, false, textColor)}>
                            <Tooltip direction="top" offset={[0, -12]}>
                              {leg.alight.name}
                            </Tooltip>
                          </Marker>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
