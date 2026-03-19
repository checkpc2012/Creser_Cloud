import { PrismaClient, Role } from '../src/generated/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

export async function seedBaseInfo() {
  console.log('Seeding base info...');
  
  // 1. Ensure "General" branch exists
  let branch = await prisma.branch.findUnique({
    where: { nombre: 'General' }
  });
  
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        nombre: 'General',
        isActive: true
      }
    });
    console.log('Branch "General" created.');
  } else {
    console.log('Branch "General" already exists.');
  }

  // 2. Ensure "lsosa" user exists
  const usuario = 'lsosa';
  let user = await prisma.user.findUnique({
    where: { usuario }
  });
  
  if (!user) {
    const hashedPassword = await argon2.hash('Creser2025!');
    user = await prisma.user.create({
      data: {
        usuario,
        nombre: 'Luis',
        apellido: 'Sosa',
        nombreCompleto: 'Luis Sosa',
        contrasena: hashedPassword,
        rol: Role.SYSTEMS,
        mustChangePassword: false,
        status: 'ACTIVE',
        branchId: branch.id
      }
    });
    console.log(`User "${usuario}" created.`);
  } else {
    console.log(`User "${usuario}" already exists.`);
  }
  
  return user;
}

if (require.main === module) {
  seedBaseInfo()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
