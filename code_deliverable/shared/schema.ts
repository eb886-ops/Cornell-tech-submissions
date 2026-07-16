import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// A person joining a meetup: name, geocoded address, and a personal delay factor.
export const personSchema = z.object({
  name: z.string().min(1).max(60),
  address: z.string().min(1).max(200),
  lat: z.number(),
  lon: z.number(),
  delayFactor: z.number().min(1).max(2),
});
export type Person = z.infer<typeof personSchema>;

// Saved routes: a snapshot of a computed plan the user chose to keep.
export const savedRoutes = sqliteTable("saved_routes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  spotId: text("spot_id").notNull(),
  spotName: text("spot_name").notNull(),
  peopleJson: text("people_json").notNull(), // JSON-encoded Person[]
  resultJson: text("result_json").notNull(), // JSON-encoded computed ranking snapshot
  createdAt: integer("created_at").notNull(),
});

export const insertSavedRouteSchema = createInsertSchema(savedRoutes).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedRoute = z.infer<typeof insertSavedRouteSchema>;
export type SavedRoute = typeof savedRoutes.$inferSelect;
