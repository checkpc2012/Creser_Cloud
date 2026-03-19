const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    connectionString: "postgresql://postgres:fer123@localhost:5432/postgres"
  });

  try {
    await client.connect();
    // Check if database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'creser_operational'");
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE creser_operational");
      console.log("Database 'creser_operational' created successfully.");
    } else {
      console.log("Database 'creser_operational' already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
