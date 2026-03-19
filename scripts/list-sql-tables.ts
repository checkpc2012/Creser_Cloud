import { getLegacyConnection } from '../src/lib/mssql';

async function listTables() {
  console.log('Listing tables in CRESER...');
  try {
    const pool = await getLegacyConnection();
    const result = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
    console.log('Tables found:', result.recordset.length);
    console.log('Sample tables:', result.recordset.slice(0, 5).map(t => t.name).join(', '));
    
    // Check for FSD001 specifically
    const fsd001 = result.recordset.find(t => t.name === 'FSD001');
    console.log('FSD001 existence:', !!fsd001);

    await pool.close();
  } catch (err) {
    console.error('List Tables Failed:', err);
  }
}

listTables();
