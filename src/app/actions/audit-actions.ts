"use server";

import prisma from "@/lib/prisma";
import { HistoricalEventDTO } from "@/types/dtos";
import { normalizeDocument, formatDate, parseStagingDate } from "@/lib/utils";
import { mapToHistoricalEventDTO } from "@/lib/mappers/unified-mappers";

export async function getClientHistory(documentNumber: string): Promise<HistoricalEventDTO[]> {
  try {
    const cleanDoc = normalizeDocument(documentNumber);
    
    // 1. Fetch historical events (Legacy migrations and New payments)
    const events = await prisma.historicalEvent.findMany({
      where: { 
        OR: [
          { clientDocument: documentNumber },
          { clientDocument: cleanDoc }
        ]
      },
      orderBy: { eventDate: 'desc' },
    });

    // 2. Fetch non-active loans (Finished / Refinanced) to show as history
    const historicalLoans = await prisma.loan.findMany({
      where: {
        client: { 
          OR: [
            { documentNumber: documentNumber },
            { documentNumber: cleanDoc }
          ]
        },
        status: { not: 'ACTIVE' }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedEvents = events.map(mapToHistoricalEventDTO);

    // 3. Fetch raw legacy data from staging if needed (for auditors like the user)
    // We try to find movements in FSH016 (Account movements)
    const legacyMovements = await (prisma as any).staging_FSH016.findMany({
      where: { 
        OR: [
          { hhCta: documentNumber },
          { hhCta: cleanDoc }
        ]
      },
      take: 50,
      orderBy: { hhFcon: 'desc' }
    });

    const projectedLegacyEvents: HistoricalEventDTO[] = legacyMovements.map((move: any) => {
      const parsedDate = parseStagingDate(move.hhFcon);
      return {
        id: move.id,
        eventType: 'CUSTOMER_RECEIPT',
        eventDate: parsedDate.toISOString(),
        legacyOperation: move.hhOper,
        principalAmount: move.hhImp1 || '0',
        interestAmount: '0',
        taxAmount: '0',
        arrearsAmount: '0',
        totalAmount: move.hhImp1 || '0',
        receiptLabel: `LEG-RUB-${move.hhRubro}`,
        isLegacy: true,
        source: 'LEGACY',
        isReadOnly: true,
        label: `MOVIMIENTO LEGADO (${move.hhRubro})`,
        amount: move.hhImp1 || '0',
        date: parsedDate.toISOString(),
        type: 'PAYMENT_LEGACY',
        currency: 'UYU'
      };
    });

    // Combine and sort
    const projectedLoanEvents: HistoricalEventDTO[] = historicalLoans.map((loan: any) => ({
      id: loan.id,
      eventType: loan.status === 'REFINANCED' ? 'TERM_REFINANCE' : 'LOAN_FINISHED',
      eventDate: loan.updatedAt.toISOString(),
      legacyOperation: loan.operationNumber,
      principalAmount: loan.principalAmount.toString(),
      interestAmount: loan.interestAmount.toString(),
      taxAmount: loan.taxAmount.toString(),
      arrearsAmount: '0',
      totalAmount: loan.totalAmount.toString(),
      receiptLabel: loan.status === 'REFINANCED' ? 'REFINANCIADO' : 'CANCELADO',
      isLegacy: !!loan.isLegacy,
      source: loan.isLegacy ? 'LEGACY' : 'NEW_SYSTEM',
      isReadOnly: true,
      label: loan.status === 'REFINANCED' ? 'PRÉSTAMO REFINANCIADO' : 'PRÉSTAMO CANCELADO',
      amount: loan.totalAmount.toString(),
      date: loan.updatedAt.toISOString(),
      type: loan.status === 'REFINANCED' ? 'REFINANCE' : 'FINISHED',
      currency: 'UYU'
    }));

    const allEvents = [...mappedEvents, ...projectedLoanEvents, ...projectedLegacyEvents].sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );

    return allEvents;
  } catch (error) {
    console.error("Error fetching client history:", error);
    return [];
  }
}

export async function getLoanHistory(operationNumber: string): Promise<HistoricalEventDTO[]> {
  try {
    const events = await prisma.historicalEvent.findMany({
      where: { legacyOperation: operationNumber },
      orderBy: { eventDate: 'desc' },
    });

    return events.map(mapToHistoricalEventDTO);
  } catch (error) {
    console.error("Error fetching loan history:", error);
    return [];
  }
}

export async function getAuditLogs(page = 1) {
    const skip = (page - 1) * 20;
    try {
        const auditLogs = await prisma.branchOperationAudit.findMany({
            take: 20,
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                operator: true,
                originBranch: true,
                operatingBranch: true
            }
        });

        const count = await prisma.branchOperationAudit.count();

        return {
            logs: auditLogs.map(log => ({
                id: log.id,
                createdAt: log.createdAt,
                action: log.type,
                entityType: "BRANCH_OPERATION",
                entityId: log.loanId || log.clientId || "N/A",
                user: {
                    nombreCompleto: `${log.operator.firstName} ${log.operator.lastName}`,
                    rol: log.operator.role
                },
                description: `Operación desde ${log.originBranch.name} hacia ${log.operatingBranch.name}${log.isAuthorized ? ' (Autorizada)' : ''}`
            })),
            totalPages: Math.ceil(count / 20)
        };
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return { logs: [], totalPages: 0 };
    }
}

export async function getSecurityEvents(page = 1) {
    // For now, we return empty as we don't have a separate SecurityEvent model yet,
    // but we could use logs with specialized types if needed.
    return { events: [], totalPages: 0 };
}
