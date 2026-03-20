
"use server";

import prisma from "@/lib/prisma";
import { LoanDTO, InstallmentDTO } from "@/types/dtos";
import { getSession } from "@/lib/auth";
export { getSession };
import { mapToLoanDTO, mapToHistoricalEventDTO } from "@/lib/mappers/unified-mappers";
import { CreditEngine, AmortizationSystem, CreditEngineResult } from "@/lib/credit-engine";

export async function getClientLoans(clientId: string): Promise<LoanDTO[]> {
  try {
    const session = await getSession();
    if (!session) return [];
    const { activeBranchId, rol } = session.user;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const loans = await prisma.loan.findMany({
      where: { clientId, ...branchFilter },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map(l => mapToLoanDTO(l));
  } catch (error) {
    console.error("Error fetching client loans:", error);
    return [];
  }
}

export async function getLoanById(loanId: string): Promise<(LoanDTO & { installments: InstallmentDTO[] }) | null> {
  return getLoanDetails(loanId);
}

export async function getLoanDetails(loanId: string): Promise<(LoanDTO & { installments: InstallmentDTO[] }) | null> {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!loan) return null;

    const loanDTO = mapToLoanDTO(loan);
    
    return {
      ...loanDTO,
      installments: loan.installments.map(i => ({
        id: i.id,
        number: i.number,
        dueDate: i.dueDate.toISOString(),
        principalAmount: i.principalAmount.toString(),
        interestAmount: i.interestAmount.toString(),
        taxAmount: i.taxAmount.toString(),
        arrearsAmount: i.arrearsAmount.toString(),
        totalAmount: i.totalAmount.toString(),
        balanceAmount: i.balanceAmount.toString(),
        isPaid: i.isPaid,
      })),
    };
  } catch (error) {
    console.error("Error fetching loan details:", error);
    return null;
  }
}

export async function createLoan(data: {
  clientId: string;
  principalAmount: number;
  annualRate: number;
  termCount: number;
  amortizationSystem: AmortizationSystem;
  startDate?: string;
  ivaRate?: number;
  promotionId?: string;
}): Promise<{ success: boolean; data?: { id: string } | null; error?: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No session found" };
    
    const { rol, activeBranchId } = session.user;
    const amount = Number(data.principalAmount);

    // Validaciones de Negocio Básicas
    if (amount <= 0) return { success: false, error: "El monto del préstamo debe ser mayor a 0." };
    if (data.annualRate <= 0) return { success: false, error: "La tasa anual debe ser mayor a 0." };
    if (data.termCount <= 0) return { success: false, error: "El plazo debe ser de al menos 1 cuota." };

    // Authorization limits
    if (rol === 'AGENT') {
        if (amount > 25000) return { success: false, error: "El monto supera el límite de un AGENTE ($25,000). Requiere autorización de nivel superior." };
    } else if (rol === 'AGENT_SENIOR') {
        if (amount > 40000) return { success: false, error: "El monto supera el límite de un AGENTE_SENIOR ($40,000). Requiere autorización de MANAGER." };
    }

    // Generate Plan
    const plan = CreditEngine.generateInstallmentPlan({
      principalAmount: amount,
      annualRate: data.annualRate,
      termCount: data.termCount,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      amortizationSystem: data.amortizationSystem,
      ivaRate: data.ivaRate || 0.22
    });

    // Persistence
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          clientId: data.clientId,
          operationNumber: `L-${Date.now().toString().slice(-6)}`,
          principalAmount: amount,
          interestAmount: plan.metadata.totalInterest,
          taxAmount: plan.metadata.totalTax,
          totalAmount: plan.metadata.totalAmount,
          outstandingBalance: plan.metadata.totalAmount,
          termCount: data.termCount,
          status: 'ACTIVE',
          isLegacy: false,
          branchId: activeBranchId,
          promotionId: data.promotionId,
          // Store engine metadata in the loan or a related table if schema allowed, 
          // for now we use the existing fields and ensure they are populated.
          installments: {
            create: plan.installments.map(inst => ({
              number: inst.number,
              dueDate: inst.dueDate,
              principalAmount: inst.principalAmount,
              interestAmount: inst.interestAmount,
              taxAmount: inst.taxAmount,
              totalAmount: inst.totalAmount,
              balanceAmount: inst.balanceAmount,
              isPaid: false
            }))
          }
        }
      });
      return loan;
    });

    return { success: true, data: { id: result.id } };
  } catch (error: any) {
    console.error("Error creating loan:", error);
    return { success: false, error: error.message || "Error interno en createLoan" };
  }
}

export async function simulateLoanPlan(params: {
  principalAmount: number;
  annualRate: number;
  termCount: number;
  amortizationSystem: AmortizationSystem;
  startDate?: string;
  ivaRate?: number;
}): Promise<CreditEngineResult> {
  if (params.principalAmount <= 0) {
    throw new Error("El monto a simular debe ser mayor a 0");
  }
  return CreditEngine.generateInstallmentPlan({
    ...params,
    startDate: params.startDate ? new Date(params.startDate) : new Date(),
    ivaRate: params.ivaRate || 0.22
  });
}

export async function getLoanHistory(operationNumber: string): Promise<any[]> {
  try {
    const events = await prisma.historicalEvent.findMany({
      where: { legacyOperation: operationNumber },
      orderBy: { eventDate: 'desc' },
    });

    return events.map(e => mapToHistoricalEventDTO(e));
  } catch (error) {
    console.error("Error in getLoanHistory:", error);
    return [];
  }
}

export async function getLoans(page = 1, filters: any = {}) {
    try {
        const session = await getSession();
        if (!session) return { loans: [], total: 0, page: 1, totalPages: 0 };
        
        const { activeBranchId, rol } = session.user;
        const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
        const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

        const skip = (page - 1) * 20;
        const where: any = { ...branchFilter };
        if (filters.clientId) where.clientId = filters.clientId;
        if (filters.search) {
            where.OR = [
                { id: { contains: filters.search } },
                { operationNumber: { contains: filters.search } },
                { client: { fullName: { contains: filters.search, mode: 'insensitive' } } }
            ];
        }

        const [loans, total] = await Promise.all([
            prisma.loan.findMany({
                where,
                include: { client: true },
                skip,
                take: 20,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.loan.count({ where })
        ]);

        return {
            loans: loans.map(l => ({
                ...mapToLoanDTO(l),
                clientName: l.client.fullName
            })),
            total,
            page,
            totalPages: Math.ceil(total / 20)
        };
    } catch (error) {
        console.error("Error in getLoans:", error);
        return { loans: [], total: 0, page: 1, totalPages: 0 };
    }
}

export async function getLoanStats() {
    return {
        totalPrestado: 0,
        totalCobrado: 0,
        porCobrar: 0,
        totalACobrar: 0
    };
}

export async function getRefinanceSummary(loanId: string) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: {
          where: { isPaid: false },
        },
      },
    });

    if (!loan) throw new Error("Préstamo no encontrado");
    if (loan.status === 'CLOSED' || loan.status === 'REFINANCED') {
      throw new Error(`El préstamo ya está ${loan.status === 'CLOSED' ? 'CERRADO' : 'REFINANCIADO'}`);
    }

    const principalPending = loan.installments.reduce((sum, inst) => sum + Number(inst.principalAmount), 0);
    const interestPending = loan.installments.reduce((sum, inst) => sum + Number(inst.interestAmount), 0);
    const taxPending = loan.installments.reduce((sum, inst) => sum + Number(inst.taxAmount), 0);
    const arrearsPending = loan.installments.reduce((sum, inst) => sum + Number(inst.arrearsAmount), 0);

    return {
      loanId: loan.id,
      operationNumber: loan.operationNumber,
      principalPending,
      interestPending,
      taxPending,
      arrearsPending,
      totalPending: principalPending + interestPending + taxPending + arrearsPending,
      clientId: loan.clientId,
    };
  } catch (error: any) {
    console.error("Error in getRefinanceSummary:", error);
    throw error;
  }
}

export async function refinanceLoan(data: {
  originalLoanId: string;
  newPrincipalAmount: number;
  annualRate: number;
  termCount: number;
  amortizationSystem: AmortizationSystem;
  newReason?: string;
}) {
  try {
    const session = await getSession();
    if (!session) throw new Error("No session found");

    const summary = await getRefinanceSummary(data.originalLoanId);
    
    // Validaciones de Negocio
    if (data.newPrincipalAmount < summary.totalPending) {
        return { success: false, error: `El nuevo monto ($${data.newPrincipalAmount}) no puede ser menor a la deuda pendiente ($${summary.totalPending}).` };
    }
    if (data.annualRate <= 0) return { success: false, error: "La tasa anual debe ser mayor a 0." };
    if (data.termCount <= 0) return { success: false, error: "El plazo debe ser de al menos 1 cuota." };
    const plan = CreditEngine.generateInstallmentPlan({
        principalAmount: data.newPrincipalAmount,
        annualRate: data.annualRate,
        termCount: data.termCount,
        startDate: new Date(),
        amortizationSystem: data.amortizationSystem,
        ivaRate: 0.22
      });

    // Transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear nuevo préstamo con el plan del motor
      const newLoan = await tx.loan.create({
        data: {
          clientId: summary.clientId,
          operationNumber: `REF-${summary.operationNumber}-${Date.now().toString().slice(-4)}`,
          principalAmount: data.newPrincipalAmount,
          interestAmount: plan.metadata.totalInterest,
          taxAmount: plan.metadata.totalTax,
          totalAmount: plan.metadata.totalAmount,
          outstandingBalance: plan.metadata.totalAmount,
          termCount: data.termCount,
          status: 'ACTIVE',
          isLegacy: false,
          branchId: session.user.activeBranchId,
          refinancedFromId: data.originalLoanId,
          refinanceReason: data.newReason || "Refinanciación operativa",
          refinanceCreatedBy: session.user.username,
          installments: {
            create: plan.installments.map(inst => ({
              number: inst.number,
              dueDate: inst.dueDate,
              principalAmount: inst.principalAmount,
              interestAmount: inst.interestAmount,
              taxAmount: inst.taxAmount,
              totalAmount: inst.totalAmount,
              balanceAmount: inst.balanceAmount,
              isPaid: false
            }))
          }
        }
      });

      // 2. Marcar el original como refinanciado
      await tx.loan.update({
        where: { id: data.originalLoanId },
        data: { status: 'REFINANCED' }
      });

      // 3. Cancelar cuotas pendientes del original
      await tx.installment.updateMany({
        where: { loanId: data.originalLoanId, isPaid: false },
        data: { 
            isPaid: true,
            arrearsAmount: 0 // Limpiamos mora para el historial ya que se absorbe
        }
      });

      return newLoan;
    });

    return { success: true, loanId: result.id };
  } catch (error: any) {
    console.error("Error in refinanceLoan:", error);
    return { success: false, error: error.message };
  }
}
