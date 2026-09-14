import { Request, Response } from "express";
import { z } from "zod";
import * as sessionManager from "../services/sessionManager";
import * as sessionRepo from "../db/sessionRepository";
import { mlClient } from "../clients/mlClientProvider";
import { SpeedMultiplier } from "../types/domain";

const startSessionSchema = z.object({
  scenarioName: z.string().min(1),
  schedulerName: z.string().min(1),
  seed: z.number().int().optional(),
});

const stepSessionSchema = z.object({
  steps: z.number().int().positive().optional().default(1),
});

const setSpeedSchema = z.object({
  speed: z.enum(["0.25x", "0.5x", "1x", "2x", "5x", "max"]),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(500),
});

export async function startSession(req: Request, res: Response): Promise<void> {
  const parsed = startSessionSchema.parse(req.body);
  const session = await sessionManager.startSession(
    parsed.scenarioName,
    parsed.schedulerName,
    parsed.seed
  );
  res.status(202).json(session);
}

export async function pauseSession(req: Request, res: Response): Promise<void> {
  await sessionManager.pauseSession(req.params.sessionId);
  res.json({ status: "paused" });
}

export async function resumeSession(req: Request, res: Response): Promise<void> {
  await sessionManager.resumeSession(req.params.sessionId);
  res.json({ status: "resumed" });
}

export async function completeSession(req: Request, res: Response): Promise<void> {
  await sessionManager.completeSession(req.params.sessionId);
  res.json({ status: "completed" });
}

export async function stepSession(req: Request, res: Response): Promise<void> {
  const session = sessionRepo.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  
  const parsed = stepSessionSchema.parse(req.body);
  const telemetry = await mlClient.stepSimulation({ steps: parsed.steps });
  sessionManager.recordTelemetry(session.sessionId, telemetry);
  res.json(telemetry);
}

export async function setSpeed(req: Request, res: Response): Promise<void> {
  const session = sessionRepo.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  
  const parsed = setSpeedSchema.parse(req.body);
  const result = await mlClient.setSpeed({ speed: parsed.speed as SpeedMultiplier });
  res.json(result);
}

export function getSession(req: Request, res: Response): void {
  const session = sessionRepo.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
}

export function listSessions(_req: Request, res: Response): void {
  res.json(sessionRepo.listSessions());
}

export function getSessionMetrics(req: Request, res: Response): void {
  const metrics = sessionRepo.getSessionMetrics(req.params.sessionId);
  if (!metrics) {
    res.status(404).json({ error: "No metrics recorded yet for this session" });
    return;
  }
  res.json(metrics);
}

export function getSessionHistory(req: Request, res: Response): void {
  const session = sessionRepo.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  
  const parsed = historyQuerySchema.parse(req.query);
  res.json(sessionRepo.getTelemetryHistory(req.params.sessionId, parsed.limit));
}