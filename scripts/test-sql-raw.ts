import { getLegacyConnection } from '../src/lib/mssql';

async function testConnection() {
  console.log('Testing SQL Server connection...');
  try {
    const pool = await getLegacyConnection();
    console.log('Connected to SQL Server.');

    const result = await pool.request().query('SELECT count(*) as count FROM FSD001');
    console.log('FSD001 row count:', result.recordset[0].count);

    const fsd011 = await pool.request().query('SELECT count(*) as count FROM FSD011');
    console.log('FSD011 row count:', fsd011.recordset[0].count);

    await pool.close();
  } catch (err) {
    console.error('Connection Test Failed:', err);
  }
}

testConnection();
