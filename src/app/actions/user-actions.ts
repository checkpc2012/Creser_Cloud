
"use server";

import prisma from "@/lib/prisma";
import * as argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/client";

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      include: {
        branch: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export async function getBranches() {
  try {
    return await prisma.branch.findMany({
      where: {
        name: {
          in: ['Castillos', 'Rocha', 'Lascano', 'La Coronilla']
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return [];
  }
}

export async function createUser(data: any) {
  try {
    const { firstName, lastName, role, branchId } = data;
    // Generate username: (initials of up to 2 first names + full last name)
    const nameParts = firstName.trim().split(/\s+/);
    const initials = nameParts.slice(0, 2).map((p: string) => p[0]).join('').toLowerCase();
    const surname = lastName.trim().toLowerCase().replace(/\s/g, '');
    const username = initials + surname;
    
    const existing = await prisma.user.findUnique({ where: { username }});
    
    if (existing) {
      throw new Error("El nombre de usuario ya existe. Por favor, agregue más letras del nombre o apellido.");
    }

    // Default password 'Creser1' as per requirements
    const defaultPassword = "Creser1";
    const hashedPass = await argon2.hash(defaultPassword);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        passwordHash: hashedPass,
        role: role as Role,
        branchId,
        mustChangePassword: true,
        isActive: true
      }
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    const { firstName, lastName, role, branchId, isActive } = data;
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role: role as Role,
        branchId,
        isActive
      }
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
    
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    return { success: false, error: error.message };
  }
}

export async function resetPassword(id: string) {
    try {
        const hashedPass = await argon2.hash('Creser1');
        await prisma.user.update({
            where: { id },
            data: { 
                passwordHash: hashedPass,
                mustChangePassword: true
            }
        });
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
