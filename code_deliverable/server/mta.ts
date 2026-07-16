import { createRequire } from "module";

// gtfs-realtime-bindings is a CJS package; `import * as X` under ESM wraps
// it inconsistently (X.transit_realtime ends up undefined). Load it via
// createRequire instead so we get the real CJS module.exports shape.
//
// In dev (tsx, true ESM) import.meta.url is valid and __filename doesn't exist.
// In the production build (esbuild --format=cjs), import.meta.url is stripped to
// empty by esbuild (see build warning), but __filename is a real CJS global there —
// so prefer __filename when available and only fall back to import.meta.url.
declare const __filename: string | undefined;
const requireShim = typeof __filename !== "undefined" ? createRequire(__filename) : createRequire(import.meta.url);
const GtfsRealtimeBindings = requireShim("gtfs-realtime-bindings");

const ALERTS_URL =
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts";

export interface SubwayAlert {
  id: string;
  routes: string[];
  headerText: string;
  descriptionText: string;
  severity: "info" | "delay" | "suspended";
  activePeriod: { start: number | null; end: number | null }[];
}

// MTA's GTFS-Realtime feed encodes exactly when a planned-work alert applies
// (e.g. a specific weekend window) via `active_period` [start, end] unix-time
// ranges. Per the GTFS-RT spec, an alert with no active_period entries is
// considered active at all times; otherwise it's only active if "now" falls
// inside at least one of its windows. Without this check, weekend-only or
// date-limited planned work (like "F skips 169 St" on a specific weekend)
// would incorrectly get applied on days it doesn't actually affect service.
function toEpochSeconds(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && typeof (v as any).toNumber === "function") {
    return (v as any).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isActiveNow(periods: { start: number | null; end: number | null }[], nowSec: number): boolean {
  if (periods.length === 0) return true;
  return periods.some((p) => {
    const afterStart = p.start === null || nowSec >= p.start;
    const beforeEnd = p.end === null || nowSec <= p.end;
    return afterStart && beforeEnd;
  });
}

let cache: { data: SubwayAlert[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

function classifySeverity(headerText: string, effect?: string): SubwayAlert["severity"] {
  const t = headerText.toLowerCase();
  if (effect === "NO_SERVICE" || t.includes("suspend") || t.includes("no service")) {
    return "suspended";
  }
  if (
    effect === "SIGNIFICANT_DELAYS" ||
    t.includes("delay") ||
    t.includes("reroute") ||
    t.includes("rerouted") ||
    t.includes("skip")
  ) {
    return "delay";
  }
  return "info";
}

export async function getSubwayAlerts(): Promise<SubwayAlert[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const res = await fetch(ALERTS_URL);
  if (!res.ok) {
    throw new Error(`MTA alerts feed failed: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer),
  );

  const alerts: SubwayAlert[] = [];
  for (const entity of feed.entity as any[]) {
    if (!entity.alert) continue;
    const alert = entity.alert;
    const headerText =
      alert.headerText?.translation?.[0]?.text || "Service alert";
    const descriptionText =
      alert.descriptionText?.translation?.[0]?.text || "";
    const routes: string[] = Array.from(
      new Set(
        ((alert.informedEntity || []) as any[])
          .map((e) => e.routeId as string | undefined)
          .filter((r): r is string => !!r),
      ),
    );
    if (routes.length === 0) continue;

    const activePeriod = ((alert.activePeriod || []) as any[]).map((p) => ({
      start: toEpochSeconds(p.start),
      end: toEpochSeconds(p.end),
    }));

    // Skip alerts that aren't actually in effect right now (e.g. a planned
    // service change scheduled for a future weekend) -- they shouldn't
    // influence "live" delay math or show up in a live-alerts feed today.
    if (!isActiveNow(activePeriod, Math.floor(Date.now() / 1000))) continue;

    alerts.push({
      id: entity.id,
      routes,
      headerText,
      descriptionText,
      severity: classifySeverity(headerText, alert.effect as unknown as string),
      activePeriod,
    });
  }

  cache = { data: alerts, fetchedAt: Date.now() };
  return alerts;
}

// Given a set of subway route IDs (e.g. serving a station), return the
// highest-severity delay multiplier currently in effect for those lines.
export function delayMultiplierForRoutes(
  alerts: SubwayAlert[],
  routes: string[],
): { multiplier: number; matched: SubwayAlert[] } {
  const matched = alerts.filter((a) => a.routes.some((r) => routes.includes(r)));
  let multiplier = 1;
  for (const a of matched) {
    if (a.severity === "suspended") multiplier = Math.max(multiplier, 1.6);
    else if (a.severity === "delay") multiplier = Math.max(multiplier, 1.25);
  }
  return { multiplier, matched };
}
