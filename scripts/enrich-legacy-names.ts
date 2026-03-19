/**
 * Migration: Enrich LEGACY- named clients with real names from Staging_CFE
 * Safe to run multiple times (idempotent).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching clients with LEGACY- placeholder names...');
  
  // Use raw query to avoid Prisma startsWith filter issue on some versions
  const legacyClients = await prisma.$queryRaw<
    Array<{ id: string; documentNumber: string; legacyId: string | null }>
  >`
    SELECT id, "documentNumber", "legacyId"
    FROM domain."Client"
    WHERE "fullName" LIKE 'LEGACY-%'
  `;

  console.log(`Found ${legacyClients.length} clients with LEGACY- names`);

  let updated = 0;
  let noMatch = 0;

  for (const client of legacyClients) {
    // Try to find name in Staging_CFE using both the documentNumber and legacyId
    const searchDoc = client.legacyId || client.documentNumber;
    
    const cfeRecord = await prisma.$queryRaw<
      Array<{ nombreR: string | null; docR: string | null }>
    >`
      SELECT "nombreR", "docR"
      FROM staging."Staging_CFE"
      WHERE "docR" LIKE ${'%' + searchDoc + '%'}
        AND "nombreR" IS NOT NULL
        AND "nombreR" != ''
      LIMIT 1
    `;

    if (cfeRecord.length > 0 && cfeRecord[0].nombreR) {
      const realName = cfeRecord[0].nombreR.trim();
      await prisma.client.update({
        where: { id: client.id },
        data: { fullName: realName }
      });
      console.log(`  ✓ Updated ${client.documentNumber}: LEGACY-... → ${realName}`);
      updated++;
    } else {
      console.log(`  ⚠ No CFE match for ${client.documentNumber} (legacyId: ${client.legacyId})`);
      noMatch++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, No match found: ${noMatch}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
