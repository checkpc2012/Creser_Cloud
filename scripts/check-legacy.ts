import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Client table: records with LEGACY- prefix in fullName ===');
  const legacyNames = await prisma.client.findMany({
    where: { fullName: { startsWith: 'LEGACY-' } },
    select: { id: true, documentNumber: true, fullName: true, legacyId: true, branchId: true },
    take: 20
  });
  console.log(`Count: ${legacyNames.length}`);
  console.log(JSON.stringify(legacyNames, null, 2));

  console.log('\n=== Client table: record by legacyId 2793023 ===');
  const byLegacy = await prisma.client.findMany({
    where: { OR: [{ legacyId: '2793023' }, { documentNumber: '2793023' }] },
    select: { id: true, documentNumber: true, fullName: true, legacyId: true, branchId: true },
  });
  console.log(JSON.stringify(byLegacy, null, 2));

  console.log('\n=== Staging_CFE: lookup for LEGACY-3227274 -> what docR is 3227274 ===');
  const cfe = await prisma.staging_CFE.findMany({
    where: { docR: { contains: '3227274' } },
    select: { docR: true, nombreR: true },
    take: 5
  });
  console.log(JSON.stringify(cfe, null, 2));

  console.log('\n=== Staging_CFE: lookup for LEGACY-3247254 ===');
  const cfe2 = await prisma.staging_CFE.findMany({
    where: { docR: { contains: '3247254' } },
    select: { docR: true, nombreR: true },
    take: 5
  });
  console.log(JSON.stringify(cfe2, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
