const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const clRes = await client.query('SELECT COUNT(*) FROM "domain"."Client";');
  const lnRes = await client.query('SELECT COUNT(*) FROM "domain"."Loan";');
  const usRes = await client.query('SELECT COUNT(*) FROM "auth"."User";');
  console.log(`Verification:`);
  console.log(`- Clients: ${clRes.rows[0].count}`);
  console.log(`- Loans: ${lnRes.rows[0].count}`);
  console.log(`- Users: ${usRes.rows[0].count}`);
  await client.end();
}

main().catch(console.error);
