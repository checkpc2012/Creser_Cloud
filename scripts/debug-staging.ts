import prisma from '../src/lib/prisma';

async function main() {
  const stagingClientCount = await prisma.legacy_FSD001.count();
  const stagingLoanCount = await prisma.legacy_FSD011.count();
  
  console.log('STAGING COUNTS:');
  console.log('---------------');
  console.log('FSD001 (Clients):', stagingClientCount);
  console.log('FSD011 (Loans):', stagingLoanCount);
  
  const lastBatch = await prisma.legacy_FSD001.findFirst({
    orderBy: { imported_at: 'desc' },
    select: { import_batch_id: true }
  });
  
  console.log('Last Import Batch ID:', lastBatch?.import_batch_id);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
