import { pino } from "pino";

export const jobLogger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  formatters: {
    level: (label: string) => ({ level: label }),
  },
});
