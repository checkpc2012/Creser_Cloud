"use client";

import { useState, useMemo, Suspense } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  User,
  Phone,
  MessageCircle,
  Filter,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Mail,
  History,
  Download,
  X,
  Calculator,
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
import { formatCurrency, formatDate, cn, normalizeSearch, roundAmount } from "@/lib/utils";
import { useSearch } from "@/store/search-context";
import { useCurrency } from "@/store/currency-context";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getUpcomingInstallments, processPayment } from "@/app/actions/payment-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PaymentDialog, LoanFinishedDialog } from "@/components/payments/payment-dialog";

function CollectionsContent() {
  const { searchQuery } = useSearch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const actionLoanId = searchParams.get("actionLoanId");
  const clientId = searchParams.get('clientId');
  const loanId = searchParams.get('loanId');
  const initialSeverity = searchParams.get('severity');
  const { currency, exchangeRate } = useCurrency();
  const [localSearch, setLocalSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(initialSeverity || null);
  const [allPending, setAllPending] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para Modal de Contacto y Acción
  const [selectedCollector, setSelectedCollector] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [actionNote, setActionNote] = useState("");

  // Nuevos Estados para Detalle de Cliente y Riesgo
  const [isClientDetailModalOpen, setIsClientDetailModalOpen] = useState(false);
  const [isRiskDetailModalOpen, setIsRiskDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoanFinishedModalOpen, setIsLoanFinishedModalOpen] = useState(false);
  const [finishedLoanData, setFinishedLoanData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const query = (localSearch || searchQuery).trim();
      
      // Minimum 2 chars to initiate a search; if empty, load all
      if (query !== "" && query.length < 2) return;


      setIsLoading(true);
      const result = await getUpcomingInstallments(1, { 
        clientId: clientId || undefined, 
        loanId: loanId || undefined,
        search: query || undefined 
      });

      const data = result.installments || [];

      // Agrupar cuotas por préstamo
      const loansMap = new Map();

      data.forEach((inst: any) => {
        if (inst.status === 'PAID') return;

        const loanId = inst.loanId;
        if (!loansMap.has(loanId)) {
          loansMap.set(loanId, {
            id: inst.loan.id,
            loanId: inst.loan.id,
            clientId: inst.loan.clientId,
            cliente: inst.loan.client?.nombreCompleto || 'Desconocido',
            monto: 0,
            cuotasPendientes: [],
            totalCuotas: inst.loan.termMonths,
            fechaVencimientoMasProxima: inst.dueDate,
            documento: inst.loan.client?.documento,
            currency: inst.loan.currency,
            interestRate: inst.loan.interestRate,
            capital: inst.loan.amount,
            telefonos: inst.loan.client?.telefonos || [],
            emails: [inst.loan.client?.email].filter(Boolean)
          });
        }

        const loanData = loansMap.get(loanId);
        const pendiente = inst.amount - inst.paidAmount;
        loanData.monto += pendiente;
        loanData.cuotasPendientes.push({
          id: inst.id,
          num: inst.installmentNum,
          monto: pendiente,
          dueDate: inst.dueDate
        });

        // Mantener la fecha de vencimiento más antigua/próxima
        if (new Date(inst.dueDate) < new Date(loanData.fechaVencimientoMasProxima)) {
          loanData.fechaVencimientoMasProxima = inst.dueDate;
        }
      });

      const mapped = Array.from(loansMap.values()).map(loan => {
        const diasDiferencia = Math.ceil((new Date(loan.fechaVencimientoMasProxima).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...loan,
          dias: diasDiferencia,
          fecha: loan.fechaVencimientoMasProxima,
          resumenCuotas: `${loan.cuotasPendientes.length} pend.`
        };
      });

      setAllPending(mapped);
      setIsLoading(false);

      if (actionLoanId) {
        const target = mapped.find(p => p.loanId === actionLoanId);
        if (target && !isPaymentModalOpen) {
          setSelectedCollector(target);
          setPaymentAmount(target.monto.toString());
          setIsPaymentModalOpen(true);
          // Set filter so the user only sees that specific client/loan
          setLocalSearch(actionLoanId);
        }
      }
    }
    loadData();
  }, [actionLoanId, clientId, loanId]);

  // Estado para WhatsApp Directo
  const [isWhatsAppComposeOpen, setIsWhatsAppComposeOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("Hola, me comunico de Creser por tu cuota pendiente del préstamo.");

  // Simulación de Historial de Llamadas (Últimos 3 registros)
  const contactHistory = [
    { date: "2024-03-01 10:15", action: "LLAMADA", result: "PROMESA", note: "Promete pagar el viernes 5." },
    { date: "2024-02-25 14:30", action: "LLAMADA", result: "NO_UBICADO", note: "No atiende, se deja buzón." },
    { date: "2024-02-20 09:00", action: "WA_MSJ", result: "LECTURA", note: "Visto, sin respuesta." },
  ];

  const convert = (val: number) => {
    if (currency === 'USD') return val / exchangeRate;
    return val;
  };

  const filteredPending = useMemo(() => {
    let list = allPending;

    // Filtro por Severidad
    if (severityFilter) {
      if (severityFilter === "CRITICA") list = list.filter(p => p.dias < -5);
      else if (severityFilter === "ALTA") list = list.filter(p => p.dias < 0 && p.dias >= -5);
      else if (severityFilter === "NORMAL") list = list.filter(p => p.dias >= 0);
    }

    const raw = (localSearch || searchQuery).trim();
    if (!raw) return list;

    const query = normalizeSearch(raw);

    return list.filter(p => {
      const nameMatch = normalizeSearch(p.cliente).includes(query);
      const loanMatch = normalizeSearch(p.loanId).includes(query);
      const docMatch = p.documento ? normalizeSearch(p.documento).includes(query) : false;
      const queryNoSpaces = query.replace(/\s/g, '');
      const docMatchNoSpaces = p.documento ? normalizeSearch(p.documento).replace(/\s/g, '').includes(queryNoSpaces) : false;

      return nameMatch || loanMatch || docMatch || docMatchNoSpaces;
    });
  }, [searchQuery, localSearch, severityFilter, allPending]);

  const stats = useMemo(() => {
    const overdue = allPending.filter((p: any) => p.dias < 0);
    const today = allPending.filter((p: any) => p.dias === 0);
    const totalMora = overdue.reduce((acc: any, curr: any) => acc + curr.monto, 0);
    return [
      { label: "En Mora", count: overdue.length, amount: totalMora, color: "text-rose-600", bg: "bg-rose-100", severity: "ALTA" },
      { label: "Vencen Hoy", count: today.length, amount: today.reduce((acc: any, curr: any) => acc + curr.monto, 0), color: "text-amber-600", bg: "bg-amber-100", severity: "NORMAL" },
      { label: "Total Pendiente", count: allPending.length, amount: allPending.reduce((acc: any, curr: any) => acc + curr.monto, 0), color: "text-blue-600", bg: "bg-blue-100", severity: null },
    ];
  }, [allPending]);

  const handleExport = () => {
    const headers = ["ID Prestamo", "Cliente", "Fecha Vencimiento", "Retraso (Dias)", "Monto Pendiente", "Cuota", "Severidad"];
    const rows = filteredPending.map(p => [
      `"${p.loanId}"`,
      `"${p.cliente}"`,
      `"${formatDate(p.fecha)}"`,
      `"${p.dias}"`,
      `"${p.monto}"`,
      `"${p.cuotaNumero}/${p.totalCuotas}"`,
      `"${p.dias < -5 ? 'CRITICA' : p.dias < 0 ? 'ALTA' : 'NORMAL'}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Creser_Cobranza_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const uiStats = useMemo(() => {
    const overdue = allPending.filter((p: any) => p.dias < 0);
    const today = allPending.filter((p: any) => p.dias === 0);
    const totalMora = overdue.reduce((acc: any, curr: any) => acc + curr.monto, 0);

    return [
      {
        title: "En Mora",
        value: overdue.length,
        amount: totalMora,
        icon: AlertTriangle,
        bg: "bg-emerald-600",
        description: "Clientes con cuotas vencidas que requieren gestión inmediata."
      },
      {
        title: "Vencen Hoy",
        value: today.length,
        amount: today.reduce((acc: any, curr: any) => acc + curr.monto, 0),
        icon: Clock,
        bg: "bg-emerald-600",
        description: "Compromisos de pago que llegan a su fecha límite durante el día."
      },
      {
        title: "Monto Pendiente",
        value: allPending.length,
        amount: allPending.reduce((acc: any, curr: any) => acc + curr.monto, 0),
        icon: History,
        bg: "bg-emerald-600",
        description: "Total de capital vencido o por vencer actualmente en calle."
      },
      {
        title: "Tasa Recupero",
        value: "92%",
        isRate: true,
        icon: TrendingUp,
        bg: "bg-emerald-600",
        description: "Efectividad proyectada de la cobranza mensual."
      }
    ];
  }, [allPending]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cobranza y Recuperación</h1>
          <p className="text-sm text-muted-foreground leading-none">Gestión activa de <span className="text-rose-600 font-bold">{allPending.length}</span> casos operativos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-11 gap-2 border-border text-slate-700 bg-background hover:bg-slate-50 font-bold rounded-2xl px-6 transition-all" onClick={handleExport}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button size="sm" className="h-11 gap-2 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 font-black uppercase text-xs rounded-2xl px-8 border-none ring-offset-background transition-all">
            <AlertTriangle className="w-4 h-4" /> Reporte Mora
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {uiStats.map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border-none shadow-xl transition-all duration-300 group overflow-hidden relative shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
              stat.bg
            )}
            onClick={() => {
              if (stat.title === "En Mora") setSeverityFilter("ALTA");
              if (stat.title === "Vencen Hoy") setSeverityFilter("NORMAL");
            }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-125 bg-background/20 rounded-full blur-2xl`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/80">{stat.title}</CardTitle>
              <div className="p-2 rounded-lg bg-background/20 backdrop-blur-md">
                <stat.icon className={`w-4 h-4 text-white`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <div className="text-3xl font-black tracking-tighter">
                {stat.amount ? formatCurrency(convert(stat.amount), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$') : stat.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                  {stat.isRate ? 'PROYECTADO' : `${stat.value} CASOS`}
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
              <div className="w-2 h-6 bg-rose-900/20 dark:bg-rose-900/300 rounded-full" />
              Monitor de Cobranza
            </CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Casos agrupados por nivel de riesgo y mora</p>
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400" />
              <input
                placeholder="Cédula o cliente..."
                className="w-full sm:w-64 pl-10 pr-4 h-10 bg-slate-900 border border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder:text-muted-foreground shadow-xl rounded-xl transition-all outline-none text-xs font-medium"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 bg-muted/5 flex flex-wrap items-center gap-2 border-b">
            <Badge className="bg-rose-900/20 dark:bg-rose-900/30 text-rose-700 border-none shadow-sm font-black rounded-lg py-1 px-3">
              {filteredPending.length} PENDIENTES
            </Badge>
            {loanId && (
              <Badge
                className="gap-2 px-3 py-1 bg-amber-900/20 dark:bg-amber-900/30 text-amber-700 border-none shadow-md font-black rounded-lg cursor-pointer hover:bg-amber-900/30 transition-all uppercase text-[10px]"
                onClick={() => router.push('/dashboard/collections')}
              >
                FILTRO PRÉSTAMO: ID {loanId.substring(0, 8)}... <X className="w-3 h-3" />
              </Badge>
            )}
            {clientId && (
              <Badge
                className="gap-2 px-3 py-1 bg-blue-900/20 dark:bg-blue-900/30 text-blue-700 border-none shadow-md font-black rounded-lg cursor-pointer hover:bg-blue-900/30 transition-all uppercase text-[10px]"
                onClick={() => router.push('/dashboard/collections')}
              >
                FILTRO CLIENTE ACTIVO <X className="w-3 h-3" />
              </Badge>
            )}
            {severityFilter && (
              <Badge
                className="gap-2 px-3 py-1 bg-rose-900/20 dark:bg-rose-900/300 text-rose-700 border-none shadow-md font-black rounded-lg cursor-pointer hover:bg-rose-900/30 transition-all uppercase text-[10px]"
                onClick={() => {
                  setSeverityFilter(null);
                  router.push('/dashboard/collections');
                }}
              >
                FILTRO RIESGO: {severityFilter} <X className="w-3 h-3" />
              </Badge>
            )}
          </div>


          <div className="max-h-[600px] overflow-auto scrollbar-thin">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="font-bold">Cliente / Préstamo</TableHead>
                    <TableHead className="font-bold">Cuota</TableHead>
                    <TableHead className="font-bold">Días de Atraso</TableHead>
                    <TableHead className="font-bold">Monto Pendiente</TableHead>
                    <TableHead className="font-bold">Nivel de Riesgo</TableHead>
                    <TableHead className="text-right font-bold">Gestión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 font-bold text-muted-foreground animate-pulse">
                        Cargando cobranzas pendientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 font-bold text-muted-foreground">
                        No hay cuotas pendientes.
                      </TableCell>
                    </TableRow>
                  ) : filteredPending.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "group transition-all cursor-pointer",
                        p.dias < -5 ? "bg-rose-900/20 dark:bg-rose-900/300/10 hover:bg-rose-900/20 dark:bg-rose-900/300/15" :
                          p.dias < 0 ? "bg-amber-900/20 dark:bg-amber-900/300/5 hover:bg-amber-900/20 dark:bg-amber-900/300/10" : "hover:bg-muted/30"
                      )}
                      onClick={() => {
                        setSelectedCollector(p);
                        setPaymentAmount(p.monto.toString());
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase">{p.cliente}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                            <Badge variant="outline" className="h-4 px-1 leading-none text-[8px]">{p.loanId}</Badge>
                            <span>DESEMBOLSO: {formatDate(p.fecha)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-black">
                          CUOTA {p.cuotasPendientes[0]?.num} <span className="text-muted-foreground font-normal">de {p.totalCuotas}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            p.dias < -5 ? "bg-rose-600" : p.dias < 0 ? "bg-amber-900/20 dark:bg-amber-900/300" : "bg-emerald-950/20 dark:bg-emerald-950/300"
                          )} />
                          <span className={cn(
                            "text-[11px] font-black uppercase",
                            p.dias < 0 ? "text-rose-600" : p.dias === 0 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {p.dias < 0 ? `${Math.abs(p.dias)} días atrasado` : p.dias === 0 ? 'Vence hoy' : `En ${p.dias} días`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-emerald-600">
                        {formatCurrency(convert(p.monto), 'es-UY', currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase rounded-full px-3 cursor-help hover:ring-2 ring-offset-1 transition-all",
                            p.dias < -15 ? "bg-rose-800 text-white" :
                              p.dias < -5 ? "bg-rose-600 text-white" :
                                p.dias < 0 ? "bg-amber-900/20 dark:bg-amber-900/300 text-black" : "bg-emerald-950/20 dark:bg-emerald-950/300 text-white"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCollector(p);
                            setIsRiskDetailModalOpen(true);
                          }}
                        >
                          {p.dias < -15 ? "LEGAL" : p.dias < -5 ? "CRÍTICO" : p.dias < 0 ? "MORA" : "NORMAL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-emerald-950/20 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-600 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCollector(p);
                              setIsContactModalOpen(true);
                            }}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-blue-900/20 dark:bg-blue-900/30 hover:bg-emerald-100 text-emerald-600 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCollector(p);
                              setIsWhatsAppComposeOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Link href={`/dashboard/clients?clientId=${p.clientId}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-amber-900/20 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-600 h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                              title="Ver Ficha Cliente"
                            >
                              <User className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/loans?clientId=${p.clientId}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-blue-900/20 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                              title="Ver Préstamos"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE CONTACTO RÁPIDO */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contactar a {selectedCollector?.cliente}
            </DialogTitle>
            <DialogDescription>
              Selecciona el canal de comunicación para gestionar la mora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Teléfonos Disponibles</label>
              {(selectedCollector?.telefonos || []).map((tel: string, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/40">
                  <span className="font-mono font-bold text-foreground">{tel}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2 text-emerald-600 border-emerald-600/40" onClick={() => window.open(`https://wa.me/598${tel.replace(/^0/, '')}`, '_blank')}>
                      <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="primary" className="h-8 px-2" onClick={() => { setIsContactModalOpen(false); setIsActionModalOpen(true); setSelectedAction("LLAMADA"); }}>
                      Llamar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Correos Electrónicos</label>
              {(selectedCollector?.emails || []).map((email: string, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/40 text-xs text-foreground">
                  <span className="font-semibold">{email}</span>
                  <a href={`mailto:${email}`}>
                    <Button size="sm" variant="ghost" className="h-8 text-blue-600">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REGISTRO DE ACCIÓN */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Registrar Acción de Cobranza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Resultado de la {selectedAction}</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant={actionNote === 'PROMESA' ? 'primary' : 'outline'} className="text-xs h-8" onClick={() => setActionNote('PROMESA')}>PAGO PROMETIDO</Button>
                <Button variant={actionNote === 'NO_UBICADO' ? 'primary' : 'outline'} className="text-xs h-8" onClick={() => setActionNote('NO_UBICADO')}>NO ATENDIÓ</Button>
                <Button variant={actionNote === 'NEGATIVA' ? 'primary' : 'outline'} className="text-xs h-8" onClick={() => setActionNote('NEGATIVA')}>NEGATIVA DE PAGO</Button>
                <Button variant={actionNote === 'OTRO' ? 'primary' : 'outline'} className="text-xs h-8" onClick={() => setActionNote('OTRO')}>OTROS</Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase">Nota interna</label>
              <Input placeholder="Ej: Prometió pasar el lunes..." disabled={actionNote !== 'OTRO' && actionNote !== 'PROMESA'} value={actionNote === 'PROMESA' || actionNote === 'OTRO' ? 'Pendiente confirmación' : ''} readOnly />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsActionModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" className="bg-emerald-600 text-white" onClick={() => setIsActionModalOpen(false)}>Confirmar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE DE CARPETA (Click en fila) */}
      <Dialog open={isClientDetailModalOpen} onOpenChange={setIsClientDetailModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              Expediente: {selectedCollector?.cliente}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl border">
                <h3 className="text-xs font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Datos del Préstamo
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID Préstamo:</span>
                    <span className="font-bold">{selectedCollector?.loanId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cuota Actual:</span>
                    <span className="font-bold">{selectedCollector?.cuotaNumero} de {selectedCollector?.totalCuotas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vencimiento:</span>
                    <span className="font-bold text-rose-600">{formatDate(selectedCollector?.fecha)}</span>
                  </div>
                  <Link href={`/dashboard/loans?loanId=${selectedCollector?.loanId}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                      Ver Préstamo Completo <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-emerald-950/20 dark:bg-emerald-950/300/5 p-4 rounded-2xl border border-emerald-700/30">
                <h3 className="text-xs font-black uppercase text-emerald-700 mb-3">Información de Contacto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {selectedCollector?.telefonos?.[0]}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {selectedCollector?.emails?.[0]}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                <History className="w-3 h-3" /> Últimos 3 Contactos
              </h3>
              <div className="space-y-3">
                {contactHistory.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-background shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className="text-[8px] px-1 h-4">{h.date}</Badge>
                      <span className={cn(
                        "text-[9px] font-black px-1.5 rounded uppercase",
                        h.result === 'PROMESA' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                      )}>{h.result}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-tight">{h.note}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 gap-2" onClick={() => { setIsClientDetailModalOpen(false); setIsContactModalOpen(true); }}>
                  Realizar Gestión
                </Button>
                <Link href={`/dashboard/clients?clientId=${selectedCollector?.clientId}`} className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <User className="w-4 h-4" /> Ver Perfil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL CÁLCULO DE RIESGO / MORA */}
      <Dialog open={isRiskDetailModalOpen} onOpenChange={setIsRiskDetailModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Desglose de Deuda y Riesgo
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/50 border text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Días Mora</p>
                <p className="text-3xl font-black text-rose-600">{Math.max(0, Math.abs(selectedCollector?.dias || 0))}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Tasa Mora</p>
                <p className="text-3xl font-black">2.5<span className="text-sm">%</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Capital de la Cuota:</span>
                <span className="font-bold">{formatCurrency(convert(selectedCollector?.monto || 0) * 0.8, 'es-UY', currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Interés Compensatorio:</span>
                <span className="font-bold">{formatCurrency(convert(selectedCollector?.monto || 0) * 0.2, 'es-UY', currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2 text-rose-600 font-bold">
                <span>Interés por Mora (Agregado):</span>
                <span>{formatCurrency((convert(selectedCollector?.monto || 0) * 0.025 * Math.max(0, Math.abs(selectedCollector?.dias || 0)) / 30), 'es-UY', currency)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black pt-2">
                <span>TOTAL A RECAUDAR:</span>
                <span className="text-emerald-600">
                  {formatCurrency(convert(selectedCollector?.monto || 0) + (convert(selectedCollector?.monto || 0) * 0.025 * Math.max(0, Math.abs(selectedCollector?.dias || 0)) / 30), 'es-UY', currency === 'UYU' ? 'UYU' : 'USD').replace('UYU', '$ UY').replace('USD', 'US$')}
                </span>
              </div>
            </div>

            <div className="bg-rose-900/20 dark:bg-rose-900/30 p-4 rounded-xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase mb-1">Análisis de Riesgo</p>
              <p className="text-xs text-rose-700 leading-relaxed">
                El cliente presenta un nivel de riesgo <strong>{selectedCollector?.dias < -15 ? 'MUY ALTO' : 'MODERADO'}</strong> basado en su historial de pagos y los {Math.abs(selectedCollector?.dias || 0)} días de retraso actuales.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL WHATSAPP DIRECTO */}
      <Dialog open={isWhatsAppComposeOpen} onOpenChange={setIsWhatsAppComposeOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Enviar Mensaje WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-xl text-xs space-y-1">
              <p><strong>Para:</strong> {selectedCollector?.cliente}</p>
              <p><strong>Tel:</strong> {selectedCollector?.telefonos?.[0]}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase">Mensaje a enviar:</label>
              <textarea
                className="w-full h-32 p-3 text-sm rounded-xl border bg-background focus:ring-2 ring-emerald-500 outline-none resize-none"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsWhatsAppComposeOpen(false)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 text-white"
              onClick={() => {
                const tel = selectedCollector?.telefonos?.[0]?.replace(/^0/, '');
                window.open(`https://wa.me/598${tel}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                setIsWhatsAppComposeOpen(false);
              }}
            >
              Enviar a WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoanFinishedDialog
        isOpen={isLoanFinishedModalOpen}
        onOpenChange={(open: boolean) => {
          setIsLoanFinishedModalOpen(open);
          if (!open) {
            setIsPaymentModalOpen(false);
            window.location.reload();
          }
        }}
        data={finishedLoanData}
      />

      <PaymentDialog
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        installment={selectedCollector}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setIsLoanFinishedModalOpen={setIsLoanFinishedModalOpen}
        setFinishedLoanData={setFinishedLoanData}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}


export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}
