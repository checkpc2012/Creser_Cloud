import { getDashboardData, getDashboardStats } from "@/app/actions/dashboard-actions";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { redirect } from "next/navigation";

const EMPTY_DATA = {
  stats: {
    clientsCount: 0,
    lentThisMonth: "0",
    lentLastMonth: "0",
    monthlyGrowth: 0,
    todayLoansCount: 0,
    todayLoansItems: [],
    activeCapital: "0",
    legacyCapital: "0",
    totalGlobalCapital: "0",
    moraCount: 0,
  },
  urgency: { highRiskMora: [], criticalApprovals: [] },
  recentActivity: [],
  vencimientos: [],
  mora: { masMora: [], menosMora: [] },
};

const EMPTY_STATS = {
  clientsCount: 0,
  activeCapital: "0",
  legacyCapital: "0",
  totalGlobalCapital: "0",
  lentThisMonth: "0",
  overdueCount: 0,
  pendingApprovals: 0,
  rateStatus: "OK",
  lastUpdate: null,
};

export default async function DashboardPage() {
  let data: any;
  let stats: any;

  try {
    [data, stats] = await Promise.all([
      getDashboardData(),
      getDashboardStats(),
    ]);
  } catch (e) {
    console.error("Dashboard page render error:", e);
    data = null;
    stats = null;
  }

  // If session is invalid, middleware will redirect; but if it slips through, redirect here too
  if (!data || !stats) {
    redirect("/login");
  }

  // Defensive merge: ensure required shapes are present even if cache returns partial data
  const safeData = {
    ...EMPTY_DATA,
    ...data,
    stats: { ...EMPTY_DATA.stats, ...(data?.stats ?? {}) },
    urgency: { ...EMPTY_DATA.urgency, ...(data?.urgency ?? {}) },
    mora: { ...EMPTY_DATA.mora, ...(data?.mora ?? {}) },
    recentActivity: data?.recentActivity ?? [],
    vencimientos: data?.vencimientos ?? [],
  };

  const safeStats = { ...EMPTY_STATS, ...stats };

  return (
    <DashboardContent
      initialData={safeData}
      initialStats={safeStats}
    />
  );
}
