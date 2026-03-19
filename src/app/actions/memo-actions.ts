"use server";

import prisma from "@/lib/prisma";
import { getLegacyConnection } from "@/lib/mssql";
import { revalidatePath } from "next/cache";

/**
 * Syncs a client memo from FSDT03 SQL Server to the new system.
 * This satisfies Stage A: Read-only integration (Legacy -> New Sync).
 */
export async function syncClientMemo(clientId: string, legacyId: string) {
    try {
        if (!legacyId) return null;

        const pool = await getLegacyConnection();

        // Query legacy table FSDT03 (which we proved contains client memos)
        // DT03Cli matches the Client's legacy_id
        const result = await pool.request()
            .input('legacyId', legacyId)
            .query('SELECT DT03Memo FROM FSDT03 WHERE DT03Cli = @legacyId');

        if (result.recordset.length === 0) return null;

        const legacyMemoText = result.recordset[0].DT03Memo;

        // Upsert into our new system table for performance (Stage A Sync)
        const memo = await prisma.legacyMemo.upsert({
            where: { clientId },
            update: {
                memo: legacyMemoText,
                legacyId: legacyId
            },
            create: {
                clientId,
                memo: legacyMemoText,
                legacyId: legacyId
            }
        });

        return memo;
    } catch (error) {
        console.error("Error syncing client memo:", error);
        return null;
    }
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
