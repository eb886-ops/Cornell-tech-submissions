import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { PersonSpotResult, TravelMode } from "@/lib/travel";
import { formatDuration } from "@/lib/travel";

const TRACKER_COLOR = "#c1502e";
const WALK_COLOR = "#8a8f96";
// Wall-clock length of the simulated playback, independent of real travel time.
const PLAYBACK_MS = 9000;

function interpolate(a: [number, number], b: [number, number], steps: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

interface PathSegment {
  points: [number, number][];
  color: string;
  dashed?: boolean;
}

function buildSegments(
  result: PersonSpotResult,
  mode: TravelMode,
  routeMeta: Record<string, { color?: string; textColor?: string }> | undefined,
): PathSegment[] {
  if (mode === "driving" && result.driving?.geometry) {
    return [
      {
        points: result.driving.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
        color: TRACKER_COLOR,
      },
    ];
  }
  if (mode === "transit" && result.transit) {
    const t = result.transit;
    const firstBoard: [number, number] = t.legs[0] ? [t.legs[0].board.lat, t.legs[0].board.lon] : [0, 0];
    const walkPoints = t.walkToGeometry?.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]) ?? [
      firstBoard,
    ];
    const segments: PathSegment[] = [{ points: walkPoints, color: WALK_COLOR, dashed: true }];
    t.legs.forEach((leg) => {
      const meta = routeMeta?.[leg.route];
      const color = meta?.color ?? TRACKER_COLOR;
      const points = leg.geometry
        ? leg.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])
        : interpolate([leg.board.lat, leg.board.lon], [leg.alight.lat, leg.alight.lon], 12);
      segments.push({ points, color });
    });
    return segments;
  }
  return [];
}

function FitToPath({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length === 0) return;
    map.fitBounds(L.latLngBounds(path), { padding: [28, 28], maxZoom: 16 });
  }, [JSON.stringify(path)]);
  return null;
}

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;border-radius:50%;background:${TRACKER_COLOR};
    border:2px solid white;box-shadow:0 0 0 4px rgba(193,80,46,0.25),0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface DemoTrackerProps {
  result: PersonSpotResult;
  mode: TravelMode;
  spotName: string;
}

export function DemoTracker({ result, mode, spotName }: DemoTrackerProps) {
  const { data: stationsData } = useQuery<{ routes: Record<string, { color?: string; textColor?: string }> }>({
    queryKey: ["/api/stations"],
  });

  const segments = useMemo(
    () => buildSegments(result, mode, stationsData?.routes),
    [result, mode, stationsData],
  );
  const path = useMemo<[number, number][]>(() => segments.flatMap((s) => s.points), [segments]);
  const totalSec = mode === "driving" ? result.driving?.adjustedSec : result.transit?.adjustedSec;

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  // Reset playback whenever the underlying route changes (person, spot, or mode switch).
  useEffect(() => {
    setPlaying(false);
    startRef.current = null;
    setProgress(0);
  }, [result.personName, spotName, mode]);

  useEffect(() => {
    if (!playing) return;
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / PLAYBACK_MS);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  function handlePlay() {
    if (progress >= 1) {
      setProgress(0);
    }
    startRef.current = null;
    setPlaying(true);
  }

  function handleReset() {
    setPlaying(false);
    startRef.current = null;
    setProgress(0);
  }

  if (path.length < 2) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center" data-testid="text-tracker-unavailable">
        Route data isn't available for a demo track yet.
      </div>
    );
  }

  const idx = Math.min(path.length - 1, Math.floor(progress * (path.length - 1)));
  const markerPos = path[idx];
  const remainingSec = totalSec !== undefined ? Math.max(0, totalSec * (1 - progress)) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md overflow-hidden border border-card-border h-[260px]" data-testid="demo-tracker-map">
        <MapContainer center={path[0]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToPath path={path} />
          {segments.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.points}
              pathOptions={{
                color: seg.color,
                weight: seg.dashed ? 3 : 4,
                opacity: seg.dashed ? 0.6 : 0.85,
                dashArray: seg.dashed ? "4 6" : undefined,
              }}
            />
          ))}
          <Marker position={markerPos} icon={markerIcon} />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={playing ? () => setPlaying(false) : handlePlay}
            data-testid="button-tracker-playpause"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset} data-testid="button-tracker-reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Badge variant="secondary" className="text-xs whitespace-nowrap" data-testid="badge-demo-simulation">
            Demo simulation — not live GPS
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap" data-testid="text-tracker-eta">
          {remainingSec !== undefined ? `${formatDuration(remainingSec)} to ${spotName}` : ""}
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
          data-testid="progress-tracker"
        />
      </div>
    </div>
  );
}
