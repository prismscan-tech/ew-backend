import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../config/env";
import * as schema from "./schema";

const dbDir = path.dirname(env.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(env.dbPath);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    scenario_name TEXT NOT NULL,
    scheduler_name TEXT NOT NULL,
    seed INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    session_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    captured_at TEXT NOT NULL,
    telemetry_json TEXT NOT NULL,
    PRIMARY KEY (session_id, step),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS session_metrics (
    session_id TEXT PRIMARY KEY,
    performance_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );
`);

export const db = drizzle(sqlite, { schema });
