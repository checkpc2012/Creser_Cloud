"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard,
  User,
  Calendar,
  Clock,
  Printer,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getLoanById, getLoanHistory } from "@/app/actions/loan-actions";
import { LoanDTO, InstallmentDTO, HistoricalEventDTO } from "@/types/dtos";
import { useCurrency } from "@/store/currency-context";

interface LoanDetailDrawerProps {
  loanId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function LoanDetailDrawer({ loanId, isOpen, onOpenChange, initialData }: LoanDetailDrawerProps) {
  const router = useRouter();
  const { currency, exchangeRate } = useCurrency();
  const [loan, setLoan] = React.useState<(LoanDTO & { installments: InstallmentDTO[] }) | null>(initialData || null);
  const [history, setHistory] = React.useState<HistoricalEventDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && loanId) {
      const fetchData = async () => {
        setLoading(true);
        setLoadingHistory(true);

        try {
          const data = await getLoanById(loanId);
          setLoan(data);
          
          // History requires operation number if legacy, or loanId for new ones
          // The current getLoanHistory action expects operationNumber
          const histData = await getLoanHistory(data?.operationNumber || loanId);
          setHistory(histData);
        } catch (error) {
          console.error("Error fetching loan detail:", error);
        } finally {
          setLoading(false);
          setLoadingHistory(false);
        }
      };
      fetchData();
    }
  }, [isOpen, loanId]);

  const convert = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (currency === 'USD') return num / exchangeRate;
    return num;
  };

  const progress = React.useMemo(() => {
    if (!loan || !loan.installments) return 0;
    const paid = loan.installments.filter(i => i.isPaid).length;
    return Math.round((paid / loan.termCount) * 100);
  }, [loan]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-4xl mx-auto h-[95vh]">
        <div className="mx-auto w-full max-w-4xl h-full flex flex-col">
          <DrawerHeader className="border-b px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DrawerTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                    Expediente {loan?.operationNumber || loan?.id?.substring(0, 8)}
                  </DrawerTitle>
                  <DrawerDescription className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" /> Control de Operación Crediticia Auditada
                  </DrawerDescription>
                </div>
              </div>
              <Badge className={cn(
                "h-8 px-4 rounded-xl font-black text-xs shadow-sm",
                loan?.isLegacy ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
              )}>
                {loan?.isLegacy ? "MIGRADO • LEGACY" : "SISTEMA NATIVO"}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
            <Tabs defaultValue="summary" className="w-full flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-3 bg-slate-900 p-1.5 rounded-2xl h-14 border border-slate-800 shadow-2xl flex-shrink-0 relative overflow-hidden">
                <TabsTrigger 
                  value="summary" 
                  className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(79,70,229,0.3)] text-slate-400 font-black uppercase text-[10px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger 
                  value="installments" 
                  className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.3)] text-slate-400 font-black uppercase text-[10px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Plan de Cuotas
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(147,51,234,0.3)] text-slate-400 font-black uppercase text-[10px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <HistoryIcon className="w-4 h-4 mr-2" />
                  Historial
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden pt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : !loan ? (
                   <div className="flex flex-col items-center justify-center h-full opacity-40">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="font-black uppercase text-sm">No se pudo cargar el préstamo</p>
                  </div>
                ) : (
                  <>
                    <TabsContent value="summary" className="h-full flex flex-col space-y-6 m-0 border-none outline-none overflow-auto">
                      {/* Dashboard de resumen rápido */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-indigo-600 uppercase">Capital Total</p>
                          <p className="text-2xl font-black text-indigo-950 tabular-nums">
                            {formatCurrency(convert(loan.totalAmount), 'es-UY', currency)}
                          </p>
                        </div>
                        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-emerald-600 uppercase">Saldo Pendiente</p>
                          <p className="text-2xl font-black text-emerald-950 tabular-nums">
                            {formatCurrency(convert(loan.outstandingBalance), 'es-UY', currency)}
                          </p>
                        </div>
                        <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-blue-600 uppercase">Estado General</p>
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-5 h-5 text-blue-600" />
                             <span className="text-lg font-black text-blue-950 uppercase">{loan.statusLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progreso del Contrato */}
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                           <div className="space-y-1">
                             <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">Evolución de Pago</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">{loan.termCount} Cuotas Pactadas</p>
                           </div>
                           <div className="text-right">
                             <span className="text-3xl font-black text-indigo-600 leading-none">{progress}%</span>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">COBRADO</p>
                           </div>
                        </div>
                        <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-1 shadow-inner">
                           <div 
                              className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-1000 shadow-lg"
                              style={{ width: `${progress}%` }}
                           />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <ShieldCheck className="w-3 h-3" /> Datos de Originación
                           </h4>
                           <div className="space-y-3">
                              <div className="flex justify-between p-3 rounded-2xl bg-white border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Sucursal</span>
                                 <span className="text-xs font-black text-slate-800 uppercase">{loan.branchId || "MATRIZ"}</span>
                              </div>
                              <div className="flex justify-between p-3 rounded-2xl bg-white border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Fecha Inicio</span>
                                 <span className="text-xs font-black text-slate-800">{formatDate(loan.createdAt)}</span>
                              </div>
                              <div className="flex justify-between p-3 rounded-2xl bg-white border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Operación ID</span>
                                 <span className="text-[10px] font-mono font-bold text-slate-400">{loan.id}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <TrendingUp className="w-3 h-3" /> Desglose Financiero
                           </h4>
                           <div className="space-y-3">
                              <div className="flex justify-between p-3 rounded-2xl bg-white border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Principal Liquido</span>
                                 <span className="text-xs font-black text-slate-800">{formatCurrency(convert(loan.principalAmount), 'es-UY', currency)}</span>
                              </div>
                              <div className="flex justify-between p-3 rounded-2xl bg-white border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Carga de Intereses</span>
                                 <span className="text-xs font-black text-indigo-600">+{formatCurrency(convert(loan.interestAmount), 'es-UY', currency)}</span>
                              </div>
                               <div className="flex justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                                 <span className="text-[10px] font-black text-indigo-900 uppercase">Total a Devolver</span>
                                 <span className="text-xs font-black text-indigo-900">{formatCurrency(convert(loan.totalAmount), 'es-UY', currency)}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="installments" className="h-full m-0 border-none outline-none overflow-hidden flex flex-col space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" /> Cronograma de Vencimientos
                        </h4>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase">{loan.termCount} Cuotas Mensuales</Badge>
                      </div>

                      <ScrollArea className="flex-1 rounded-2xl border bg-slate-50/50 p-4">
                        <div className="space-y-3">
                           {loan.installments.map((inst, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-colors hover:border-blue-200">
                               <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs",
                                    inst.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                  )}>
                                     {inst.number}
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">
                                      Vencimiento {formatDate(inst.dueDate)}
                                    </p>
                                    <p className="text-xs font-black text-slate-700 uppercase">Cuota Mensual</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-black tabular-nums text-slate-800">
                                    {formatCurrency(convert(inst.totalAmount), 'es-UY', currency)}
                                  </p>
                                  <Badge className={cn(
                                    "text-[7px] font-black uppercase h-4 px-1 leading-none mt-1",
                                    inst.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                  )}>
                                    {inst.isPaid ? "COBRADO" : "PENDIENTE"}
                                  </Badge>
                               </div>
                             </div>
                           ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="history" className="h-full m-0 border-none outline-none overflow-hidden flex flex-col space-y-4">
                       <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <HistoryIcon className="w-3 h-3" /> Eventos & Transacciones Auditadas
                        </h4>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase bg-purple-50 text-purple-700 border-purple-200">Audit Trail</Badge>
                      </div>

                      <ScrollArea className="flex-1 rounded-2xl border bg-slate-50/50 p-4">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center h-full py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          </div>
                        ) : history.length > 0 ? (
                          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {history.map((event, idx) => (
                              <div key={idx} className="relative flex items-start gap-4 group">
                                <div className={cn(
                                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                                  event.isLegacy ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                                )}>
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group-hover:border-purple-200 transition-colors">
                                  <div className="flex justify-between items-start mb-1">
                                     <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">{formatDate(event.date)}</p>
                                        <h5 className="text-xs font-black uppercase text-slate-800 tracking-tight">{event.label}</h5>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-xs font-black tabular-nums text-slate-900">{formatCurrency(convert(event.amount), 'es-UY', currency)}</p>
                                        <Badge className="text-[7px] h-3.5 px-1 bg-slate-100 text-slate-600 border-none font-black">{event.type}</Badge>
                                     </div>
                                  </div>
                                  {event.receiptNumber && (
                                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                                       <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                          <FileText className="w-2.5 h-2.5" /> REC: {event.receiptNumber}
                                       </span>
                                       {event.isLegacy && <Badge className="text-[7px] h-3.5 bg-orange-100 text-orange-700 font-bold uppercase">MIGRADO</Badge>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale py-12">
                            <HistoryIcon className="w-12 h-12 mb-4" />
                            <p className="font-black uppercase text-xs tracking-widest">Sin historial de eventos</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>

          <div className="p-6 border-t bg-slate-50 flex items-center justify-between gap-4 flex-shrink-0 rounded-b-3xl">
            <Button variant="ghost" className="font-black uppercase text-xs gap-2" onClick={() => window.print()}>
               <Printer className="w-4 h-4" /> Imprimir Expediente
            </Button>
            <div className="flex gap-3">
               <Button variant="outline" className="font-black uppercase text-xs rounded-xl" onClick={() => onOpenChange(false)}>
                  Cerrar
               </Button>
               {loan?.clientId && (
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl gap-2 shadow-lg shadow-indigo-200"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/dashboard/clients?clientId=${loan.clientId}`);
                  }}
                >
                  <User className="w-4 h-4" /> Ver Cliente <ExternalLink className="w-4 h-4" />
                </Button>
               )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
