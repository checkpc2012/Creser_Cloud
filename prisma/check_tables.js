const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log("Checking columns in Loan table...");
  const tables = [
    { s: 'domain', t: 'Loan' }
  ];
  for (const item of tables) {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = '${item.s}' AND table_name = '${item.t}';`);
    console.log(`Table ${item.s}.${item.t} Columns:`, res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}

main().catch(console.error);
