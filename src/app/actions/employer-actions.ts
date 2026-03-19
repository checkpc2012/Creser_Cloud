
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { EmployerDTO } from "@/types/dtos";
import { mapToEmployerDTO } from "@/lib/mappers/unified-mappers";

const PAGE_SIZE = 20;

export async function getEmployers(page = 1, search = "") {
  try {
    const session = await getSession();
    if (!session) return { employers: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };

    const skip = (page - 1) * PAGE_SIZE;
    const where: any = {};

    if (search && search.length >= 2) {
      where.OR = [
        { employerName: { contains: search, mode: "insensitive" } },
        { employerCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [dbEmployers, dbTotal] = await Promise.all([
      prisma.employer.findMany({
        where,
        include: {
          _count: {
            select: { clients: true }
          }
        },
        orderBy: { employerName: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.employer.count({ where }),
    ]);

    const employerDTOs: EmployerDTO[] = dbEmployers.map(e => mapToEmployerDTO(e));

    return { 
      employers: employerDTOs, 
      total: dbTotal, 
      page, 
      pageSize: PAGE_SIZE, 
      totalPages: Math.ceil(dbTotal / PAGE_SIZE) || 1
    };
  } catch (error) {
    console.error("Error in getEmployers:", error);
    throw error;
  }
}

export async function getEmployerById(id: string): Promise<EmployerDTO | null> {
  try {
    const e = await prisma.employer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    });

    if (!e) return null;
    return mapToEmployerDTO(e);
  } catch (error) {
    console.error("Error fetching employer by ID:", error);
    return null;
  }
}

export async function createEmployer(data: { employerName: string; employerCode?: string; type?: string }) {
  try {
    const e = await prisma.employer.create({
      data: {
        employerName: data.employerName.toUpperCase(),
        employerCode: data.employerCode || `MAN-${Date.now().toString().slice(-6)}`,
        type: (data.type as any) || "PRIVATE_COMPANY",
        researchStatus: "PENDING",
        isLegacy: false,
      }
    });

    revalidatePath("/dashboard/employers");
    return { success: true, data: mapToEmployerDTO(e) };
  } catch (error) {
    console.error("Error creating employer:", error);
    return { success: false, error: "Error al crear el lugar de trabajo." };
  }
}

export async function updateEmployerResearch(id: string, data: any) {
  try {
    const e = await prisma.employer.update({
      where: { id },
      data: {
        publicPhone: data.publicPhone,
        publicMobile: data.publicMobile,
        whatsapp: data.whatsapp,
        publicEmail: data.publicEmail,
        website: data.website,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        notes: data.notes,
        researchStatus: data.researchStatus || "RESEARCHED",
        verifiedAt: data.researchStatus === "VERIFIED" ? new Date() : undefined,
        updatedAt: new Date()
      }
    });

    revalidatePath("/dashboard/employers");
    return { success: true, data: e };
  } catch (error) {
    console.error("Error updating employer research:", error);
    return { success: false, error: "Error al actualizar la investigación." };
  }
}
