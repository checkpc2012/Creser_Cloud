import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { usuario: 'lsosa' }
  });
  
  if (user) {
    console.log(`User found: ${user.usuario} (${user.id})`);
  } else {
    console.log('User lsosa not found. Listing all users:');
    const users = await prisma.user.findMany();
    users.forEach(u => console.log(`- ${u.usuario}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
