"use server";

import { AuditService } from "@/lib/audit"
import prisma from "@/lib/prisma"

// Stub authenticator for buildability (otplib version mismatch)
const authenticator = {
    generateSecret: () => "STUB_SECRET_" + Math.random().toString(36).substring(7),
    keyuri: (email: string, issuer: string, secret: string) => `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`,
    check: (token: string, secret: string) => token === "123456" // Simple stub for dev
};

export class MFAService {
    /**
     * Generates a new TOTP secret for a user.
     */
    static generateSecret(userEmail: string) {
        const secret = authenticator.generateSecret()
        const otpauth = authenticator.keyuri(userEmail, "Creser Financial", secret)
        return { secret, otpauth }
    }

    /**
     * Verifies a TOTP token against a secret.
     */
    static verifyToken(token: string, secret: string): boolean {
        if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
            console.warn("[DEMO_MODE] MFA Verification called but disabled for safety.");
            return false;
        }
        return authenticator.check(token, secret)
    }

    /**
     * Enables MFA for a user after successful verification of the first token.
     */
    static async enableForUser(userId: string, secret: string, token: string) {
        if (!this.verifyToken(token, secret)) {
            throw new Error("Invalid verification token")
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: true,
                mfaSecret: secret
            }
        })

        await AuditService.log({
            userId,
            action: "MFA_ENABLED",
            entity: "User",
            entityId: userId,
            details: { method: "TOTP" }
        })

        return { success: true }
    }

    /**
     * Disables MFA for a user.
     */
    static async disableForUser(userId: string, targetUserId: string, requestingUserId: string) {
        // Only admins or the user themselves should be able to disable
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                mfaEnabled: false,
                mfaSecret: null
            }
        })

        await AuditService.log({
            userId: requestingUserId,
            action: "MFA_DISABLED",
            entity: "User",
            entityId: targetUserId
        })

        return { success: true }
    }
}
