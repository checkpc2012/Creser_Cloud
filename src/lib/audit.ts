import prisma from "./prisma";
import { headers } from "next/headers";
import { getSession } from "./auth";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "APPROVAL" | "OVERRIDE" | "SECURITY" | "REFINANCE_REQUEST" | "APPROVAL_APPROVED" | "APPROVAL_REJECTED" | "MFA_ENABLED" | "MFA_DISABLED";

export class AuditService {
    static async log(params: {
        action: AuditAction | string;
        entity: string;
        entityId?: string;
        userId?: string;
        tx?: any;
        beforeJson?: any;
        afterJson?: any;
        metadata?: any;
        details?: any;
    }) {
        try {
            const session = await getSession();
            const headersList = await headers();
            const db = params.tx || prisma;

            await db.auditLog.create({
                data: {
                    userId: params.userId || session?.user?.id || null,
                    actorRole: session?.user?.rol || "ANONYMOUS",
                    action: params.action,
                    entityType: params.entity,
                    entityId: params.entityId,
                    beforeJson: params.beforeJson,
                    afterJson: params.afterJson,
                    ip: headersList.get("x-forwarded-for") || "unknown",
                    userAgent: headersList.get("user-agent") || "unknown",
                    metadata: { ...params.metadata, ...params.details },
                }
            });
        } catch (error) {
            console.error("Failed to log audit:", error);
        }
    }

    static async logSecurity(params: {
        type: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        description?: string;
        userId?: string;
        metadata?: any;
    }) {
        try {
            const session = await getSession();
            const headersList = await headers();

            await prisma.securityEvent.create({
                data: {
                    userId: params.userId || session?.user?.id || null,
                    type: params.type,
                    severity: params.severity,
                    description: params.description,
                    metadata: params.metadata,
                    ip: headersList.get("x-forwarded-for") || "unknown",
                }
            });

            // Mirror to audit
            await this.log({
                action: "SECURITY",
                entity: "Security",
                metadata: { type: params.type, severity: params.severity }
            });
        } catch (error) {
            console.error("Failed to log security event:", error);
        }
    }
}

// Backward compatibility exports
export const logAudit = AuditService.log.bind(AuditService);
export const logSecurityEvent = AuditService.logSecurity.bind(AuditService);
