export const SERVICE_NAMES = {
  GATEWAY: "gateway",
  WEBHOOK: "webhook",
  DASHBOARD: "dashboard",
  CLI: "cli",
} as const;

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];

export interface HealthResponse {
  status: "ok";
  service: ServiceName;
  uptime: number;
}
