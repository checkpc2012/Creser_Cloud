import prisma from '../src/lib/prisma';

async function main() {
  const clientCount = await prisma.client.count();
  const loanCount = await prisma.loanOperation.count();
  const installmentCount = await prisma.loanInstallment.count();
  
  console.log('RECONSTRUCTION VERIFICATION:');
  console.log('---------------------------');
  console.log('Clients:', clientCount);
  console.log('Loans:', loanCount);
  console.log('Installments:', installmentCount);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
