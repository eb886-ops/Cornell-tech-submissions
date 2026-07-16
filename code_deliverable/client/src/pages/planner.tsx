import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteNav } from "@/components/site-nav";
import { PersonCard, type PersonFormState } from "@/components/person-card";
import { ResultsPanel } from "@/components/results-panel";
import { MapPreview } from "@/components/map-preview";
import { DemoTracker } from "@/components/demo-tracker";
import { SavedRoutesList } from "@/components/saved-routes-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { findFairSpot, type FairSpotSnapshot, type SubwayAlert, type TravelMode } from "@/lib/travel";
import type { SubwayStation } from "@/lib/geo";
import type { Person } from "@shared/schema";
import { Car, TrainFront, TriangleAlert, Loader2, Bookmark } from "lucide-react";

function makePerson(): PersonFormState {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    address: "",
    lat: null,
    lon: null,
    delayFactor: 1,
  };
}

export default function Planner() {
  const { toast } = useToast();
  const [people, setPeople] = useState<PersonFormState[]>(() => Array.from({ length: 5 }, makePerson));
  const [mode, setMode] = useState<TravelMode>("driving");
  const [snapshot, setSnapshot] = useState<FairSpotSnapshot | null>(null);
  const [lastPeopleUsed, setLastPeopleUsed] = useState<Person[] | null>(null);
  const [trackerPerson, setTrackerPerson] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const { data: stationsData } = useQuery<{ stations: SubwayStation[]; routes: Record<string, any> }>({
    queryKey: ["/api/stations"],
  });
  const { data: alerts = [] } = useQuery<SubwayAlert[]>({
    queryKey: ["/api/mta/alerts"],
    refetchInterval: 60_000,
  });

  const validPeople = useMemo(
    () => people.filter((p) => p.name.trim().length > 0 && p.lat !== null && p.lon !== null),
    [people],
  );

  async function computeWithPeople(personObjs: Person[], modeArg: TravelMode) {
    setComputing(true);
    setError(null);
    try {
      const snap = await findFairSpot(personObjs, modeArg);
      setSnapshot(snap);
      setTrackerPerson(personObjs[0]?.name ?? null);
    } catch (e) {
      setError("Something went wrong finding a fair meeting point. Please try again.");
    } finally {
      setComputing(false);
    }
  }

  async function handleCompute() {
    if (validPeople.length < 2) {
      setError("Add at least 2 people with a name and a selected address.");
      return;
    }
    const personObjs: Person[] = validPeople.map((p) => ({
      name: p.name.trim(),
      address: p.address,
      lat: p.lat as number,
      lon: p.lon as number,
      delayFactor: p.delayFactor,
    }));
    setLastPeopleUsed(personObjs);
    await computeWithPeople(personObjs, mode);
  }

  async function handleModeChange(newMode: TravelMode) {
    setMode(newMode);
    if (lastPeopleUsed) {
      await computeWithPeople(lastPeopleUsed, newMode);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!snapshot || !lastPeopleUsed) return;
      await apiRequest("POST", "/api/saved-routes", {
        label: saveLabel.trim() || `${snapshot.spot.name} plan`,
        spotId: `${snapshot.spot.lat.toFixed(5)},${snapshot.spot.lon.toFixed(5)}`,
        spotName: snapshot.spot.name,
        peopleJson: JSON.stringify(lastPeopleUsed),
        resultJson: JSON.stringify({
          mode: snapshot.mode,
          totalTime: snapshot.totalTime,
          maxTrip: snapshot.maxTrip,
          score: snapshot.score,
          spreadSec: snapshot.spreadSec,
          neighborhood: snapshot.spot.neighborhood,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-routes"] });
      toast({ description: "Route saved." });
      setSaveOpen(false);
      setSaveLabel("");
    },
    onError: () => {
      toast({ description: "Couldn't save that route. Try again.", variant: "destructive" });
    },
  });

  const trackerResult = snapshot?.perPerson.find((p) => p.personName === trackerPerson) ?? null;

  const activeAlerts = alerts.filter((a) => a.severity !== "info").slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-10">
        <div>
          <h1 className="font-serif text-xl" data-testid="text-planner-heading">
            Who's coming, and from where?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in at least two people. Everyone else can stay blank.
          </p>
        </div>

        {/* Person cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((p, i) => (
            <PersonCard
              key={p.id}
              index={i}
              person={p}
              onChange={(updated) => setPeople((prev) => prev.map((x, idx) => (idx === i ? updated : x)))}
            />
          ))}
        </div>

        {/* Mode + compute */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-card-border pt-6">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && handleModeChange(v as TravelMode)}
            className="border border-card-border rounded-md"
          >
            <ToggleGroupItem value="driving" data-testid="toggle-mode-driving" className="gap-1.5">
              <Car className="h-3.5 w-3.5" /> Driving
            </ToggleGroupItem>
            <ToggleGroupItem value="transit" data-testid="toggle-mode-transit" className="gap-1.5">
              <TrainFront className="h-3.5 w-3.5" /> Subway &amp; walking
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex flex-col items-end gap-1.5">
            <Button onClick={handleCompute} disabled={computing} data-testid="button-compute">
              {computing && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Find best meeting spot
            </Button>
            {error && (
              <p className="text-xs text-destructive" data-testid="text-compute-error">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {snapshot && (
          <div className="flex flex-col gap-6 border-t border-card-border pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-lg" data-testid="text-results-heading">
                  Fair meeting point — {mode === "driving" ? "driving" : "subway & walking"}
                </h2>
                <ResultsPanel snapshot={snapshot} />

                <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 self-start mt-1" data-testid="button-open-save">
                      <Bookmark className="h-4 w-4" /> Save this route
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-save-route">
                    <DialogHeader>
                      <DialogTitle>Save this plan</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-2">
                      <Label htmlFor="save-label">Label</Label>
                      <Input
                        id="save-label"
                        value={saveLabel}
                        onChange={(e) => setSaveLabel(e.target.value)}
                        placeholder={`${snapshot.spot.name} plan`}
                        data-testid="input-save-label"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        data-testid="button-confirm-save"
                      >
                        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg" data-testid="text-map-heading">
                    {snapshot.spot.name}
                  </h2>
                  {mode === "transit" && (
                    <span className="text-xs text-muted-foreground">Subway legs follow real track routes</span>
                  )}
                </div>
                <MapPreview
                  spot={snapshot.spot}
                  perPerson={snapshot.perPerson}
                  peopleLatLon={validPeople.map((p) => ({ name: p.name, lat: p.lat as number, lon: p.lon as number }))}
                  mode={mode}
                />
              </div>
            </div>

            {/* Demo tracker */}
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-serif text-lg" data-testid="text-tracker-heading">
                  Demo tracker
                </h2>
                <Select value={trackerPerson ?? undefined} onValueChange={setTrackerPerson}>
                  <SelectTrigger className="w-[180px]" data-testid="select-tracker-person">
                    <SelectValue placeholder="Choose a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshot.perPerson.map((p) => (
                      <SelectItem key={p.personName} value={p.personName}>
                        {p.personName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {trackerResult ? (
                <DemoTracker result={trackerResult} mode={mode} spotName={snapshot.spot.name} />
              ) : (
                <p className="text-sm text-muted-foreground">Pick a person to preview their simulated trip.</p>
              )}
            </Card>
          </div>
        )}

        {/* Live alerts */}
        <div className="flex flex-col gap-3 border-t border-card-border pt-8">
          <h2 className="font-serif text-lg flex items-center gap-2" data-testid="text-alerts-heading">
            <TriangleAlert className="h-4 w-4 text-primary" /> Live MTA service alerts
          </h2>
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-alerts">
              No active delays or suspensions reported right now.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border border-card-border px-3 py-2.5"
                  data-testid={`row-alert-${a.id}`}
                >
                  <div className="flex gap-1 flex-wrap shrink-0 pt-0.5">
                    {a.routes.slice(0, 4).map((r) => {
                      const meta = stationsData?.routes?.[r];
                      return (
                        <span
                          key={r}
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            backgroundColor: meta?.color ?? "#4c4c4c",
                            color: meta?.textColor ?? "#ffffff",
                          }}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.headerText}</p>
                    <Badge variant={a.severity === "suspended" ? "destructive" : "secondary"} className="text-xs mt-1">
                      {a.severity === "suspended" ? "Suspended" : "Delays"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved routes */}
        <div className="flex flex-col gap-3 border-t border-card-border pt-8 pb-4">
          <h2 className="font-serif text-lg" data-testid="text-saved-heading">
            Saved routes
          </h2>
          <SavedRoutesList />
        </div>
      </main>
    </div>
  );
}
