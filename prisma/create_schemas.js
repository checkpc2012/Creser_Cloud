const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log("Connected to DB. Creating schemas...");
  await client.query("CREATE SCHEMA IF NOT EXISTS auth;");
  await client.query("CREATE SCHEMA IF NOT EXISTS domain;");
  await client.query("CREATE SCHEMA IF NOT EXISTS audit;");
  await client.query("CREATE SCHEMA IF NOT EXISTS staging;");
  console.log("Schemas created successfully.");
  await client.end();
}

main().catch(console.error);
