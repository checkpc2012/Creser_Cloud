
import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function findMoreExamples() {
  console.log('--- FINDING HISTORICAL ONLY EXAMPLES ---');
  
  // 1. Get some docs from Staging_CFE
  const cfeDocs = await prisma.staging_CFE.findMany({
    take: 100,
    distinct: ['docR']
  });
  
  console.log(`Found ${cfeDocs.length} unique docs in Staging_CFE`);
  
  let examplesFound = 0;
  for (const match of cfeDocs) {
    if (!match.docR) continue;
    
    // Check if in Client table
    const inClient = await prisma.client.findUnique({
      where: { documentNumber: match.docR }
    });
    
    if (!inClient) {
      // Check for movements or history
      const normalized = match.docR.replace(/\D/g, '');
      const movements = await prisma.staging_FSH016.count({
        where: { 
          OR: [
            { hhCta: match.docR },
            { hhCta: normalized },
            { hhCta: normalized.substring(0, normalized.length - 1) }
          ]
        }
      });
      
      const history = await prisma.historicalEvent.count({
        where: { 
          OR: [
            { clientDocument: match.docR },
            { clientDocument: normalized }
          ]
        }
      });
      
      if (movements > 0 || history > 0) {
        console.log(`\nEXAMPLE ${examplesFound + 1}:`);
        console.log(`Name: ${match.nombreR}`);
        console.log(`Doc: ${match.docR} (Normalized: ${normalized})`);
        console.log(`Movements: ${movements}, History: ${history}`);
        examplesFound++;
        if (examplesFound >= 5) break;
      }
    }
  }
}

findMoreExamples()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
