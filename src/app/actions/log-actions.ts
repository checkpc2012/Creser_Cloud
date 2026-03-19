"use server";

import prisma from "@/lib/prisma";

export async function logAction(params: { 
  accion: string; 
  tabla: string; 
  registroId?: string; 
  descripcion?: string; 
  metadata?: any 
}) {
  try {
    await prisma.systemLog.create({
      data: {
        accion: params.accion,
        tabla: params.tabla,
        registroId: params.registroId,
        descripcion: params.descripcion,
        metadata: params.metadata,
      }
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
}
