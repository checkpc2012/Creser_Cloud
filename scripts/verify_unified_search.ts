
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifyUnifiedSearch() {
  console.log('--- VERIFYING UNIFIED SEARCH ---');
  
  const searchTerms = ['2793023', 'MARY LUZ', '3128825', '4144362']; // Some likely historical docs
  
  for (const term of searchTerms) {
    console.log(`\nSearching for: "${term}"`);
    
    // Check Staging_CFE for name
    const stagingMatch = await prisma.staging_CFE.findFirst({
      where: {
        OR: [
          { docR: { contains: term } },
          { nombreR: { contains: term, mode: 'insensitive' } }
        ]
      }
    });
    
    if (stagingMatch) {
      console.log(`[FOUND IN STAGING_CFE] Doc: ${stagingMatch.docR}, Name: ${stagingMatch.nombreR}`);
      
      // Check if in Client table
      const clientMatch = await prisma.client.findUnique({
        where: { documentNumber: stagingMatch.docR || '' }
      });
      
      if (clientMatch) {
        console.log(`[FOUND IN CLIENT TABLE] ID: ${clientMatch.id}, Name: ${clientMatch.fullName}`);
      } else {
        console.log('[NOT IN CLIENT TABLE] - This will be a VIRTUAL client.');
      }
      
      // Check movements
      const movements = await prisma.staging_FSH016.count({
        where: { hhCta: stagingMatch.docR || '' }
      });
      console.log(`[MOVEMENTS] Count: ${movements}`);
      
      // Check History
      const history = await prisma.historicalEvent.count({
        where: { clientDocument: stagingMatch.docR || '' }
      });
      console.log(`[AUDIT HISTORY] Count: ${history}`);
    } else {
      console.log('[NOT FOUND IN STAGING_CFE]');
    }
  }
}

verifyUnifiedSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
