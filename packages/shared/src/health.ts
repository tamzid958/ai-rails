import type { ServiceName } from "./constants.js";

export interface HealthResponse {
  status: "ok";
  service: ServiceName;
  uptime: number;
}
