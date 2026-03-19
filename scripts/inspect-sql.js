const sql = require('mssql/msnodesqlv8');

const config = {
    connectionString: 'Driver={SQL Server};Server=MSI;Database=master;Trusted_Connection=yes;'
};

async function checkDatabase() {
    try {
        console.log("Connecting to SQL Server...");
        await sql.connect(config);
        console.log("Connected to SQL Server successfully!");
        
        console.log("Fetching databases...");
        const result = await sql.query(`
            SELECT name 
            FROM sys.databases
        `);
        console.log("--- Databases Found ---");
        result.recordset.forEach(r => console.log(r.name));
    } catch (e) {
        console.error("Connection failed:", e.message);
    } finally {
        await sql.close();
        process.exit();
    }
}
checkDatabase();
