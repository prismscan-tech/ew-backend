import { describe, it, expect, vi, beforeEach } from "vitest";
import * as sessionManager from "./sessionManager";
import * as sessionRepo from "../db/sessionRepository";
import { mlClient } from "../clients/mlClientProvider";

// Mock dependencies
vi.mock("../db/sessionRepository");
vi.mock("../clients/mlClientProvider", () => ({
  mlClient: {
    resetSimulation: vi.fn(),
    startSimulation: vi.fn(),
    pauseSimulation: vi.fn(),
  },
}));
vi.mock("./wsRelay", () => ({
  broadcastToAll: vi.fn(),
}));

describe("sessionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startSession", () => {
    it("should start a new session successfully when no session is active", async () => {
      // Arrange
      vi.mocked(sessionRepo.getActiveSession).mockReturnValue(undefined);
      vi.mocked(sessionRepo.getSession).mockReturnValue({
        sessionId: "test-id",
        scenarioName: "test-scenario",
        schedulerName: "test-scheduler",
        seed: 123,
        status: "running",
        createdAt: new Date().toISOString(),
      });

      // Act
      const result = await sessionManager.startSession("test-scenario", "test-scheduler", 123);

      // Assert
      expect(mlClient.resetSimulation).toHaveBeenCalledWith({
        seed: 123,
        scenario_name: "test-scenario",
        scheduler_name: "test-scheduler",
      });
      expect(sessionRepo.createSession).toHaveBeenCalled();
      expect(sessionRepo.updateSessionStatus).toHaveBeenCalledWith(expect.any(String), "running");
      expect(mlClient.startSimulation).toHaveBeenCalled();
      expect(result.sessionId).toBe("test-id");
    });

    it("should throw an error if a session is already active", async () => {
      // Arrange
      vi.mocked(sessionRepo.getActiveSession).mockReturnValue({
        sessionId: "active-id",
        scenarioName: "test-scenario",
        schedulerName: "test-scheduler",
        seed: 123,
        status: "running",
        createdAt: new Date().toISOString(),
      });

      // Act & Assert
      await expect(sessionManager.startSession("test-scenario", "test-scheduler", 123)).rejects.toThrow(
        /A session is already active/
      );
      expect(mlClient.resetSimulation).not.toHaveBeenCalled();
    });
  });
});
