"use server";

import prisma from "@/lib/prisma";

export async function getCardMovements(clientId: string, legacyId?: string) {
  try {
    const doc = legacyId || clientId;
    if (!doc) return [];

    // Rubros identifying card movements
    const cardRubros = ["128011", "128012"];
    
    const movements = await prisma.staging_FSH016.findMany({
      where: {
        hhCta: doc,
        hhRubro: { in: cardRubros }
      },
      orderBy: { hhFcon: 'desc' }
    });

    return movements.map((m: any) => {
      const amount = parseFloat(m.hhImp1 || "0");
      const isDebit = m.hhRubro === "128011";
      
      return {
        date: m.hhFcon,
        amount: amount.toString(),
        rubro: m.hhRubro,
        paymentDate: m.hhFcon, // In FSH016, hhFcon is the effective date
        reference: m.id.substring(0, 8),
        description: isDebit ? 'MOVIMIENTO TARJETA' : 'PAGO TARJETA',
        type: isDebit ? 'DEBIT' : 'CREDIT',
        movement_type: isDebit ? 'PURCHASE' : 'PAYMENT', // Match UI expectations in client-detail-drawer
      };
    });
  } catch (error) {
    console.error("Error fetching card movements from PostgreSQL:", error);
    return [];
  }
}
