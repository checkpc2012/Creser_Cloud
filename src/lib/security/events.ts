"use server"

import prisma from "@/lib/prisma"
import { headers } from "next/headers"

export type SecurityEventType =
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILURE"
    | "LOGOUT"
    | "SESSION_REVOKED"
    | "MFA_VERIFIED"
    | "MFA_FAILED"
    | "UNAUTHORIZED_ACCESS"
    | "SENSITIVE_DATA_EXPORT"

export class SecurityService {
    /**
     * Logs a security event with metadata.
     */
    static async logEvent(type: SecurityEventType, userId?: string, details?: any) {
        const headerList = await headers()
        const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "unknown"
        const userAgent = headerList.get("user-agent") || "unknown"

        await prisma.securityEvent.create({
            data: {
                type,
                userId,
                ip,
                metadata: {
                    ...details,
                    userAgent
                }
            }
        })
    }

    /**
     * Records a failed login attempt for rate limiting and auditing.
     */
    static async recordLoginAttempt(email: string, success: boolean) {
        const headerList = await headers()
        const ip = headerList.get("x-forwarded-for") || "unknown"

        await prisma.loginAttempt.create({
            data: {
                username: email,
                ip,
                success
            }
        })

        if (!success) {
            await this.logEvent("LOGIN_FAILURE", undefined, { email, ip })
        } else {
            await this.logEvent("LOGIN_SUCCESS", undefined, { email, ip })
        }
    }

    /**
     * List recent security events for the dashboard.
     */
    static async getRecentEvents(limit = 10) {
        return await prisma.securityEvent.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { nombreCompleto: true } } }
        })
    }
}
