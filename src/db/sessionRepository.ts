import { db } from "./database";
import { sessions, telemetrySnapshots, sessionMetrics } from "./schema";
import { eq, desc, inArray } from "drizzle-orm";
import { PerformanceMetrics, Session, SessionStatus, Telemetry } from "../types/domain";

export function createSession(
  sessionId: string,
  scenarioName: string,
  schedulerName: string,
  seed: number
): void {
  db.insert(sessions).values({
    sessionId,
    scenarioName,
    schedulerName,
    seed,
    status: "idle",
    createdAt: new Date().toISOString(),
  }).run();
}

export function updateSessionStatus(sessionId: string, status: SessionStatus): void {
  const completedAt = status === "completed" ? new Date().toISOString() : undefined;
  
  const updateData: any = { status };
  if (completedAt) {
    updateData.completedAt = completedAt;
  }
  
  db.update(sessions)
    .set(updateData)
    .where(eq(sessions.sessionId, sessionId))
    .run();
}

export function getSession(sessionId: string): Session | undefined {
  const row = db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).get();
  if (!row) return undefined;
  return {
    sessionId: row.sessionId,
    scenarioName: row.scenarioName,
    schedulerName: row.schedulerName,
    seed: row.seed,
    status: row.status,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  };
}

export function listSessions(): Session[] {
  const rows = db.select().from(sessions).orderBy(desc(sessions.createdAt)).all();
  return rows.map((row) => ({
    sessionId: row.sessionId,
    scenarioName: row.scenarioName,
    schedulerName: row.schedulerName,
    seed: row.seed,
    status: row.status,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  }));
}

export function getActiveSession(): Session | undefined {
  const row = db.select()
    .from(sessions)
    .where(inArray(sessions.status, ["running", "paused"]))
    .orderBy(desc(sessions.createdAt))
    .limit(1)
    .get();
    
  if (!row) return undefined;
  return {
    sessionId: row.sessionId,
    scenarioName: row.scenarioName,
    schedulerName: row.schedulerName,
    seed: row.seed,
    status: row.status,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  };
}

export function insertTelemetrySnapshot(sessionId: string, step: number, telemetry: Telemetry): void {
  db.insert(telemetrySnapshots).values({
    sessionId,
    step,
    capturedAt: new Date().toISOString(),
    telemetryJson: JSON.stringify(telemetry),
  }).onConflictDoUpdate({
    target: [telemetrySnapshots.sessionId, telemetrySnapshots.step],
    set: {
      capturedAt: new Date().toISOString(),
      telemetryJson: JSON.stringify(telemetry),
    }
  }).run();
}

export function getTelemetryHistory(sessionId: string, limit = 500): Telemetry[] {
  const rows = db.select()
    .from(telemetrySnapshots)
    .where(eq(telemetrySnapshots.sessionId, sessionId))
    .orderBy(desc(telemetrySnapshots.step))
    .limit(limit)
    .all();
    
  return rows.map((r) => JSON.parse(r.telemetryJson)).reverse();
}

export function upsertSessionMetrics(sessionId: string, performance: PerformanceMetrics): void {
  const performanceJson = JSON.stringify(performance);
  const updatedAt = new Date().toISOString();
  
  db.insert(sessionMetrics).values({
    sessionId,
    performanceJson,
    updatedAt,
  }).onConflictDoUpdate({
    target: sessionMetrics.sessionId,
    set: {
      performanceJson,
      updatedAt,
    }
  }).run();
}

export function getSessionMetrics(sessionId: string): PerformanceMetrics | undefined {
  const row = db.select()
    .from(sessionMetrics)
    .where(eq(sessionMetrics.sessionId, sessionId))
    .get();
    
  return row ? JSON.parse(row.performanceJson) : undefined;
}
