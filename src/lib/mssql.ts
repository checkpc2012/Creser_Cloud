// @ts-nocheck
// This file is stubbed to prevent Next.js from bundling native SQL Server drivers
// in the Cloud Demo (Postgres only).

export async function getLegacyConnection() {
    console.warn('SQL Server Legacy Connection is DISABLED in Cloud Demo Mode.');
    return null;
}
