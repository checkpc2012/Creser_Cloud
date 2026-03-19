"use client";

import { useState, useMemo, Suspense } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Calculator,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, cn, normalizeSearch, roundAmount } from "@/lib/utils";
import { useSearch } from "@/store/search-context";
import { useCurrency } from "@/store/currency-context";
import { useSearchParams, useRouter } from "next/navigation";
import { Printer, CreditCard, User, Clock as ClockIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { getLoans, getLoanStats } from "@/app/actions/loan-actions";
import { processPayment } from "@/app/actions/payment-actions";
import { LoanDetailDrawer } from "@/components/loans/loan-detail-drawer";

function LoansContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("clientId");
  const { searchQuery } = useSearch();
  const { currency, exchangeRate } = useCurrency();
  const [localSearch, setLocalSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estado para estadísticas
  const [summary, setSummary] = useState<any>(null);

  // Estados para Cobro de Cuota
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<any>(null);

  const loanId = searchParams.get("loanId");

  // EFECTO PARA CARGAR DATOS (PAGINADOS)
  const loadData = async (pageNum = 1, search = "") => {
    setIsLoading(true);
    try {
      // Cargar préstamos y estadísticas en paralelo (las estadísticas se cachean en el servidor)
      const [result, statsResult] = await Promise.all([
        getLoans(pageNum, { clientId: clientId || undefined, loanId: loanId || undefined, search: search || undefined }),
        getLoanStats()
      ]);

      setSummary(statsResult);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);

      const mapped = result.loans.map((l: any) => {
        const paidCount = l.installments?.filter((i: any) => i.isPaid).length || 0;
        const totalCount = l.termCount;
        const progreso = Math.round((paidCount / totalCount) * 100) || 0;

        const nextInstallment = l.installments
          ?.filter((i: any) => !i.isPaid)
          .sort((a: any, b: any) => a.number - b.number)[0];

        return {
          ...l,
          monto: Number(l.principalAmount),
          cliente: l.client?.fullName || 'Desconocido',
          progreso,
          cuotas: `${paidCount}/${totalCount}`,
          estado: l.status,
          fechaAprobacion: l.createdAt,
          status: l.status,
          nextInstallment: nextInstallment ? {
            id: nextInstallment.id,
            monto: Number(nextInstallment.balanceAmount),
            cuotaNumero: nextInstallment.number,
            totalCuotas: l.termCount,
            capital: Number(l.principalAmount),
            interestRate: Number(l.interestAmount),
            currency: 'UYU',
            cliente: l.client?.fullName
          } : null
        };
      });
      setLoans(mapped);
    } catch (error) {
      console.error("Error loading loans data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const query = (localSearch || searchQuery).trim();

    // Minimum 2 chars to initiate a search; if empty, load all
    if (query !== "" && query.length < 2) return;

    const timer = setTimeout(() => {
      loadData(1, query);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, clientId, loanId]);


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadData(newPage, localSearch || searchQuery);
    }
  };

  // EFECTO PARA AUTO-ABRIR DETALLE SI VIENE POR URL
  useEffect(() => {
    if (loanId && !isLoading && loans.length > 0) {
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        setSelectedLoan(loan);
        setIsDetailOpen(true);
      }
    }
  }, [loanId, isLoading, loans]);

  const convert = (val: number) => {
    if (currency === 'USD') return val / exchangeRate;
    return val;
  };

  const filteredLoans = useMemo(() => {
    return loans; // Filtrado del lado del servidor via loadData
  }, [loans]);

  const filteredClientName = useMemo(() => {
    if (!clientId) return null;
    return filteredLoans[0]?.cliente || "Cliente";
  }, [clientId, filteredLoans]);

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total Prestado", value: summary.totalPrestado, isCurrency: true, icon: TrendingUp, color: "text-white", bg: "bg-emerald-600" },
      { label: "Total Cobrado", value: summary.totalCobrado, isCurrency: true, icon: CheckCircle2, color: "text-white", bg: "bg-emerald-600" },
      { label: "Por Cobrar", value: summary.porCobrar, isCurrency: true, icon: Clock, color: "text-white", bg: "bg-emerald-600" },
      { label: "En Mora", value: summary.totalACobrar - summary.totalCobrado, isCurrency: true, icon: AlertTriangle, color: "text-white", bg: "bg-emerald-600" },
    ];
  }, [summary]);

  const handleExport = () => {
    if (filteredLoans.length === 0) return;

    // Encabezados con comillas para mayor seguridad en Excel
    const headers = ["ID", "Cliente", "Monto", "Cuotas", "Progreso (%)", "Estado", "Fecha Aprobacion"];

    // Crear filas asegurando escapar comas
    const rows = filteredLoans.map(loan => [
      `"${loan.id}"`,
      `"${loan.cliente}"`,
      `"${loan.monto}"`,
      `"${loan.cuotas}"`,
      `"${loan.progreso}"`,
      `"${loan.status}"`,
      `"${formatDate(loan.fechaAprobacion)}"`
    ]);

    // Convertir a CSV
    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Creser_Prestamos_${clientId ? 'Cliente_' + clientId : 'General'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {clientId ? `Historial: ${filteredClientName}` : "Préstamos Activos"}
          </h1>
          <p className="text-sm text-muted-foreground leading-none">
            {clientId 
              ? `Visualizando el historial crediticio completo del cliente.` 
              : `Gestión y control de ${totalItems} créditos en cartera.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {clientId && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 gap-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 font-black uppercase text-xs rounded-2xl px-6 transition-all"
              onClick={() => router.push(`/dashboard/clients?clientId=${clientId}`)}
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Volver a la Ficha del Cliente
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-11 gap-2 border-border text-slate-700 bg-background hover:bg-slate-50 font-bold rounded-2xl px-6 transition-all" onClick={handleExport}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Link href="/dashboard/loans/new" className="flex-1 sm:flex-initial">
            <Button size="sm" className="h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-8 border-none ring-offset-background transition-all">
              <Plus className="w-4 h-4" /> Crear Préstamo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border-none shadow-xl transition-all duration-300 group overflow-hidden relative shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
              stat.bg
            )}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-125 bg-background/20 rounded-full blur-2xl`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/80">{stat.label}</CardTitle>
              <div className="p-2 rounded-lg bg-background/20 backdrop-blur-md">
                <stat.icon className={`w-4 h-4 text-white`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <div className="text-3xl font-black tracking-tighter">
                {stat.isCurrency ? formatCurrency(convert(stat.value as number), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$') : stat.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                  ACTUALIZADO
                </Badge>
                {/* TOOLTIP INFO */}
                <div className="group/tooltip relative">
                  <AlertCircle className="w-4 h-4 text-white/40 hover:text-white cursor-help transition-colors" />
                  <div className="absolute bottom-6 right-0 w-48 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl scale-0 group-hover/tooltip:scale-100 transition-all origin-bottom-right z-[100]">
                    <p className="text-[9px] text-white font-medium leading-relaxed italic">
                      Cálculo automático basado en los registros contables del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-700/40/30 overflow-hidden shadow-xl shadow-slate-200/40">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              <div className="w-2 h-6 bg-emerald-950/20 dark:bg-emerald-950/300 rounded-full" />
              Historial y Estados
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Registro completo de movimientos financieros</p>
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400" />
              <input
                placeholder="Buscar préstamo o cliente..."
                className="w-full sm:w-64 pl-10 pr-4 h-10 bg-slate-900 border border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder:text-muted-foreground shadow-xl rounded-xl transition-all outline-none text-xs font-medium"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-10 gap-2 border-border text-slate-700 bg-background hover:bg-slate-50 font-bold rounded-xl hidden sm:flex">
              <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 bg-muted/5 flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-950/20 dark:bg-emerald-950/30 text-emerald-700 border-none shadow-sm font-black rounded-lg py-1 px-3">
              PÁGINA {page} DE {totalPages} ({totalItems} TOTAL)
            </Badge>
            {loanId && (
              <Badge
                className="gap-2 px-3 py-1 bg-amber-900/20 dark:bg-amber-900/30 text-amber-700 border-none shadow-md font-black rounded-lg cursor-pointer hover:bg-amber-900/30 transition-all uppercase text-[10px]"
                onClick={() => router.push('/dashboard/loans')}
              >
                FILTRO PRÉSTAMO ACTIVO: ID {loanId.substring(0, 8)}... <X className="w-3 h-3" />
              </Badge>
            )}
            {clientId && (
              <Badge
                className="gap-2 px-3 py-1 bg-blue-900/20 dark:bg-blue-900/30 text-blue-700 border-none shadow-md font-black rounded-lg cursor-pointer hover:bg-blue-900/30 transition-all uppercase text-[10px]"
                onClick={() => router.push('/dashboard/loans')}
              >
                FILTRO CLIENTE: {filteredClientName} <X className="w-3 h-3" />
              </Badge>
            )}
          </div>


          <div className="max-h-[600px] overflow-auto scrollbar-thin">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>ID / Cliente</TableHead>
                    <TableHead>Monto Principal</TableHead>
                    <TableHead>Progreso de Pago</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Aprobación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 font-bold text-muted-foreground animate-pulse">
                        Cargando préstamos...
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 font-bold text-muted-foreground">
                        No hay préstamos para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.map((loan) => (
                    <TableRow
                      key={loan.id}
                      className="group hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => {
                        if (loan.nextInstallment) {
                          setActiveInstallment(loan.nextInstallment);
                          setPaymentAmount(loan.nextInstallment.monto.toString());
                          setIsPaymentModalOpen(true);
                        } else {
                          setSelectedLoan(loan);
                          setIsDetailOpen(true);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-black">{loan.id.substring(0, 8)}</span>
                          {loan.isLegacy && (
                            <Badge variant="outline" className="w-fit text-[9px] h-4 px-1 bg-slate-100 text-slate-600 border-slate-300 font-black mt-0.5">
                              LEGACY: {loan.operationNumber}
                            </Badge>
                          )}
                          <span className="font-bold group-hover:text-primary transition-colors">{loan.cliente}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm">
                        {formatCurrency(convert(loan.monto), 'es-UY', currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span>{loan.progreso}%</span>
                            <span className="text-muted-foreground">COBRADO</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000",
                                loan.progreso > 80 ? "bg-emerald-950/20 dark:bg-emerald-950/300" :
                                  loan.progreso > 40 ? "bg-blue-900/20 dark:bg-blue-900/300" : "bg-amber-900/20 dark:bg-amber-900/300"
                              )}
                              style={{ width: `${loan.progreso}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">{loan.cuotas} Meses</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">
                        {formatDate(loan.fechaAprobacion)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] uppercase font-black px-2 py-0.5",
                          loan.status === 'ACTIVE' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : 
                          loan.status === 'CLOSED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                          "bg-amber-100 text-amber-700 hover:bg-amber-100"
                        )}>
                          {loan.status === 'ACTIVE' ? 'Activo' : 
                           loan.status === 'CLOSED' ? 'Finalizado' : loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground font-bold uppercase">
              MOSTRANDO {loans.length} DE {totalItems} RESULTADOS
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="h-8 px-4 font-black text-[10px] uppercase"
              >
                Anterior
              </Button>
              <div className="flex items-center px-3 bg-muted rounded-lg text-[10px] font-black">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 px-4 font-black text-[10px] uppercase"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DETALLE DE PRÉSTAMO */}
      <LoanDetailDrawer
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        loanId={selectedLoan?.id}
        initialData={selectedLoan}
      />

      <PaymentDialog
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        installment={activeInstallment}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

// Sub-componente para el modal de pago
function PaymentDialog({
  isOpen,
  onOpenChange,
  installment,
  paymentAmount,
  setPaymentAmount,
  isProcessing,
  setIsProcessing,
  onSuccess
}: any) {
  const { currency, exchangeRate } = useCurrency();
  if (!installment) return null;

  const handlePayment = async (exactAmount?: number) => {
    const amount = exactAmount || parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor ingrese un monto válido.");
      return;
    }

    setIsProcessing(true);
    let amountToProcess = 0;

    if (exactAmount !== undefined) {
      amountToProcess = roundAmount(exactAmount);
    } else {
      let amt = parseFloat(paymentAmount);
      if (currency === 'USD') {
        amt = amt * exchangeRate;
      }
      amountToProcess = roundAmount(amt);
    }

    const res = await processPayment({
      installmentId: installment.id,
      amount: amountToProcess,
      method: "CASH",
      notes: amountToProcess > (installment.monto || 0) ? "Pago en exceso - Recálculo de deuda aplicado" : ""
    });

    if (res.success) {
      onSuccess();
    } else {
      alert(res.error);
    }
    setIsProcessing(false);
  };

  const remainingInstallments = installment.totalCuotas - installment.cuotaNumero;

  const displayConvert = (val: number) => {
    if (currency === 'USD') return val / exchangeRate;
    return val;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-t-4 border-t-emerald-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Gestión de Entrega
          </DialogTitle>
          <DialogDescription>
            Registra el pago para <span className="font-bold text-foreground">{installment.cliente}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="p-2 bg-muted/30 rounded-lg border flex flex-col justify-center">
              <p className="font-bold text-muted-foreground uppercase opacity-70">Capital Inicial</p>
              <p className="text-sm font-black">{formatCurrency(displayConvert(installment.capital), 'es-UY', currency)}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg border flex flex-col justify-center text-center">
              <p className="font-bold text-muted-foreground uppercase opacity-70">Cuotas Restantes</p>
              <p className="text-sm font-black">{remainingInstallments} meses</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-600/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Calculator className="w-12 h-12" />
            </div>
            <div className="flex justify-between items-center mb-1 relative z-10">
              <span className="text-[10px] font-black text-emerald-400 uppercase">Monto de esta Cuota ({installment.cuotaNumero})</span>
              <Badge className="bg-emerald-600 text-[9px]">{installment.id.substring(0, 8)}</Badge>
            </div>
            <p className="text-3xl font-black text-emerald-400 relative z-10">
              {formatCurrency(displayConvert(installment.monto), 'es-UY', currency)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] bg-emerald-900/50 border-emerald-500 font-bold text-emerald-300 hover:bg-emerald-800/60"
                onClick={() => handlePayment(installment.monto)}
                disabled={isProcessing}
              >
                PAGAR SOLO ESTA CUOTA
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/40 border border-dashed rounded-xl">
            <label className="text-[10px] font-black uppercase text-muted-foreground flex justify-between">
              <span>Entrega Personalizada</span>
              <span className="text-emerald-600 italic">Recalcula deuda futura</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                {currency === 'UYU' ? '$' : 'US$'}
              </span>
              <Input
                type="number"
                className="pl-12 text-xl font-black h-14 border-2 focus:border-emerald-500 bg-background shadow-inner"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            {parseFloat(paymentAmount) > installment.monto && (
              <p className="text-[10px] text-blue-600 font-bold animate-pulse">
                🔔 ¡Atención! Se restarán {formatCurrency(parseFloat(paymentAmount) - displayConvert(installment.monto), 'es-UY', currency)} del total del préstamo y se achicarán las {remainingInstallments} cuotas restantes.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" className="font-bold text-xs" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={isProcessing || !paymentAmount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 flex-1 shadow-lg shadow-emerald-500/20"
            onClick={() => handlePayment()}
          >
            {isProcessing ? "Procesando..." : "REGISTRAR ENTREGA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <LoansContent />
    </Suspense>
  );
}
