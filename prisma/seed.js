require('dotenv').config();
const { PrismaClient } = require("../src/generated/client");

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
// DATABASE_URL is picked up automatically from .env via dotenv

async function main() {
  console.log("Starting Sanitized Cloud Demo Seed (JS)...");

  // 1. Core Branches
  const branches = [
    { name: "Demo North", code: "DN01" },
    { name: "Demo South", code: "DS02" },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }
  const branch = await prisma.branch.findFirst({ where: { code: "DN01" } });

  // 2. Demo User
  const hashedPassword = "DUMMY_HASHED_PASSWORD";
  await prisma.user.upsert({
    where: { username: "demouser" },
    update: { passwordHash: hashedPassword },
    create: {
      username: "demouser",
      firstName: "Demo",
      lastName: "User",
      passwordHash: hashedPassword,
      role: "AGENT",
      branchId: branch.id,
      mustChangePassword: false,
      isActive: true,
    },
  });

  // 3. Demo Employer
  const employer = await prisma.employer.upsert({
    where: { employerCode: "DEMOERR" },
    update: {},
    create: {
      employerCode: "DEMOERR",
      employerName: "Demo Corp",
      type: "PRIVATE_COMPANY",
    },
  });

  console.log("Seeding 15 representative clients...");

  // --- Group 1: 5 ACTIVE LOANS ONLY ---
  for (let i = 1; i <= 5; i++) {
    const doc = `111111${i}`;
    await prisma.client.upsert({
      where: { documentNumber: doc },
      update: {},
      create: {
        documentNumber: doc,
        fullName: `Active Client ${i}`,
        branchId: branch.id,
        employerId: employer.id,
        loans: {
          create: {
            operationNumber: `LOAN-ACT-${i}`,
            principalAmount: 10000 * i,
            interestAmount: 2000 * i,
            taxAmount: 500 * i,
            totalAmount: 12500 * i,
            outstandingBalance: 8000 * i,
            termCount: 12,
            status: "ACTIVE",
            branchId: branch.id,
          }
        }
      }
    });
  }

  // --- Group 2: 5 HISTORICAL / READ-ONLY ONLY ---
  for (let i = 1; i <= 5; i++) {
    const doc = `222222${i}`;
    await prisma.client.upsert({
      where: { documentNumber: doc },
      update: {},
      create: {
        documentNumber: doc,
        fullName: `Historical Client ${i}`,
        branchId: branch.id,
        employerId: employer.id,
        isLegacy: true,
        loans: {
          create: {
            operationNumber: `LOAN-HIST-${i}`,
            principalAmount: 5000 * i,
            interestAmount: 1000 * i,
            taxAmount: 200 * i,
            totalAmount: 6200 * i,
            outstandingBalance: 0,
            termCount: 6,
            status: "CLOSED",
            branchId: branch.id,
            isLegacy: true,
          }
        }
      }
    });
  }

  // --- Group 3: 5 MIXED (1 Historical + 1 Active) ---
  for (let i = 1; i <= 5; i++) {
    const doc = `333333${i}`;
    await prisma.client.upsert({
      where: { documentNumber: doc },
      update: {},
      create: {
        documentNumber: doc,
        fullName: `Mixed Client ${i}`,
        branchId: branch.id,
        employerId: employer.id,
        loans: {
          create: [
            {
              operationNumber: `LOAN-MIX-H-${i}`,
              principalAmount: 7000,
              interestAmount: 1400,
              taxAmount: 300,
              totalAmount: 8700,
              outstandingBalance: 0,
              termCount: 12,
              status: "CLOSED",
              branchId: branch.id,
              isLegacy: true,
            },
            {
              operationNumber: `LOAN-MIX-A-${i}`,
              principalAmount: 15000,
              interestAmount: 3000,
              taxAmount: 700,
              totalAmount: 18700,
              outstandingBalance: 15000,
              termCount: 18,
              status: "ACTIVE",
              branchId: branch.id,
            }
          ]
        }
      }
    });
  }

  console.log("Cloud Demo Seed Completed Successfully!");
}

main()
  .catch((e) => {
    const fs = require('fs');
    const errorLog = {
      message: e.message,
      code: e.code,
      meta: e.meta,
      stack: e.stack
    };
    fs.writeFileSync('prisma_error.log', JSON.stringify(errorLog, null, 2));
    console.error("SEED FATAL ERROR: Check prisma_error.log for details.");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
