"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Syncs a client memo from FSDT03 SQL Server to the new system.
 * This satisfies Stage A: Read-only integration (Legacy -> New Sync).
 */
/**
 * Sync logic is disabled in Cloud Demo (Postgres only).
 * Data is already seeded in the local database.
 */
export async function syncClientMemo(clientId: string, legacyId: string) {
    console.warn("Legacy sync skipped in Cloud Demo mode.");
    return null;
}

/**
 * Gets the current memo for a client, syncing it first if necessary.
 */
export async function getClientMemo(clientId: string) {
    try {
        // Try to get from local DB first
        let memo = await prisma.legacyMemo.findUnique({
            where: { clientId }
        });

        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { legacyId: true }
        });

        // If not found or if we want to ensure fresh data (Stage A Read-through if missing)
        if (!memo && client?.legacyId) {
            memo = await syncClientMemo(clientId, client.legacyId);
        }

        return memo;
    } catch (error) {
        console.error("Error getting client memo:", error);
        return null;
    }
}
