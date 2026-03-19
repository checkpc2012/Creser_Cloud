
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBranchesWithDetails() {
  return await prisma.branch.findMany({
    where: {
      name: {
        in: ['Castillos', 'Rocha', 'Lascano', 'La Coronilla']
      }
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          users: true,
          clients: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function updateBranch(id: string, data: any) {
  try {
    const branch = await prisma.branch.update({
      where: { id },
      data
    });
    revalidatePath("/dashboard/branches");
    return { success: true, branch };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
