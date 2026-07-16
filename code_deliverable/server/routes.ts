import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { storage } from "./storage";
import { mapboxAutocomplete, mapboxDirections } from "./mapbox";
import { getSubwayAlerts } from "./mta";
import { MEETUP_SPOTS } from "@shared/spots";
import { insertSavedRouteSchema, personSchema } from "@shared/schema";
import { findFairSpot } from "./meetup-finder";
import { z } from "zod";

// The esbuild production bundle (dist/index.cjs) only contains JS — the JSON
// data files are never copied alongside it. Resolve relative to process.cwd()
// (the project root, true for both `tsx server/index.ts` in dev and
// `node dist/index.cjs` in prod since both are launched from the project root)
// instead of a module-relative __dirname, so the same path works in both.
const dataDir = path.join(process.cwd(), "server", "data");

const subwayStations = JSON.parse(
  readFileSync(path.join(dataDir, "subway-stations.json"), "utf-8"),
);
const subwayRoutes = JSON.parse(
  readFileSync(path.join(dataDir, "subway-routes.json"), "utf-8"),
);

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/spots", (_req, res) => {
    res.json(MEETUP_SPOTS);
  });

  app.get("/api/stations", (_req, res) => {
    res.json({ stations: subwayStations, routes: subwayRoutes });
  });

  app.get("/api/mapbox/autocomplete", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) {
      return res.json([]);
    }
    try {
      const suggestions = await mapboxAutocomplete(q);
      res.json(suggestions);
    } catch (err: any) {
      console.error("autocomplete error", err);
      res.status(502).json({ message: "Address lookup is temporarily unavailable." });
    }
  });

  app.get("/api/mapbox/directions", async (req, res) => {
    const fromLat = parseFloat(String(req.query.fromLat));
    const fromLon = parseFloat(String(req.query.fromLon));
    const toLat = parseFloat(String(req.query.toLat));
    const toLon = parseFloat(String(req.query.toLon));
    const profile = String(req.query.profile) as "driving-traffic" | "walking";
    if (
      [fromLat, fromLon, toLat, toLon].some((v) => Number.isNaN(v)) ||
      (profile !== "driving-traffic" && profile !== "walking")
    ) {
      return res.status(400).json({ message: "Invalid directions request." });
    }
    try {
      const result = await mapboxDirections(
        { lat: fromLat, lon: fromLon },
        { lat: toLat, lon: toLon },
        profile,
      );
      res.json(result);
    } catch (err: any) {
      console.error("directions error", err);
      res.status(502).json({ message: "Route lookup is temporarily unavailable." });
    }
  });

  const findSpotSchema = z.object({
    people: z.array(personSchema).min(2).max(6),
    mode: z.enum(["driving", "transit"]),
  });

  app.post("/api/meetup/find", async (req, res) => {
    const parsed = findSpotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid meetup search request." });
    }
    try {
      const alerts = await getSubwayAlerts().catch(() => []);
      const result = await findFairSpot(parsed.data.people, parsed.data.mode, subwayStations, alerts);
      res.json(result);
    } catch (err: any) {
      console.error("meetup find error", err);
      res.status(502).json({ message: "Couldn't compute a fair meeting point right now. Please try again." });
    }
  });

  app.get("/api/mta/alerts", async (_req, res) => {
    try {
      const alerts = await getSubwayAlerts();
      res.json(alerts);
    } catch (err: any) {
      console.error("mta alerts error", err);
      // Alerts are an enhancement, not a blocker — degrade gracefully.
      res.json([]);
    }
  });

  app.get("/api/saved-routes", async (_req, res) => {
    const routes = await storage.listSavedRoutes();
    res.json(routes);
  });

  app.post("/api/saved-routes", async (req, res) => {
    const parsed = insertSavedRouteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid saved route payload." });
    }
    const created = await storage.createSavedRoute(parsed.data);
    res.status(201).json(created);
  });

  app.delete("/api/saved-routes/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id." });
    }
    const deleted = await storage.deleteSavedRoute(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found." });
    }
    res.status(204).end();
  });

  return httpServer;
}
