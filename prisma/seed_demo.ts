import { PrismaClient, Role, OperationalStatus, EmployerType } from "@prisma/client";
// import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Sanitized Cloud Demo Seed...");

  // 1. Core Branches
  const branches = [
    { name: "Demo North", code: "DN01" },
    { name: "Demo South", code: "DS02" },
  ]; // at least one branch
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }
  const branch = await prisma.branch.findFirst();

  // 2. Demo User
  // const hashedPassword = await argon2.hash("Demo123!");
  const hashedPassword = "DUMMY_HASHED_PASSWORD";
  await prisma.user.upsert({
    where: { username: "demouser" },
    update: { passwordHash: hashedPassword },
    create: {
      username: "demouser",
      firstName: "Demo",
      lastName: "User",
      passwordHash: hashedPassword,
      role: Role.AGENT,
      branchId: branch?.id,
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
      type: EmployerType.PRIVATE_COMPANY,
    },
  });

  console.log("Seeding core objects...");
  // --- Group 1: 1 ACTIVE LOAN (DEBUG) ---
  const doc = `1111111`;
  await prisma.client.upsert({
    where: { documentNumber: doc },
    update: {},
    create: {
      documentNumber: doc,
      fullName: `Active Client 1`,
      branchId: branch?.id,
      employerId: employer.id,
    }
  });

  console.log("Cloud Demo Seed DEBUG Completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
