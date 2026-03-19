"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ClientDTO } from "@/types/dtos";
import { normalizeDocument } from "@/lib/utils";
import { mapToClientDTO, mapStagingToClientDTO } from "@/lib/mappers/unified-mappers";

const CLIENT_SELECT = {
  id: true,
  documentType: true,
  documentNumber: true,
  fullName: true,
  email: true,
  phone: true,
  address: true,
  gender: true,
  maritalStatus: true,
  birthDate: true,
  registrationDate: true,
  nationality: true,
  housingType: true,
  jobTitle: true,
  employmentDescription: true,
  alternatePhone: true,
  spouseDocument: true,
  remarkCategory: true,
  isLegacy: true,
  legacyId: true,
  branchId: true,
  employerId: true,
  employer: true,
  workplaceName: true,
  createdAt: true,
  updatedAt: true,
};

const PAGE_SIZE = 20;

export async function getClients(page = 1, search = "", clientId?: string) {
  try {
    const session = await getSession();
    if (!session) return { clients: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
    
    const { activeBranchId, rol, role } = session.user;
    const userRole = rol || role;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(userRole);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const skip = (page - 1) * PAGE_SIZE;
    const where: any = { ...branchFilter };

    if (clientId) {
      where.id = clientId;
    } else if (search && search.length >= 2) {
      const normalizedSearch = normalizeDocument(search);
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
        normalizedSearch ? { documentNumber: { contains: normalizedSearch } } : null,
      ].filter(Boolean);
    }

    const [dbClients, dbTotal] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          ...CLIENT_SELECT,
          loans: {
            select: { id: true, operationNumber: true, status: true },
            take: 5,
          }
        },
        orderBy: { fullName: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.client.count({ where }),
    ]);

    const clientDTOs: ClientDTO[] = dbClients.map(c => mapToClientDTO(c));

    return { 
      clients: clientDTOs, 
      total: dbTotal, 
      page, 
      pageSize: PAGE_SIZE, 
      totalPages: Math.ceil(dbTotal / PAGE_SIZE) || 1
    };
  } catch (error) {
    console.error("Error in getClients:", error);
    throw error;
  }
}

export async function getClientByDocument(documentNumber: string): Promise<ClientDTO | null> {
  try {
    const c = await prisma.client.findUnique({
      where: { documentNumber },
      include: {
        employer: true,
        loans: {
          select: { status: true }
        }
      }
    });

    if (!c) return null;
    return mapToClientDTO(c);
  } catch (error) {
    console.error("Error fetching client by document:", error);
    return null;
  }
}

export async function createClient(data: any) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No session found" };
    const { activeBranchId } = session.user;

    const client = await prisma.client.create({
      data: {
        documentType: data.documentType || "CI",
        documentNumber: data.documentNumber || data.documento,
        fullName: `${data.nombre || data.fullName} ${data.apellido || ""}`.trim(),
        email: data.emails?.length > 0 ? data.emails[0] : (data.email || null),
        phone: data.telefonos?.length > 0 ? data.telefonos[0] : (data.phone || null),
        address: data.address || data.streetAndNum || null,
        gender: data.gender || data.sex || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        isLegacy: false,
        branchId: activeBranchId,
        employerId: data.employerId || null,
        workplaceName: data.workplaceName || data.workData?.company || null,
      }
    });

    revalidatePath("/dashboard/clients");
    return { success: true, data: mapToClientDTO(client) };
  } catch (error: any) {
    console.error("Error creating client:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Ya existe un cliente con ese número de documento." };
    }
    return { success: false, error: "Error al crear el cliente." };
  }
}

export async function updateClient(id: string, data: any) {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber || data.documento,
        fullName: data.fullName || `${data.nombre} ${data.apellido || ""}`.trim(),
        email: data.emails?.length > 0 ? data.emails[0] : data.email,
        phone: data.telefonos?.length > 0 ? data.telefonos[0] : data.phone,
        address: data.address || data.streetAndNum,
        gender: data.gender || data.sex,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        remarkCategory: data.remarkCategory,
        employerId: data.employerId,
        workplaceName: data.workplaceName || data.workData?.company,
      }
    });

    revalidatePath("/dashboard/clients");
    return { success: true, data: client };
  } catch (error: any) {
    console.error("Error updating client:", error);
    return { success: false, error: "Error al actualizar the cliente." };
  }
}

export async function deleteClient(id: string) {
  try {
    const activeLoansCount = await prisma.loan.count({
      where: { clientId: id, status: "ACTIVE" }
    });

    if (activeLoansCount > 0) {
      return { 
        success: false, 
        error: "No se puede eliminar un cliente con préstamos activos." 
      };
    }

    await prisma.client.delete({ where: { id } });
    revalidatePath("/dashboard/clients");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteClient:", error);
    return { success: false, error: "Error al intentar eliminar el cliente." };
  }
}

export async function touchClientActivity(clientId: string) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error("Error touching client activity:", error);
  }
}
