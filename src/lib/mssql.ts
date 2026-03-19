// @ts-nocheck
// This file is isolated to prevent Next.js from bundling native SQL Server drivers
// that cause build errors like "could not resolve sqlserver.node"

export async function getLegacyConnection() {
    try {
        // Use dynamic import to prevent top-level bundling of the native driver
        const sql = (await import('mssql/msnodesqlv8')).default;

        const config = {
            connectionString: 'Driver={SQL Server};Server=MSI;Database=CRESER;Trusted_Connection=yes;'
        };

        const pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.error('SQL Server Connection Error:', err);
        throw err;
    }
}
