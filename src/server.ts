import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { attachWsServer } from "./services/wsRelay";
import { logger } from "./utils/logger";

process.on("unhandledRejection", (reason) => {
  logger.error(reason, "[unhandledRejection] Unhandled Promise Rejection");
});


const app = createApp();
const server = http.createServer(app);

attachWsServer(server);

server.listen(env.port, () => {
  logger.info(`[server] EW Scheduler backend listening on port ${env.port}`);
  logger.info(`[server] Frontend WebSocket available at ws://localhost:${env.port}/ws`);
  logger.info(`[server] Relaying upstream telemetry from ${env.mlApiBaseUrl}`);
});