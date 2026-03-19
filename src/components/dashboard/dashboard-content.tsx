
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  FileText,
  Printer,
  Table as TableIcon,
  X,
  Calendar,
  ExternalLink,
  Search,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn, formatDate, normalizeSearch } from "@/lib/utils";
import { useSearch } from "@/store/search-context";
import { useCurrency } from "@/store/currency-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDashboardData,
  searchLoansQuick,
  getDashboardStats
} from "@/app/actions/dashboard-actions";
import { PaymentDialog, LoanFinishedDialog } from "@/components/payments/payment-dialog";
import { getLoanPaymentDetails } from "@/app/actions/payment-actions";

interface DashboardContentProps {
  initialData: any;
  initialStats: any;
}

export function DashboardContent({ initialData, initialStats }: DashboardContentProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();
  const { currency, exchangeRate } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'NONE' | 'A4' | 'TICKET'>('NONE');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Estados para Pago
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoanFinishedModalOpen, setIsLoanFinishedModalOpen] = useState(false);
  const [finishedLoanData, setFinishedLoanData] = useState<any>(null);

  const [dbData, setDbData] = useState<any>(initialData);
  const [globalStats, setGlobalStats] = useState<any>(initialStats);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [moraView, setMoraView] = useState<'MAS' | 'MENOS'>('MAS');
  const [todayLoansModalOpen, setTodayLoansModalOpen] = useState(false);
  const [selectedDateLoans, setSelectedDateLoans] = useState<any[]>([]);

  const [headerSearchInput, setHeaderSearchInput] = useState("");
  const [headerResults, setHeaderResults] = useState<any[]>([]);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Refresh data in background to ensure it's fresh if needed, 
    // but the initial data is already provided via props for fast load.
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        // Implement global search trigger if needed
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleHeaderSearchChange = async (val: string) => {
    setHeaderSearchInput(val);
    if (val.length >= 2) {
      const results = await searchLoansQuick(val);
      setHeaderResults(results);
      setIsHeaderDropdownOpen(results.length > 0);
    } else {
      setHeaderResults([]);
      setIsHeaderDropdownOpen(false);
    }
  };

  const navigateToResult = (res: any) => {
    setIsHeaderDropdownOpen(false);
    if (res.matchType === 'LOAN') {
      router.push(`/dashboard/loans?loanId=${res.id}`);
    } else {
      router.push(`/dashboard/clients?clientId=${res.clientId}`);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerResults.length > 0) {
      navigateToResult(headerResults[0]);
    }
  };

  const uiStats = useMemo(() => {
    if (!globalStats) return [];

    return [
      {
        title: "Capital Global",
        value: globalStats.totalGlobalCapital,
        change: `Mes: ${formatCurrency(globalStats.lentThisMonth, 'es-UY', currency)}`,
        trend: "up",
        icon: TrendingUp,
        bg: "bg-emerald-600",
        textColor: "text-white",
        description: "Suma total de capital (Legado + Sistema Nuevo) actualmente en la calle."
      },
      {
        title: "Capital Legado",
        value: globalStats.legacyCapital,
        change: "Histórico Migrado",
        trend: "up",
        icon: ExternalLink,
        bg: "bg-slate-700",
        textColor: "text-white",
        description: "Capital histórico proveniente del sistema anterior."
      },
      {
        title: "Otorgados Hoy",
        value: dbData.stats.todayLoansCount,
        isCurrency: false,
        change: "Ver detalle",
        trend: "up",
        icon: CreditCard,
        bg: "bg-emerald-600",
        textColor: "text-white",
        onClick: () => {
          setSelectedDateLoans(dbData.stats.todayLoansItems);
          setTodayLoansModalOpen(true);
        },
        description: "Préstamos formalizados durante el día de hoy."
      },
      {
        title: "En Mora",
        value: globalStats.overdueCount,
        isCurrency: false,
        change: "CUOTAS VENCIDAS",
        trend: "down",
        icon: AlertCircle,
        bg: "bg-rose-600",
        textColor: "text-white",
        onClick: () => {
          router.push('/dashboard/collections?severity=ALTA');
        },
        description: "Cantidad total de cuotas que han pasado su fecha de vencimiento."
      },
    ];
  }, [dbData, globalStats, currency]);

  const convert = (val: number) => {
    if (currency === 'USD') return val / exchangeRate;
    return val;
  };

  const filteredActivity = useMemo(() => {
    return dbData.recentActivity;
  }, [dbData.recentActivity]);

  const filteredVencimientos = useMemo(() => {
    return dbData.vencimientos;
  }, [dbData.vencimientos]);

  const handleVencimientoClick = async (v: any) => {
    setIsDataLoading(true);
    try {
      const details = await getLoanPaymentDetails(v.loanId);
      if (details) {
        setSelectedLoanForPayment(details);
        setPaymentAmount(details.monto.toString());
        setIsPaymentModalOpen(true);
      } else {
        alert("No se encontraron cuotas pendientes para este préstamo.");
      }
    } catch (error) {
      console.error("Error loading payment details:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleMoraClick = async (m: any) => {
    setIsDataLoading(true);
    try {
      const details = await getLoanPaymentDetails(m.loanId);
      if (details) {
        setSelectedLoanForPayment(details);
        setPaymentAmount(details.monto.toString());
        setIsPaymentModalOpen(true);
      } else {
        alert("No se encontraron cuotas pendientes para este préstamo.");
      }
    } catch (error) {
      console.error("Error loading payment details:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de cobros Cre-ser</h1>
          <p className="text-sm text-muted-foreground leading-none">Gestión de <span className="text-emerald-600 font-bold">Creser Finance</span></p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl relative">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              placeholder="Cédula, nombre o préstamo..."
              className="w-full pl-10 h-11 bg-slate-900 border border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder:text-muted-foreground shadow-xl rounded-2xl transition-all outline-none text-sm font-medium"
              value={headerSearchInput}
              onChange={(e) => handleHeaderSearchChange(e.target.value)}
              onKeyDown={handleHeaderKeyDown}
              onFocus={() => headerResults.length > 0 && setIsHeaderDropdownOpen(true)}
            />

            {isHeaderDropdownOpen && (
              <div className="absolute top-14 left-0 w-full bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                  {headerResults.map((res: any) => (
                    <div
                      key={res.id}
                      className="p-3 rounded-xl hover:bg-emerald-950/20 dark:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer flex items-center justify-between group"
                      onClick={() => navigateToResult(res)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-black text-xs">
                          {res.cliente.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs group-hover:text-emerald-400 transition-colors">{res.cliente}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{res.matchType === 'LOAN' ? `L-${res.id.substring(0, 8)}` : res.documento}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500 bg-emerald-950/20 dark:bg-emerald-950/30">
                        {res.matchType === 'LOAN' ? 'PRÉSTAMO' : 'CLIENTE'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-emerald-950/20 dark:bg-emerald-950/30 border-t border-emerald-500/10 text-center">
                  <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Presione Enter para el primer resultado</p>
                </div>
              </div>
            )}

            {isHeaderDropdownOpen && (
              <div className="fixed inset-0 z-[90]" onClick={() => setIsHeaderDropdownOpen(false)} />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-11 gap-2 border-border text-slate-700 bg-background hover:bg-slate-50 font-bold rounded-2xl" onClick={() => setReportModalOpen(true)}>
              <Download className="w-4 h-4" /> Reporte
            </Button>
            <Link href="/dashboard/loans/new">
              <Button size="sm" className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-6">
                <Plus className="w-4 h-4" /> Préstamo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {isDataLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))
        ) : uiStats.map((stat: any, i: number) => (
          <Card
            key={i}
            className={cn(
              "border-none shadow-xl transition-all duration-300 group overflow-hidden relative shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
              stat.active ? stat.bg : "bg-card border border-muted/20"
            )}
            onClick={stat.onClick}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-125 bg-background/20 rounded-full blur-2xl`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/80">{stat.title}</CardTitle>
              <div className="p-2 rounded-lg bg-background/20 backdrop-blur-md">
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <div className="text-3xl font-black tracking-tighter">
                {stat.isCurrency === false ? stat.value : formatCurrency(convert(stat.value), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$')}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                    {stat.change}
                  </Badge>
                  {stat.subtitle && <span className="text-[10px] text-white/60 font-black uppercase tracking-tighter">{stat.subtitle}</span>}
                </div>
                <div className="group/tooltip relative">
                  <HelpCircle className="w-4 h-4 text-white/40 hover:text-white cursor-help transition-colors" />
                  <div className="absolute bottom-6 right-0 w-48 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl scale-0 group-hover/tooltip:scale-100 transition-all origin-bottom-right z-[100]">
                    <p className="text-[9px] text-white font-medium leading-relaxed italic">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="border-emerald-700/40/30 flex flex-col shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-950/20 dark:bg-emerald-950/30 rounded-full" />
                Próximos Vencimientos
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Top 10 cuotas inmediatas</p>
            </div>
            <Calendar className="text-emerald-500 w-5 h-5 opacity-50" />
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="space-y-3 h-[500px] overflow-y-auto pr-2 scrollbar-thin scroll-smooth">
              {filteredVencimientos.map((v: any) => (
                <div
                  key={v.id}
                  onClick={() => handleVencimientoClick(v)}
                  className="flex items-center justify-between p-4 rounded-xl border-none bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-left-2 shadow-lg shadow-emerald-500/10 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-background/5 rounded-full -mr-8 -mt-8" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-background/20 backdrop-blur-md flex items-center justify-center text-white font-black">
                      {v.cliente.charAt(0)}
                    </div>
                    <div>
                      <p className="text-zinc-100 font-black text-base leading-tight drop-shadow-sm">{v.cliente}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-emerald-100 opacity-90">CUOTA {v.installmentNumber}/{v.totalInstallments}</p>
                        <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
                        <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-tighter">ID: {v.loanId.substring(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-sm font-black text-white">{formatCurrency(convert(v.amount), 'es-UY', currency)}</p>
                    <Badge className={cn(
                      "text-[9px] font-black border-none h-4 px-1.5 shadow-sm mt-1",
                      v.dias <= 2 ? "bg-rose-900 text-white" : "bg-background/20 text-white backdrop-blur-md"
                    )}>
                      {v.dias === 0 ? "VENCE HOY" : `VENCE EN ${v.dias} DÍAS`}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredVencimientos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 italic text-sm">
                  <CheckCircle2 className="w-12 h-12 mb-2" />
                  Sin vencimientos pendientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col shadow-lg border-rose-100 dark:border-rose-900/30">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                <div className="w-2 h-6 bg-rose-900/20 dark:bg-rose-900/30 rounded-full" />
                Clientes en Mora
              </CardTitle>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setMoraView('MAS')}
                  className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-colors", moraView === 'MAS' ? "bg-rose-600 text-white border-rose-600" : "bg-background text-rose-600 border-rose-200")}
                >
                  Más Mora
                </button>
                <button
                  onClick={() => setMoraView('MENOS')}
                  className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-colors", moraView === 'MENOS' ? "bg-rose-600 text-white border-rose-600" : "bg-background text-rose-600 border-rose-200")}
                >
                  Menos Mora
                </button>
              </div>
            </div>
            <AlertCircle className="text-rose-500 w-5 h-5 opacity-50" />
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="space-y-3 h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              {(moraView === 'MAS' ? dbData.mora.masMora : dbData.mora.menosMora).map((m: any) => (
                <div
                  key={m.loanId}
                  className="group p-3 rounded-xl border border-dashed hover:border-rose-400 hover:bg-rose-900/20 dark:bg-rose-900/30 transition-all cursor-pointer"
                  onClick={() => handleMoraClick(m)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black">{m.cliente}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">ID: {m.loanId.substring(0, 8)}</p>
                    </div>
                    <Badge variant="destructive" className="font-black text-[10px] h-5">
                      {m.maxDias} DÍAS
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-[10px] font-bold text-muted-foreground">DEUDA TOTAL</span>
                    <span className="text-sm font-black text-rose-600">{formatCurrency(convert(m.amount), 'es-UY', currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="flex flex-col col-span-2 shadow-sm">
          <CardHeader className="border-b bg-muted/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Monitor de Actividad</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filteredActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border",
                    activity.type === "payment" ? "bg-emerald-950/20 dark:bg-emerald-950/30 text-emerald-600 border-emerald-700/30" :
                      "bg-blue-900/20 dark:bg-blue-900/30 text-blue-600 border-blue-100"
                  )}>
                    {activity.type === "payment" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{activity.user}</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      {activity.type === "payment" ? "Recepción de Pago" : "Otorgamiento Crédito"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-black", activity.type === "payment" ? "text-emerald-600" : "text-blue-600")}>
                      {activity.type === "payment" ? "+" : "-"}{formatCurrency(convert(activity.amount), 'es-UY', currency)}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Creser Finance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-4xl font-black">{formatCurrency(convert(dbData.stats.activeCapital), 'es-UY', currency)}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Capital Activo en Calle</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-medium">TOTAL CLIENTES</span>
                <span className="font-black">{dbData.stats.clientsCount}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground font-medium">MOROSIDAD</span>
                <span className="font-black text-rose-500">{(dbData.stats.moraCount / Math.max(1, dbData.stats.clientsCount) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={reportModalOpen} onOpenChange={(open: boolean) => {
        setReportModalOpen(open);
        if (!open) setPreviewType('NONE');
      }}>
        <DialogContent className={cn("transition-all duration-500 w-[95vw] sm:w-full", previewType !== 'NONE' ? "max-w-4xl" : "max-w-md")}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{previewType === 'NONE' ? "Generar Reportes" : "Vista Previa del Reporte"}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => {
                if (previewType !== 'NONE') setPreviewType('NONE');
                else setReportModalOpen(false);
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {previewType === 'NONE' ? (
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex-col gap-2 border-primary/20 hover:bg-primary/5"
                onClick={() => setPreviewType('A4')}
              >
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <span className="text-xs sm:text-sm">Reporte Diario (A4)</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex-col gap-2 border-emerald-600/40 hover:bg-emerald-950/20 dark:bg-emerald-950/30"
                onClick={() => setPreviewType('A4')}
              >
                <TableIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                <span className="text-xs sm:text-sm">Estado Cartera (A4)</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex-col gap-2 border-rose-200 hover:bg-rose-900/20 dark:bg-rose-900/30 sm:col-span-2"
                onClick={() => setPreviewType('TICKET')}
              >
                <Printer className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600" />
                <span className="text-xs sm:text-sm">Cierre de Caja (Ticket 80mm)</span>
              </Button>
            </div>
          ) : (
            <div className="p-2 sm:p-6 bg-muted/30 flex justify-center overflow-x-auto max-h-[60vh]">
              {/* Report Previews ... */}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              if (previewType !== 'NONE') setPreviewType('NONE');
              else setReportModalOpen(false);
            }}>
              {previewType === 'NONE' ? "Cancelar" : "Volver"}
            </Button>
            {previewType !== 'NONE' && (
              <Button className="bg-emerald-600 gap-2" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Imprimir Ahora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        installment={selectedLoanForPayment}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setIsLoanFinishedModalOpen={setIsLoanFinishedModalOpen}
        setFinishedLoanData={setFinishedLoanData}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          router.refresh();
        }}
      />

      <LoanFinishedDialog
        isOpen={isLoanFinishedModalOpen}
        onOpenChange={(open: boolean) => {
          setIsLoanFinishedModalOpen(open);
          if (!open) {
            setIsPaymentModalOpen(false);
            router.refresh();
          }
        }}
        data={finishedLoanData}
      />

      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selectedActivity?.type === 'payment' && <ArrowDownLeft className="text-emerald-500" />}
                {selectedActivity?.type === 'loan' && <ArrowUpRight className="text-blue-500" />}
                Detalle de Actividad
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setActivityModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6">
            {/* Activity Details ... */}
             <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                selectedActivity?.type === 'payment' ? "bg-emerald-950/20 dark:bg-emerald-950/30" : "bg-blue-900/20 dark:bg-blue-900/30"
              )}>
                {selectedActivity?.user?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold">{selectedActivity?.user}</h4>
                <p className="text-xs text-muted-foreground">{selectedActivity?.date}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={todayLoansModalOpen} onOpenChange={setTodayLoansModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Préstamos de Hoy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDateLoans.map((loan: any) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-bold">{loan.cliente}</p>
                  <p className="text-xs text-muted-foreground">ID: {loan.id.substring(0, 8)} | {loan.cuotas} cuotas</p>
                </div>
                <p className="font-black text-emerald-600">{formatCurrency(loan.monto)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
