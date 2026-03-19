"use server";

import prisma from "@/lib/prisma";
import { normalizeSearch, roundAmount } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { getSession } from "@/lib/auth";

const CLIENT_DASHBOARD_SELECT = {
  id: true,
  fullName: true,
};

const LOAN_DASHBOARD_SELECT = {
  id: true,
  totalAmount: true,
  termCount: true,
  isLegacy: true,
  createdAt: true,
  client: { select: CLIENT_DASHBOARD_SELECT },
} as any;

// ── Estadísticas Globales del Dashboard (CACHED) ──────
const getDashboardStatsCached = unstable_cache(
  async (activeBranchId: string | null, rol: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
      const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

      const [
        clientsCount,
        activeCapitalAgg,
        legacyCapitalAgg,
        lentThisMonthAgg,
        overdueCount,
        pendingApprovals,
        lastRate,
      ] = await Promise.all([
        prisma.client.count({ where: branchFilter }),
        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: false, ...branchFilter } as any,
          _sum: { totalAmount: true },
        }),
        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: true, ...branchFilter } as any,
          _sum: { totalAmount: true },
        }),
        prisma.loan.aggregate({
          where: { createdAt: { gte: startOfMonth }, ...branchFilter },
          _sum: { totalAmount: true },
        }),
        prisma.installment.count({
          where: {
            dueDate: { lt: startOfToday },
            isPaid: false,
            loan: branchFilter
          },
        }),
        // Stub for missing models
        Promise.resolve(0), // approvalRequest count
        Promise.resolve(null), // exchangeRate
      ]);

      const activeCapital = roundAmount(Number(activeCapitalAgg._sum.totalAmount ?? 0));
      const legacyCapital = roundAmount(Number(legacyCapitalAgg._sum.totalAmount ?? 0));
      const lentThisMonth = roundAmount(Number(lentThisMonthAgg._sum.totalAmount ?? 0));

      const lastRateDate = lastRate ? (lastRate as any).observedAt : null;
      const rateStatus = !lastRateDate || lastRateDate < twentyFourHoursAgo ? "OUTDATED" : "OK";

      return {
        clientsCount,
        activeCapital: activeCapital.toString(),
        legacyCapital: legacyCapital.toString(),
        totalGlobalCapital: (activeCapital + legacyCapital).toString(),
        lentThisMonth: lentThisMonth.toString(),
        overdueCount,
        pendingApprovals,
        rateStatus,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);
      return {
        clientsCount: 0, activeCapital: 0, legacyCapital: 0, totalGlobalCapital: 0,
        lentThisMonth: 0, overdueCount: 0, pendingApprovals: 0, rateStatus: "ERROR",
        lastUpdate: null
      };
    }
  },
  ["dashboard-global-stats"],
  { revalidate: 300, tags: ["dashboard", "loans", "payments"] }
);

export async function getDashboardStats() {
  const session = await getSession();
  if (!session) return null;
  return getDashboardStatsCached(session.user.activeBranchId, session.user.rol);
}

const getDashboardDataCached = unstable_cache(
  async (activeBranchId: string | null, rol: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
      const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

      // ── 1. Estadísticas en paralelo — solo aggregate, no arrays completos ──
      const [
        clientsCount,
        activeCapitalAgg,
        legacyCapitalAgg,
        lentThisMonthAgg,
        lentLastMonthAgg,
        todayLoans,
      ] = await Promise.all([
        prisma.client.count({ where: branchFilter }),

        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: false, ...branchFilter } as any,
          _sum: { totalAmount: true },
        }),

        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: true, ...branchFilter } as any,
          _sum: { totalAmount: true },
        }),

        prisma.loan.aggregate({
          where: { createdAt: { gte: startOfMonth }, ...branchFilter },
          _sum: { totalAmount: true },
        }),

        prisma.loan.aggregate({
          where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth }, ...branchFilter },
          _sum: { totalAmount: true },
        }),

        (prisma.loan.findMany({
          where: { createdAt: { gte: startOfToday }, ...branchFilter },
          select: {
            id: true,
            totalAmount: true,
            termCount: true,
            isLegacy: true,
            client: { select: { fullName: true } },
          } as any,
          take: 10,
        }) as any),
      ]);

      const activeCapital = roundAmount(Number(activeCapitalAgg._sum.totalAmount ?? 0));
      const legacyCapital = roundAmount(Number(legacyCapitalAgg._sum.totalAmount ?? 0));
      const lentThisMonth = roundAmount(Number(lentThisMonthAgg._sum.totalAmount ?? 0));
      const lentLastMonth = roundAmount(Number(lentLastMonthAgg._sum.totalAmount ?? 0));
      const monthlyGrowth = lentLastMonth > 0
        ? roundAmount(((lentThisMonth - lentLastMonth) / lentLastMonth) * 100, 2)
        : 0;

      // ── 2. Mora — cuotas vencidas agrupadas ────────────────
      const overdueInstallments = await prisma.installment.findMany({
        where: {
          isPaid: false,
          dueDate: { lt: startOfToday },
          loan: branchFilter
        },
        select: {
          loanId: true,
          totalAmount: true,
          // paidAmount missing, using balanceAmount or totalAmount?
          // Schema has: principalAmount, interestAmount, taxAmount, arrearsAmount, totalAmount, balanceAmount
          balanceAmount: true,
          dueDate: true,
          loan: {
            select: { client: { select: CLIENT_DASHBOARD_SELECT } }
          },
        },
        orderBy: { dueDate: "asc" },
        take: 200, // Limitar para el dashboard
      });

      const moraPorPrestamo = overdueInstallments.reduce((acc: any[], inst: any) => {
        const existing = acc.find(a => a.loanId === inst.loanId);
        const diasDeMora = Math.ceil((now.getTime() - new Date(inst.dueDate).getTime()) / 86400000);
        // Using balanceAmount as the remaining amount to pay
        const remainingAmount = roundAmount(Number(inst.balanceAmount));

        if (existing) {
          existing.amount = roundAmount(existing.amount + remainingAmount);
          if (diasDeMora > existing.maxDias) existing.maxDias = diasDeMora;
        } else {
          acc.push({
            loanId: inst.loanId,
            cliente: inst.loan.client.fullName,
            amount: remainingAmount,
            maxDias: diasDeMora,
          });
        }
        return acc;
      }, []);

      // ── 3. Actividad reciente ──────────────────────────────
      const [recentLoans, recentPayments] = await Promise.all([
        (prisma.loan.findMany({
          where: { createdAt: { gte: thirtyDaysAgo }, ...branchFilter },
          take: 50, // Larger pool for 30 days
          orderBy: { createdAt: "desc" },
          select: LOAN_DASHBOARD_SELECT
        }) as any),
        prisma.payment.findMany({
          where: { 
            paymentDate: { gte: thirtyDaysAgo },
            loan: branchFilter
          },
          take: 50,
          orderBy: { paymentDate: "desc" },
          select: {
            id: true,
            totalAmount: true,
            paymentDate: true,
            loan: {
              select: {
                client: { select: CLIENT_DASHBOARD_SELECT }
              }
            }
          }
        }),
      ]);

      const recentActivity = [
        ...recentLoans.map((l: any) => ({
          id: `loan-${l.id}`,
          type: "loan",
          user: l.client.fullName,
          amount: l.totalAmount.toString(),
          rawDate: l.createdAt,
        })),
        ...recentPayments.map((p: any) => ({
          id: `pay-${p.id}`,
          type: "payment",
          user: p.loan.client.fullName,
          amount: p.totalAmount.toString(),
          rawDate: p.paymentDate,
        })),
      ]
        .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
        .slice(0, 10)
        .map(item => ({ ...item, date: new Date(item.rawDate).toLocaleDateString("es-UY") }));

      // ── 4. Próximos vencimientos ───────────────────────────
      const upcomingInstallments = await prisma.installment.findMany({
        where: {
          isPaid: false,
          dueDate: { gte: startOfToday },
          loan: branchFilter
        },
        select: {
          id: true,
          loanId: true,
          number: true,
          totalAmount: true,
          balanceAmount: true,
          dueDate: true,
          loan: {
            select: {
              termCount: true,
              client: { select: { fullName: true, documentNumber: true } },
            }
          }
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      });

      const vencimientos = upcomingInstallments.map(inst => ({
        id: inst.id,
        loanId: inst.loanId,
        cliente: inst.loan.client.fullName,
        documento: inst.loan.client.documentNumber,
        amount: inst.balanceAmount.toString(),
        installmentNumber: inst.number,
        totalInstallments: inst.loan.termCount,
        dueDate: inst.dueDate,
        dias: Math.ceil((new Date(inst.dueDate).getTime() - now.getTime()) / 86400000),
      }));

      return {
        stats: {
          clientsCount,
          lentThisMonth: lentThisMonth.toString(),
          lentLastMonth: lentLastMonth.toString(),
          monthlyGrowth,
          todayLoansCount: todayLoans.length,
          todayLoansItems: todayLoans.map((l: any) => ({
            id: l.id,
            cliente: l.client.fullName,
            monto: l.totalAmount.toString(),
            cuotas: l.termCount,
            isLegacy: l.isLegacy
          })),
          activeCapital: activeCapital.toString(),
          legacyCapital: legacyCapital.toString(),
          totalGlobalCapital: (activeCapital + legacyCapital).toString(),
          moraCount: moraPorPrestamo.length,
        },
        urgency: {
          highRiskMora: moraPorPrestamo.filter((m: any) => m.maxDias > 30).slice(0, 5),
          criticalApprovals: [], // To be populated if needed
        },
        recentActivity,
        vencimientos,
        mora: {
          masMora: [...moraPorPrestamo].sort((a, b) => b.maxDias - a.maxDias).slice(0, 10),
          menosMora: [...moraPorPrestamo].sort((a, b) => a.maxDias - b.maxDias).slice(0, 10),
        },
      };
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      return {
        stats: { clientsCount: 0, lentThisMonth: "0", lentLastMonth: "0", monthlyGrowth: 0, todayLoansCount: 0, todayLoansItems: [], activeCapital: "0", legacyCapital: "0", totalGlobalCapital: "0", moraCount: 0 },
        urgency: { highRiskMora: [], criticalApprovals: [] },
        recentActivity: [],
        vencimientos: [],
        mora: { masMora: [], menosMora: [] },
      };
    }

  },
  ['dashboard-data'],
  { revalidate: 60, tags: ['dashboard'] }
);

export async function getDashboardData() {
  const session = await getSession();
  if (!session) return null;
  return getDashboardDataCached(session.user.activeBranchId, session.user.rol);
}

export async function getLoansByDate(dateStr: string) {
  try {
    const targetDate = new Date(dateStr + "T12:00:00");
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const loans = await prisma.loan.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: {
        id: true,
        totalAmount: true,
        termCount: true,
        client: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return loans.map(l => ({
      id: l.id,
      cliente: l.client.fullName,
      monto: Number(l.totalAmount),
      cuotas: l.termCount,
    }));
  } catch (error) {
    console.error("Error fetching loans by date:", error);
    return [];
  }
}

export async function searchLoansQuick(query: string) {
  // Minimum 2 chars to start searching; 0 or 1 char returns empty
  if (!query || query.length < 2) return [];

  try {
    const session = await getSession();
    if (!session) return [];
    const { activeBranchId, rol } = session.user;
    const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
    const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

    const loans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        ...branchFilter,
        OR: [
          { id: { contains: query, mode: "insensitive" } },
          { operationNumber: { contains: query, mode: "insensitive" } },
          { client: { fullName: { contains: query, mode: "insensitive" } } },
          { client: { documentNumber: { contains: query, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        clientId: true,
        totalAmount: true,
        termCount: true,
        client: { select: { fullName: true, documentNumber: true } },
        installments: {
          where: { isPaid: false },
          select: { id: true, number: true, totalAmount: true, balanceAmount: true, dueDate: true },
          orderBy: { number: "asc" },
          take: 1,
        },
      },
      take: 10,
    });

    const normQuery = normalizeSearch(query);
    return loans.map(l => {
      const nextInst: any = l.installments[0];
      let matchType = "NAME";
      if (normalizeSearch(l.id).includes(normQuery)) matchType = "LOAN";
      else if (normalizeSearch(l.client.documentNumber).includes(normQuery)) matchType = "CLIENT";
      return {
        id: l.id,
        clientId: l.clientId,
        cliente: l.client.fullName,
        documento: l.client.documentNumber,
        matchType,
        amount: l.totalAmount.toString(),
        nextAmount: nextInst ? nextInst.balanceAmount.toString() : "0",
        nextDue: nextInst?.dueDate ?? null,
        nextNum: nextInst?.number ?? null,
        totalCuotas: l.termCount,
        allPending: nextInst ? nextInst.balanceAmount.toString() : "0",
      };
    });
  } catch (error) {
    console.error("Quick search error:", error);
    return [];
  }
}
