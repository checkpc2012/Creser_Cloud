const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log("Attempting to SELECT from domain.Branch...");
  try {
    const res = await client.query('SELECT * FROM "domain"."Branch" LIMIT 1;');
    console.log("Success! Found:", res.rows.length, "rows.");
  } catch (e) {
    console.error("FAILED SELECT:");
    console.error(e.message);
    console.error(e.detail);
  }
  await client.end();
}

main().catch(console.error);
