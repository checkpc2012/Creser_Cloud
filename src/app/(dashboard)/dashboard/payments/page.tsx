"use client";

import { useState, useMemo, Suspense } from "react";
import { 
  Search, 
  Download, 
  Printer, 
  ArrowDownLeft,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  User,
  CreditCard,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatDate, cn, normalizeSearch } from "@/lib/utils";
import { useSearch } from "@/store/search-context";
import { useCurrency } from "@/store/currency-context";
import { useAuth } from "@/store/auth-context";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { getPayments, getPaymentStats } from "@/app/actions/payment-actions";
import { ReceiptPrinter } from "@/components/shared/receipt-printer";

function PaymentsContent() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("clientId");
  const { searchQuery } = useSearch();
  const { currency, exchangeRate } = useCurrency();
  const [localSearch, setLocalSearch] = useState("");
  
  // Estados para Filtro de Periodo
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estadísticas
  const [statsData, setStatsData] = useState<any>(null);

  const loadData = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        getPayments(pageNum, clientId || undefined),
        getPaymentStats()
      ]);

      const mapped = res.payments.map((pay: any) => ({
        id: pay.id,
        clientId: pay.installment?.loan?.clientId,
        user: pay.installment?.loan?.client?.nombreCompleto || 'Desconocido',
        documento: pay.installment?.loan?.client?.documento,
        amount: pay.amount,
        date: new Date(pay.paymentDate).toISOString(),
        agentName: pay.agentName || 'Sistema',
        label: pay.label || "Pago de crédito",
        is_legacy: pay.is_legacy
      }));

      setAllPayments(mapped);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
      setStatsData(statsRes);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [clientId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadData(newPage);
    }
  };

  // Estados para Modal de Recibo
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [printerType, setPrinterType] = useState<"THERMAL" | "STANDARD">("THERMAL");

  const convert = (val: number) => {
    if (currency === 'USD') return val / exchangeRate;
    return val;
  };

  const filteredPayments = useMemo(() => {
    let payments = allPayments;

    const raw = (localSearch || searchQuery).trim();
    if (!raw) return payments;

    const query = normalizeSearch(raw);

    return payments.filter(p => {
      const nameMatch = normalizeSearch(p.user).includes(query);
      const idMatch = normalizeSearch(p.id.toString()).includes(query);
      const docMatch = p.documento ? normalizeSearch(p.documento).includes(query) : false;
      return nameMatch || idMatch || docMatch;
    });
  }, [searchQuery, localSearch, allPayments]);

  const filteredClientName = useMemo(() => {
    if (!clientId) return null;
    return filteredPayments[0]?.user || "Cliente";
  }, [clientId, filteredPayments]);

  const handleExport = () => {
    if (filteredPayments.length === 0) return;
    const headers = ["ID Recibo", "Cliente", "Fecha", "Monto", "Agente", "Estado"];
    const rows = filteredPayments.map(p => [
      `"#REC-${p.id.toString().padStart(5, '0')}"`,
      `"${p.user}"`,
      `"${formatDate(p.date)}"`,
      `"${p.amount}"`,
      `"${p.agentName}"`,
      `"PROCESADO"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Creser_Pagos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = useMemo(() => {
    if (!statsData) return [];
    
    return [
      { label: "Recaudación Total", value: statsData.totalRecaudado, isCurrency: true, icon: CreditCard, bg: "bg-emerald-600", description: "Monto total procesado ingresado al sistema." },
      { label: "Pagos Procesados", value: statsData.totalProcesados, icon: CheckCircle2, bg: "bg-emerald-600", description: "Cantidad total de transacciones validadas." },
      { label: "Cobros de Hoy", value: statsData.pagosHoy, icon: Calendar, bg: "bg-emerald-600", description: "Recibos emitidos en la jornada actual." },
      { label: "Eficiencia Caja", value: statsData.eficiencia, icon: TrendingUp, bg: "bg-emerald-600", description: "Relación de cobros efectivos vs promesas." },
    ];
  }, [statsData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Historial de Cobros</h1>
          <p className="text-sm text-muted-foreground leading-none">Registro de <span className="text-emerald-600 font-bold">{totalItems}</span> recibos oficiales procesados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" size="sm" className="h-11 gap-2 border-border text-slate-700 bg-background hover:bg-slate-50 font-bold rounded-2xl px-6 transition-all" onClick={handleExport}>
              <Download className="w-4 h-4" /> Exportar CSV
           </Button>
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
              <div className="text-2xl font-black tracking-tighter truncate">
                {stat.isCurrency ? formatCurrency(convert(stat.value as number), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$') : stat.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                  ACTUALIZADO
                </Badge>
                <div className="group/tooltip relative">
                   <AlertCircle className="w-4 h-4 text-white/40 hover:text-white cursor-help transition-colors" />
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

      <Card className="border-emerald-700/40/30 overflow-hidden shadow-xl shadow-slate-200/40">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
           <div>
              <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                 <div className="w-2 h-6 bg-emerald-950/20 dark:bg-emerald-950/300 rounded-full" />
                 Base de Datos de Recibos
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Auditados por fecha y agente recaudador</p>
           </div>
           <div className="flex gap-2">
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400" />
                 <input 
                   placeholder="Recibo o cliente..." 
                   className="w-full sm:w-64 pl-10 pr-4 h-10 bg-slate-900 border border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder:text-muted-foreground shadow-xl rounded-xl transition-all outline-none text-xs font-medium"
                   value={localSearch}
                   onChange={(e) => setLocalSearch(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 bg-muted/5 flex flex-wrap items-center gap-2 border-b">
             <Badge className="bg-emerald-950/20 dark:bg-emerald-950/30 text-emerald-700 border-none shadow-sm font-black rounded-lg py-1 px-3">
               {filteredPayments.length} FILTRADOS
             </Badge>
             {clientId && (
               <Badge className="gap-2 px-3 py-1 bg-amber-900/20 dark:bg-amber-900/300 text-white border-none shadow-md font-black rounded-lg cursor-pointer" onClick={() => router.push('/dashboard/payments')}>
                 CLIENTE: {filteredClientName} <X className="w-3 h-3" />
               </Badge>
             )}
             <Button variant="outline" size="sm" className={cn("gap-2 h-8 border-border rounded-lg font-bold text-[10px] uppercase", (startDate || endDate) && "bg-emerald-950/20 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700")} onClick={() => setIsFilterOpen(true)}>
               <Calendar className="w-3.5 h-3.5" /> 
               { (startDate || endDate) ? "PERIODO ACTIVO" : " FILTRAR PERIODO" }
             </Button>
          </div>


          <div className="max-h-[650px] overflow-auto scrollbar-thin">
            <div className="min-w-[900px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Recibo</TableHead>
                  <TableHead>Cliente / Prestatario</TableHead>
                  <TableHead>Fecha de Cobro</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto Cobrado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={7} className="text-center py-10 font-bold text-muted-foreground animate-pulse">
                        Cargando historial de pagos...
                     </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="text-center py-10 font-bold text-muted-foreground">
                        No se encontraron pagos registrados.
                     </TableCell>
                  </TableRow>
                ) : filteredPayments.map((payment) => (
                  <TableRow 
                    key={payment.id} 
                    className="group hover:bg-emerald-950/20 dark:bg-emerald-950/30/20 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setIsReceiptModalOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                      #REC-{payment.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                           {payment.user.charAt(0)}
                         </div>
                         <span className="font-bold">{payment.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          {formatDate(payment.date)}
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] w-fit bg-background">EFECTIVO</Badge>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-tighter",
                            payment.label === "Pago de tarjeta" ? "text-blue-600" : "text-emerald-600"
                          )}>
                             {payment.label}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 font-black text-emerald-600">
                          <ArrowDownLeft className="w-4 h-4" />
                           {formatCurrency(convert(payment.amount || 0), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$')}
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          PROCESADO
                       </div>
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
              PÁGINA {page} DE {totalPages} ({totalItems} TOTAL)
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

      {/* MODAL DE RECIBO DE PAGO */}
      {isReceiptModalOpen && selectedPayment && (
        <ReceiptPrinter 
          payment={selectedPayment} 
          type={printerType}
          onClose={() => setIsReceiptModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
