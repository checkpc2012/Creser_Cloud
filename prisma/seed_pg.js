const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log("Connected to DB via PG. Starting robust seed...");

  const now = new Date().toISOString();

  // 1. Core Branches
  await client.query(`INSERT INTO "domain"."Branch" (id, name, code) VALUES ('br-demo-1', 'Demo North', 'DN01'), ('br-demo-2', 'Demo South', 'DS02') ON CONFLICT (code) DO NOTHING;`);
  const brRes = await client.query(`SELECT id FROM "domain"."Branch" WHERE code = 'DN01';`);
  const branchId = brRes.rows[0].id;

  // 2. Demo User
  // Password is '123456' hashed with bcrypt
  const passHash = '$2b$10$7R6v7k7g7H7R6v7k7g7H7O'; // Note: This is a placeholder, usually generated via bcrypt.hashSync('123456', 10)
  // Actually let's use a real one:
  const bcrypt = require('bcryptjs');
  const realHash = bcrypt.hashSync('123456', 10);
  
  await client.query(`INSERT INTO "auth"."User" (id, username, "passwordHash", "firstName", "lastName", role, "branchId", "mustChangePassword", "isActive", "createdAt", "updatedAt") 
    VALUES ('usr-demo-1', 'demouser', $1, 'Demo', 'User', 'AGENT', $2, false, true, $3, $3) 
    ON CONFLICT (username) DO UPDATE SET "passwordHash" = $1;`, [realHash, branchId, now]);

  // 3. Demo Employer
  await client.query(`INSERT INTO "domain"."Employer" (id, "employerCode", "employerName", type, "createdAt", "updatedAt", "isLegacy") 
    VALUES ('emp-demo-1', 'DEMOERR', 'Demo Corp', 'PRIVATE_COMPANY', $1, $1, true) 
    ON CONFLICT ("employerCode") DO NOTHING;`, [now]);
  const empRes = await client.query(`SELECT id FROM "domain"."Employer" WHERE "employerCode" = 'DEMOERR';`);
  const employerId = empRes.rows[0].id;

  console.log("Seeding 15 clients...");

  for (let i = 1; i <= 15; i++) {
    const doc = `44444${i.toString().padStart(2, '0')}`;
    const clientId = `cl-demo-${i}`;
    const fullName = i <= 5 ? `Active Demo ${i}` : (i <= 10 ? `Hist Demo ${i}` : `Mixed Demo ${i}`);
    
    await client.query(`INSERT INTO "domain"."Client" (id, "documentNumber", "fullName", "branchId", "employerId", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $6) ON CONFLICT ("documentNumber") DO NOTHING;`, 
      [clientId, doc, fullName, branchId, employerId, now]);

    // Loan logic
    const loanId = `ln-demo-${i}`;
    const opNum = `OP-${doc}`;
    let status = 'ACTIVE';
    let balance = 5000;
    let isLegacy = false;

    if (i > 5 && i <= 10) {
      status = 'CLOSED';
      balance = 0;
      isLegacy = true;
    } else if (i > 10) {
      // Mixed - add a legacy loan first, then an active one
      const histLoanId = `ln-demo-hist-${i}`;
      const histOpNum = `OP-H-${doc}`;
      await client.query(`INSERT INTO "domain"."Loan" (id, "clientId", "operationNumber", "principalAmount", "interestAmount", "taxAmount", "totalAmount", "outstandingBalance", "termCount", status, "branchId", "isLegacy", "createdAt", "updatedAt") 
        VALUES ($1, $2, $3, 3000, 600, 100, 3700, 0, 6, 'CLOSED', $4, true, $5, $5) 
        ON CONFLICT ("operationNumber") DO NOTHING;`, 
        [histLoanId, clientId, histOpNum, branchId, now]);
      
      status = 'ACTIVE';
      balance = 8000;
      isLegacy = false;
    }

    await client.query(`INSERT INTO "domain"."Loan" (id, "clientId", "operationNumber", "principalAmount", "interestAmount", "taxAmount", "totalAmount", "outstandingBalance", "termCount", status, "branchId", "isLegacy", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, 5000, 1000, 200, 6200, $4, 12, $5, $6, $7, $8, $8) 
      ON CONFLICT ("operationNumber") DO NOTHING;`, 
      [loanId, clientId, opNum, balance, status, branchId, isLegacy, now]);
  }

  console.log("Robust Seeding Completed Successfully!");
  await client.end();
}

main().catch(console.error);
