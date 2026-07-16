import { users, savedRoutes } from "@shared/schema";
import type { User, InsertUser, SavedRoute, InsertSavedRoute } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Ensure tables exist (simple migration-free bootstrap for this small app).
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saved_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    spot_id TEXT NOT NULL,
    spot_name TEXT NOT NULL,
    people_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  listSavedRoutes(): Promise<SavedRoute[]>;
  createSavedRoute(route: InsertSavedRoute): Promise<SavedRoute>;
  deleteSavedRoute(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async listSavedRoutes(): Promise<SavedRoute[]> {
    return db.select().from(savedRoutes).orderBy(desc(savedRoutes.createdAt)).all();
  }

  async createSavedRoute(route: InsertSavedRoute): Promise<SavedRoute> {
    return db
      .insert(savedRoutes)
      .values({ ...route, createdAt: Date.now() })
      .returning()
      .get();
  }

  async deleteSavedRoute(id: number): Promise<boolean> {
    const result = db.delete(savedRoutes).where(eq(savedRoutes.id, id)).run();
    return result.changes > 0;
  }
}

export const storage = new DatabaseStorage();
