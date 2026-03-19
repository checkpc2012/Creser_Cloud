"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getSession } from "@/lib/auth";
import { roundAmount } from "@/lib/utils";
import { ManagerReportDTO } from "@/types/dtos";

export const getManagerReportData = async (): Promise<ManagerReportDTO | null> => {
  const session = await getSession();
  if (!session) return null;

  const { activeBranchId, rol } = session.user;
  const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
  const branchFilter = isGlobal ? {} : { branchId: activeBranchId };

  return getManagerReportDataCached(activeBranchId, rol);
};

const getManagerReportDataCached = unstable_cache(
  async (branchId: string | null, rol: string) => {
    try {
      const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(rol);
      const branchFilter = isGlobal ? {} : { branchId: branchId };
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Core Metrics
      const [
        clientsCount,
        activeCapitalAgg,
        legacyCapitalAgg,
        lentThisMonthAgg,
        overdueInstallments,
        loansWithType
      ] = await Promise.all([
        prisma.client.count({ where: branchFilter }),
        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: false, ...branchFilter } as any,
          _sum: { totalAmount: true },
          _count: true
        }),
        prisma.loan.aggregate({
          where: { status: "ACTIVE", isLegacy: true, ...branchFilter } as any,
          _sum: { totalAmount: true },
        }),
        prisma.loan.aggregate({
          where: { createdAt: { gte: startOfMonth }, ...branchFilter },
          _sum: { totalAmount: true },
        }),
        prisma.installment.findMany({
          where: {
            isPaid: false,
            dueDate: { lt: startOfToday },
            loan: branchFilter
          },
          select: {
            balanceAmount: true,
            dueDate: true,
            loanId: true,
            loan: { select: { client: { select: { id: true, fullName: true } } } }
          }
        }),
        // Distribution (Simplified: All 'Loan' for now unless we check productType which is derived)
        // We'll use a count of loans to estimate
        prisma.loan.count({ where: { status: "ACTIVE", ...branchFilter } })
      ]);

      const activeCapital = Number(activeCapitalAgg._sum.totalAmount ?? 0);
      const legacyCapital = Number(legacyCapitalAgg._sum.totalAmount ?? 0);
      const totalGlobalCapital = activeCapital + legacyCapital;
      const lentThisMonth = Number(lentThisMonthAgg._sum.totalAmount ?? 0);
      const activeLoansCount = activeCapitalAgg._count ?? 0;
      const avgLoanAmount = activeLoansCount > 0 ? activeCapital / activeLoansCount : 0;

      // 2. Overdue Segments and Debtors
      let overdueTotalAmount = 0;
      const segments = { s1_30: 0, s31_60: 0, s61_plus: 0 };
      const debtorMap = new Map<string, { name: string; amount: number; maxDays: number }>();

      overdueInstallments.forEach(inst => {
        const amount = Number(inst.balanceAmount);
        overdueTotalAmount += amount;
        
        const diffMs = now.getTime() - new Date(inst.dueDate).getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) segments.s1_30++;
        else if (diffDays <= 60) segments.s31_60++;
        else segments.s61_plus++;

        const client = inst.loan.client;
        const existing = debtorMap.get(client.id);
        if (existing) {
          existing.amount += amount;
          if (diffDays > existing.maxDays) existing.maxDays = diffDays;
        } else {
          debtorMap.set(client.id, { name: client.fullName, amount, maxDays: diffDays });
        }
      });

      const topDebtors = Array.from(debtorMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          amount: data.amount.toString(),
          days: data.maxDays
        }))
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 10);

      // 3. Top Payers (Clients with payments in last 90 days and no current arrears)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const recentPayments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: ninetyDaysAgo },
          loan: branchFilter
        },
        include: {
          loan: { select: { client: { select: { id: true, fullName: true } } } }
        },
        take: 500
      });

      const payerMap = new Map<string, { name: string; count: number; total: number }>();
      recentPayments.forEach(p => {
        const client = p.loan.client;
        const existing = payerMap.get(client.id);
        if (existing) {
          existing.count++;
          existing.total += Number(p.totalAmount);
        } else {
          payerMap.set(client.id, { name: client.fullName, count: 1, total: Number(p.totalAmount) });
        }
      });

      const topPayers = Array.from(payerMap.entries())
        .filter(([id]) => !debtorMap.has(id)) // Only those who are NOT currently in arrears
        .map(([id, data]) => ({
          id,
          name: data.name,
          score: Math.min(100, data.count * 10 + (data.total > 50000 ? 20 : 10)), // Simple scoring
          totalPaid: data.total.toString()
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        stats: {
          clientsCount,
          activeCapital: activeCapital.toString(),
          legacyCapital: legacyCapital.toString(),
          totalGlobalCapital: totalGlobalCapital.toString(),
          lentThisMonth: lentThisMonth.toString(),
          overdueTotalAmount: overdueTotalAmount.toString(),
          overdueCount: overdueInstallments.length,
          avgLoanAmount: avgLoanAmount.toString()
        },
        portfolioDistribution: {
          loans: { amount: activeCapital.toString(), count: activeLoansCount },
          cards: { amount: "0", count: 0 } // Placeholder for card logic
        },
        arrearsSegments: segments,
        topDebtors,
        topPayers
      };
    } catch (error) {
      console.error("Error in Manager Report Data:", error);
      return null;
    }
  },
  ["manager-report-data"],
  { revalidate: 300, tags: ["dashboard", "loans", "payments"] }
);
