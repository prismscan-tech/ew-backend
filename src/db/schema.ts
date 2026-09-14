import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { SessionStatus } from "../types/domain";

export const sessions = sqliteTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  scenarioName: text("scenario_name").notNull(),
  schedulerName: text("scheduler_name").notNull(),
  seed: integer("seed").notNull(),
  status: text("status").$type<SessionStatus>().notNull(),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const telemetrySnapshots = sqliteTable("telemetry_snapshots", {
  sessionId: text("session_id").notNull().references(() => sessions.sessionId),
  step: integer("step").notNull(),
  capturedAt: text("captured_at").notNull(),
  telemetryJson: text("telemetry_json").notNull(), // Stored as JSON string
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.step] }),
}));

export const sessionMetrics = sqliteTable("session_metrics", {
  sessionId: text("session_id").primaryKey().references(() => sessions.sessionId),
  performanceJson: text("performance_json").notNull(), // Stored as JSON string
  updatedAt: text("updated_at").notNull(),
});
