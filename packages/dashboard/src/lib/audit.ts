import { prisma } from "@airails/shared";

type AuditAction = "CREATE_BASE" | "CREATE_OVERRIDE" | "UPDATE" | "PROMOTE" | "DELETE";

interface LogPromptAuditParams {
  productId: string;
  promptTemplateId: string;
  engineerId: string;
  action: AuditAction;
  version: number;
  contentBefore?: string | null;
  contentAfter: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget audit log — never throws, never blocks the response. */
export function logPromptAudit(params: LogPromptAuditParams): void {
  prisma.promptAuditLog
    .create({
      data: {
        productId: params.productId,
        promptTemplateId: params.promptTemplateId,
        engineerId: params.engineerId,
        action: params.action,
        version: params.version,
        contentBefore: params.contentBefore ?? null,
        contentAfter: params.contentAfter,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    })
    .catch((err) => {
      console.warn("[audit] Failed to log prompt audit:", err);
    });
}
