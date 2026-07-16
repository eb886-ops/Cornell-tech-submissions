import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import type { FairSpotSnapshot } from "@/lib/travel";
import { formatDuration } from "@/lib/travel";
import { useQuery } from "@tanstack/react-query";

interface ResultsPanelProps {
  snapshot: FairSpotSnapshot;
}

export function ResultsPanel({ snapshot }: ResultsPanelProps) {
  const { data: stationsData } = useQuery<{ routes: Record<string, { color?: string; textColor?: string }> }>({
    queryKey: ["/api/stations"],
  });

  const spreadMins = Math.round(snapshot.spreadSec / 60);

  return (
    <div className="flex flex-col gap-4" data-testid="results-panel">
      <div className="rounded-md border border-card-border px-4 py-3.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif text-base" data-testid="text-fair-spot-address">
              {snapshot.spot.name}
            </span>
            <span className="text-xs text-muted-foreground" data-testid="text-fair-spot-neighborhood">
              {snapshot.spot.neighborhood} · nearest station: {snapshot.spot.nearestStationHint}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {snapshot.withinTolerance ? (
            <Badge className="text-xs gap-1" data-testid="badge-fairness-within">
              <CheckCircle2 className="h-3 w-3" /> Within {spreadMins <= 1 ? "a minute" : `${spreadMins} min`} for everyone
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1" data-testid="badge-fairness-outside">
              <AlertTriangle className="h-3 w-3" /> {spreadMins} min spread — closest achievable given real routes
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-mono pt-0.5">
          total {formatDuration(snapshot.totalTime)} · worst trip {formatDuration(snapshot.maxTrip)} · score{" "}
          {snapshot.score.toFixed(0)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {snapshot.perPerson.map((p) => (
          <div
            key={p.personName}
            className="rounded-md border border-card-border px-3.5 py-2.5 flex flex-col gap-1.5"
            data-testid={`row-person-${p.personName}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{p.personName}</span>
              <span className="text-sm font-mono" data-testid={`text-time-${p.personName}`}>
                {formatDuration((p.driving ?? p.transit)?.adjustedSec ?? NaN)}
              </span>
            </div>

            {p.driving && <div className="text-xs text-muted-foreground">Driving, real road route</div>}

            {p.transit && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                  <span>Walk {formatDuration(p.transit.walkToStationSec)}</span>
                  {p.transit.legs.map((leg, i) => {
                    const meta = stationsData?.routes?.[leg.route];
                    return (
                      <span key={i} className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        <span
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{
                            backgroundColor: meta?.color ?? "#4c4c4c",
                            color: meta?.textColor ?? "#ffffff",
                          }}
                        >
                          {leg.route}
                        </span>
                        <span>{leg.alight.name}</span>
                      </span>
                    );
                  })}
                </div>
                {p.transit.transferCount >= 1 && (
                  <span className="text-xs text-muted-foreground">
                    {p.transit.transferCount === 1 ? "1 transfer" : `${p.transit.transferCount} transfers`}
                  </span>
                )}
                {p.transit.transferCount === -1 && (
                  <span className="text-xs text-muted-foreground">Estimated path — exact transfer uncertain</span>
                )}
                {p.transit.matchedAlerts.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive flex-wrap">
                    <span className="flex items-center gap-1 shrink-0">
                      {p.transit.matchedAlerts[0].routes.slice(0, 3).map((r) => {
                        const meta = stationsData?.routes?.[r];
                        return (
                          <span
                            key={r}
                            className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-semibold"
                            style={{
                              backgroundColor: meta?.color ?? "#4c4c4c",
                              color: meta?.textColor ?? "#ffffff",
                            }}
                          >
                            {r}
                          </span>
                        );
                      })}
                    </span>
                    Live delay applied ({p.transit.matchedAlerts[0].headerText})
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
