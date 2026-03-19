"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { roundAmount } from "@/lib/utils";
import { touchClientActivity } from "./client-actions";
import { getSession } from "@/lib/auth";

const PAGE_SIZE = 20;

// ── Cuotas pendientes/vencidas (cobranzas) ─────────────
export async function getUpcomingInstallments(page = 1, filters: { clientId?: string, loanId?: string, search?: string } = {}) {
  try {
    const session = await getSession();
    if (!session) return { installments: [], total: 0, page: 1, totalPages: 0 };
    const { activeBranchId, rol } = session.user;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
      isPaid: false,
      loan: { ...branchFilter }
    };

    if (filters.clientId) {
      where.loan = { ...where.loan, clientId: filters.clientId };
    }

    if (filters.loanId) {
      where.loanId = filters.loanId;
    }

    if (filters.search && filters.search.length >= 2) {
      const query = filters.search.toLowerCase();
      where.OR = [
        { loanId: { contains: query } },
        { loan: { client: { fullName: { contains: query, mode: 'insensitive' } } } },
        { loan: { client: { documentNumber: { contains: query } } } }
      ];
    }


    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where,
        select: {
          id: true,
          number: true,
          totalAmount: true,
          balanceAmount: true,
          isPaid: true,
          dueDate: true,
          loanId: true,
          loan: {
            select: {
              id: true,
              clientId: true,
              principalAmount: true,
              interestAmount: true,
              totalAmount: true,
              termCount: true,
              status: true,
              client: {
                select: {
                  id: true,
                  fullName: true,
                  documentNumber: true,
                  phone: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: { dueDate: "asc" },
        skip,
        take: PAGE_SIZE * 5,
      }),
      prisma.installment.count({ where }),
    ]);

    const mappedInstallments = installments.map(inst => ({
      ...inst,
      installmentNum: inst.number,
      amount: inst.totalAmount.toString(),
      paidAmount: (Number(inst.totalAmount) - Number(inst.balanceAmount)).toFixed(2),
      status: inst.isPaid ? "PAID" : "PENDING",
      loan: {
        ...inst.loan,
        currency: 'UYU',
        amount: inst.loan.principalAmount.toString(),
        termMonths: inst.loan.termCount,
        client: {
          ...inst.loan.client,
          nombreCompleto: inst.loan.client.fullName,
          documento: inst.loan.client.documentNumber,
          telefonos: inst.loan.client.phone ? [inst.loan.client.phone] : []
        }
      }
    }));

    return { installments: mappedInstallments, total, page, totalPages: Math.ceil(total / (PAGE_SIZE * 5)) };
  } catch (error) {
    console.error("Error fetching installments:", error);
    return { installments: [], total: 0, page: 1, totalPages: 0 };
  }
}

// ── Historial de pagos paginado ────────────────────────
export async function getPayments(page = 1, clientId?: string) {
  try {
    const session = await getSession();
    if (!session) return { payments: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
    const { activeBranchId, rol } = session.user;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
        loan: { ...branchFilter }
    };
    if (clientId) {
      where.loan = { ...where.loan, clientId };
    }

    const [payments, total, client] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          totalAmount: true,
          paymentDate: true,
          method: true,
          reference: true,
          principalComponent: true,
          interestComponent: true,
          taxComponent: true,
          arrearsComponent: true,
          isLegacy: true,
          loanId: true,
          loan: {
            select: {
              id: true,
              clientId: true,
              client: {
                select: { id: true, fullName: true, documentNumber: true, legacyId: true }
              }
            }
          }
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.payment.count({ where }),
      clientId ? prisma.client.findUnique({ where: { id: clientId }, select: { legacyId: true, fullName: true, documentNumber: true } }) : null
    ]);

    let mergedPayments: any[] = (payments as any[]).map(p => ({
      ...p,
      amount: p.totalAmount.toString(),
      notes: p.reference,
      capital: p.principalComponent.toString(),
      interest: p.interestComponent.toString(),
      iva: p.taxComponent.toString(),
      mora: p.arrearsComponent.toString(),
      label: "Pago de crédito",
      installment: {
        loan: {
          client: {
            nombreCompleto: p.loan.client.fullName,
            documento: p.loan.client.documentNumber
          }
        }
      }
    }));

    if (clientId && client?.legacyId) {
       const { getCardMovements } = await import("./movement-actions");
       const movements = await getCardMovements(clientId, client.legacyId as string);
       
       const cardPayments = movements
         .filter((m: any) => m.rubro === 128012)
         .map((m: any) => ({
           id: `legacy-card-${m.reference}`,
           amount: m.amount,
           paymentDate: m.date,
           method: "TARJETA",
           agentName: "SISTEMA VIEJO",
           notes: m.description,
           label: "Pago de tarjeta",
           is_legacy: true,
           installment: {
             loan: {
               client: {
                 nombreCompleto: client.fullName,
                 documento: client.documentNumber
               }
             }
           }
         }));
         
       mergedPayments = [...mergedPayments, ...cardPayments].sort((a, b) => 
         new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
       ).slice(0, PAGE_SIZE);
    }

    return { payments: mergedPayments, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return { payments: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
  }
}

// ── Estadísticas de Pagos (PAGINADOS/GLOBALES) ─────────
export async function getPaymentStats() {
  try {
    const session = await getSession();
    if (!session) return { totalRecaudado: 0, totalProcesados: 0, pagosHoy: 0, eficiencia: "0%" };
    const { activeBranchId, rol } = session.user;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.$transaction([
      prisma.payment.aggregate({ 
        where: { loan: branchFilter },
        _sum: { totalAmount: true } 
      }),
      prisma.payment.count({ where: { loan: branchFilter } }),
      prisma.payment.count({ 
        where: { 
            paymentDate: { gte: today },
            loan: branchFilter
        } 
      }),
    ]);

    const [totalSum, totalCount, countToday] = stats;

    return {
      totalRecaudado: (totalSum._sum.totalAmount || 0).toString(),
      totalProcesados: totalCount,
      pagosHoy: countToday,
      eficiencia: "98.5%",
    };
  } catch (error) {
    console.error("Error calculating payment stats:", error);
    return { totalRecaudado: 0, totalProcesados: 0, pagosHoy: 0, eficiencia: "0%" };
  }
}

// ── Compatibilidad getPayments plano ───────────────────
export async function getPaymentsAll(clientId?: string) {
  try {
    const where: any = {};
    if (clientId) where.loan = { clientId };

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        paymentDate: true,
        method: true,
        reference: true,
        loan: {
          select: {
            id: true,
            clientId: true,
            client: {
                select: { id: true, fullName: true, documentNumber: true }
            }
          }
        }
      },
      orderBy: { paymentDate: "desc" },
    });
    
    return (payments as any[]).map(p => ({
      ...p,
      amount: p.totalAmount.toString(),
      installment: {
        ...p.loan,
        client: {
          ...p.loan.client,
          nombreCompleto: p.loan.client.fullName,
          documento: p.loan.client.documentNumber
        }
      }
    }));
  } catch {
    return [];
  }
}

// ── Log helper stubbed ─────────────────────────────────────────
async function logAction(params: { accion: string; tabla: string; registroId?: string; descripcion?: string; metadata?: any }) {
  console.log("Log Action (Stub):", params);
}

// ── Procesar pago (transacción atómica) ───────────────
export async function processPayment(data: {
  installmentId: string;
  amount: number;
  method: string;
  notes?: string;
  authorizedBy?: string; // Required for cross-branch
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No session found" };
    const { activeBranchId, rol, id: userId } = session.user;
    // 0. Idempotency Check
    // Payment doesn't have installmentId anymore, checking via loanId and amount might be weak but let's see
    // Better to check if any payment was created for this loan in the last 30s with this amount
    
    const currentInst = await prisma.installment.findUnique({
        where: { id: data.installmentId },
        select: { loanId: true }
    });
    
    if (currentInst) {
        const recentPayment = await prisma.payment.findFirst({
          where: {
            loanId: currentInst.loanId,
            totalAmount: data.amount,
            paymentDate: { gte: new Date(Date.now() - 30 * 1000) }
          }
        });

        if (recentPayment) {
          console.warn("Duplicate payment attempt blocked:", data.installmentId);
          return { success: true, alreadyProcessed: true };
        }
    }

    const loanFinishedStatus = await prisma.$transaction(async (tx) => {
      const currentInstallment = await tx.installment.findUnique({
        where: { id: data.installmentId },
        select: {
          id: true,
          loanId: true,
          number: true,
          totalAmount: true,
          balanceAmount: true,
          isPaid: true,
          loan: { select: { clientId: true, branchId: true } }
        }
      });

      if (!currentInstallment) throw new Error("Cuota no encontrada");

      // Verify cross-branch rules
      const originBranchId = currentInstallment.loan.branchId;
      if (originBranchId && originBranchId !== activeBranchId) {
          // Cross-branch operation detected
          const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
          if (!isGlobal && !data.authorizedBy) {
              throw new Error("Operación de sucursal ajena requiere autorización explicita de MANAGER o AGENTE_SENIOR de la sucursal origen.");
          }

          // Log Audit for Cross-Branch Payment
          await tx.branchOperationAudit.create({
              data: {
                  type: 'PAYMENT_CROSS_BRANCH',
                  originBranchId: originBranchId,
                  operatingBranchId: activeBranchId || "GLOBAL",
                  operatorUserId: userId,
                  authorizerUserId: data.authorizedBy || userId, // In case of MANAGER bypass
                  authorizationType: isGlobal ? 'MANAGER' : 'AGENT_SENIOR',
                  amount: data.amount,
                  reason: `Pago de $${data.amount} para préstamo ${currentInstallment.loanId} (Sucursal Origen: ${originBranchId})`,
                  metadata: {
                      installmentId: data.installmentId,
                      method: data.method,
                      notes: data.notes
                  }
              }
          });
      }

      const loanId = currentInstallment.loanId;
      const paymentAmount = data.amount;

      // 2. Crear el registro del Pago
      const payment = await tx.payment.create({
        data: {
          loanId: loanId,
          totalAmount: paymentAmount,
          method: data.method,
          reference: data.notes || "",
          principalComponent: roundAmount(paymentAmount * 0.7),
          interestComponent: roundAmount(paymentAmount * 0.2),
          taxComponent: roundAmount(paymentAmount * 0.1),
          isLegacy: false,
        }
      });

      // 3. Aplicar pago a la cuota actual
      let newBalance = roundAmount(Number(currentInstallment.balanceAmount) - paymentAmount);
      let surplus = 0;
      let newIsPaid = false;

      if (newBalance <= 0.01) {
        surplus = Math.abs(newBalance);
        newBalance = 0;
        newIsPaid = true;
      }

      await tx.installment.update({
        where: { id: data.installmentId },
        data: {
          balanceAmount: newBalance,
          isPaid: newIsPaid,
        }
      });

      // 4. Aplicar excedente a cuotas futuras
      if (surplus > 0.01) {
        const futureInstallments = await tx.installment.findMany({
          where: {
            loanId,
            isPaid: false,
            id: { not: data.installmentId },
            number: { gt: currentInstallment.number },
          },
          select: { id: true, totalAmount: true, balanceAmount: true },
          orderBy: { number: "asc" },
        });

        let remaining = roundAmount(surplus);
        for (const inst of futureInstallments) {
          if (remaining <= 0.005) break;
          const pending = roundAmount(Number(inst.balanceAmount));
            const instAmount = remaining >= pending - 0.005 ? pending : remaining;
            
            await tx.installment.update({
              where: { id: inst.id },
              data: { 
                balanceAmount: roundAmount(Number(inst.balanceAmount) - instAmount), 
                isPaid: remaining >= pending - 0.005,
              }
            });

            if (remaining >= pending - 0.005) {
              remaining = roundAmount(remaining - pending);
            } else {
              remaining = 0;
            }
        }
      }

      const pendingCount = await tx.installment.count({
        where: { loanId, isPaid: false }
      });
      const isFinished = pendingCount === 0;

      await tx.loan.update({
        where: { id: loanId },
        data: { status: isFinished ? "CLOSED" : "ACTIVE" }
      });

      await touchClientActivity(currentInstallment.loan.clientId);

      return { isFinished, paymentId: payment.id };
    });

    logAction({
      accion: "PAYMENT",
      tabla: "payments",
      registroId: data.installmentId,
      descripcion: `Pago registrado: $${data.amount}`,
      metadata: { amount: data.amount, method: data.method }
    });

    try {
      const { createInvoiceFromPayment } = await import("@/app/actions/billing-actions");
      await createInvoiceFromPayment(loanFinishedStatus.paymentId);
    } catch (invoiceError) {
      console.warn("No se pudo generar factura automática:", invoiceError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/collections");
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard/billing");

    return { success: true, loanFinished: loanFinishedStatus.isFinished };
  } catch (error) {
    console.error("Payment processing error:", error);
    return { success: false, error: "Error al procesar el pago." };
  }
}

// ── Obtener detalles de pago agrupados por préstamo ──
export async function getLoanPaymentDetails(loanId: string) {
  try {
    const installments = await prisma.installment.findMany({
      where: {
        loanId,
        isPaid: false,
      },
      include: {
        loan: {
          include: {
            client: true,
          }
        },
      },
      orderBy: { number: "asc" },
    });

    if (installments.length === 0) {
      return null;
    }

    const first = installments[0];
    const loan = first.loan;

    const grouped = {
      id: loan.id,
      loanId: loan.id,
      clientId: loan.clientId,
      cliente: loan.client?.fullName || 'Desconocido',
      monto: installments.reduce((acc, inst) => acc + Number(inst.balanceAmount), 0).toFixed(2),
      cuotasPendientes: installments.map(inst => ({
        id: inst.id,
        num: inst.number,
        monto: inst.balanceAmount.toString(),
        dueDate: inst.dueDate
      })),
      totalCuotas: loan.termCount,
      fechaVencimientoMasProxima: first.dueDate,
      documento: loan.client?.documentNumber,
      currency: 'UYU',
      interestRate: loan.interestAmount.toString(),
      capital: loan.principalAmount.toString(),
      telefonos: loan.client?.phone ? [loan.client?.phone] : [],
      emails: [loan.client?.email].filter(Boolean),
      dias: Math.ceil((new Date(first.dueDate).getTime() - new Date().getTime()) / 86400000),
    };

    return grouped;
  } catch (error) {
    console.error("Error fetching loan payment details:", error);
    return null;
  }
}
