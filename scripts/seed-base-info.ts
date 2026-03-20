import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBaseInfo() {
  console.log('Seeding base info...');
  
  // 1. Ensure "General" branch exists
  let branch = await prisma.branch.findUnique({
    where: { name: 'General' }
  });
  
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'General',
        code: 'GEN001'
      }
    });
    console.log('Branch "General" created.');
  } else {
    console.log('Branch "General" already exists.');
  }

  // 2. Ensure "lsosa" user exists
  const username = 'lsosa';
  let user = await prisma.user.findUnique({
    where: { username }
  });
  
  if (!user) {
    const bcrypt = await import("bcryptjs");
    const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Creser2025!';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    
    user = await prisma.user.create({
      data: {
        username,
        firstName: 'Luis',
        lastName: 'Sosa',
        nombreCompleto: 'Luis Sosa',
        passwordHash: hashedPassword,
        role: Role.SYSTEMS,
        mustChangePassword: false,
        isActive: true,
        branchId: branch.id
      }
    });
    console.log(`User "${username}" created.`);
  } else {
    console.log(`User "${username}" already exists.`);
  }
  
  return user;
}

if (require.main === module) {
  seedBaseInfo()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
