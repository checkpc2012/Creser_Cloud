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
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  History as HistoryIcon, 
  PlusCircle,
  ExternalLink,
  Info,
  Layers,
  Briefcase,
  Home,
  FileText,
  Receipt,
  Building2,
  HardHat,
  Monitor,
  HeartPulse,
  Scale
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientLoans } from "@/app/actions/loan-actions";
// Removed getClientHistory to prevent Prisma bundling in Client Component
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { LoanDrawer } from "@/components/loans/loan-drawer";
import { LoanDTO, HistoricalEventDTO } from "@/types/dtos";
import { getInvoices } from "@/app/actions/billing-actions";
import { PaymentDialog, LoanFinishedDialog } from "@/components/payments/payment-dialog";
import { getLoanPaymentDetails } from "@/app/actions/payment-actions";
import { RefinanceModal } from "@/components/loans/refinance-modal";
import { ClientTimeline } from "@/components/clients/client-timeline";
import { Search, RefreshCcw } from "lucide-react";

interface ClientDetailDrawerProps {
  client: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDrawer({ client, isOpen, onOpenChange }: ClientDetailDrawerProps) {
  const router = useRouter();
  const [paymentHistory, setPaymentHistory] = React.useState<HistoricalEventDTO[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [cardMovements, setCardMovements] = React.useState<any[]>([]);
  const [loadingCards, setLoadingCards] = React.useState(false);
  const [clientLoans, setClientLoans] = React.useState<LoanDTO[]>([]);
  const [loadingLoans, setLoadingLoans] = React.useState(false);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<string>("ALL");

  // Collection states
  const [activePaymentData, setActivePaymentData] = React.useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [isLoanFinishedModalOpen, setIsLoanFinishedModalOpen] = React.useState(false);
  const [finishedLoanData, setFinishedLoanData] = React.useState<any>(null);

  // Refinancing states
  const [isRefinanceModalOpen, setIsRefinanceModalOpen] = React.useState(false);
  const [selectedLoanForRefinance, setSelectedLoanForRefinance] = React.useState<string | null>(null);

  const handleOpenPayment = async (loanId: string) => {
    const details = await getLoanPaymentDetails(loanId);
    if (details) {
      setActivePaymentData(details);
      setPaymentAmount(details.cuotasPendientes[0]?.monto || "");
      setIsPaymentDialogOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    // Re-fetch data
    if (client?.id) {
       getClientLoans(client.id).then(setClientLoans);
       const doc = client.documentNumber || client.documento;
       fetch(`/api/clients/${doc}/history`).then(res => res.json()).then(setPaymentHistory);
    }
  };

  React.useEffect(() => {
    if (isOpen && client?.id) {
      const isVirtual = client.id.startsWith("v-");
      const documentNumber = client.documento || client.documentNumber;

      // Fetch all loans from domain schema (Only if not virtual)
      setLoadingLoans(true);
      if (!isVirtual) {
        getClientLoans(client.id).then(l => {
          setClientLoans(l);
          setLoadingLoans(false);
        });
      } else {
        setClientLoans([]);
        setLoadingLoans(false);
      }

      // Fetch reconstructed history from audit schema via API Route for isolation
      setLoadingHistory(true);
      fetch(`/api/clients/${documentNumber}/history`)
        .then(res => res.json())
        .then(h => {
          setPaymentHistory(h);
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error("Error fetching history:", err);
          setLoadingHistory(false);
        });

      // Fetch card movements via API Route (Use document as legacyId if virtual)
      const legacyId = client.legacyId || client.legacy_id || (isVirtual ? documentNumber : null);
      if (legacyId) {
        setLoadingCards(true);
        fetch(`/api/clients/${client.id}/movements?legacyId=${legacyId}`)
          .then(res => res.json())
          .then(m => {
            setCardMovements(m);
            setLoadingCards(false);
          })
          .catch(err => {
            console.error("Error fetching movements:", err);
            setLoadingCards(false);
          });
      } else {
        setCardMovements([]);
      }

      // Fetch invoices
      setLoadingInvoices(true);
      getInvoices(1, { clientId: client.id }).then(res => {
        setInvoices(res.invoices);
        setLoadingInvoices(false);
      });
    }
  }, [isOpen, client?.id, client?.documento, client?.documentNumber, client?.legacyId, client?.legacy_id]);

  if (!client) return null;

  const activeLoans = clientLoans?.filter((l: LoanDTO) => l.status === "ACTIVE") || [];
  
  // Categorize for UI separation (Updated for Phase 9 domain schema)
  const newSystemLoans = clientLoans?.filter((l: LoanDTO) => !l.isLegacy) || [];
  const legacyActive = clientLoans?.filter((l: LoanDTO) => l.isLegacy && l.status === "ACTIVE") || [];
  const legacyArrears = clientLoans?.filter((l: LoanDTO) => l.isLegacy && l.status === "IN_ARREARS") || [];
  const historical = clientLoans?.filter((l: LoanDTO) => l.status === "CLOSED" || l.status === "HISTORICAL") || [];

  const totalBalance = activeLoans.reduce((acc: number, l: LoanDTO) => acc + parseFloat(l.outstandingBalance || "0"), 0);
  const workData = client.workData as any;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl mx-auto">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto max-h-[90vh]">
          <DrawerHeader className="border-b px-6 bg-slate-50/50 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-500/20 border-4 border-white">
                  {(client.nombreCompleto || client.fullName || "?")[0]}
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <DrawerTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
                      {client.nombreCompleto || client.fullName}
                    </DrawerTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "h-6 px-2 text-[9px] font-black uppercase tracking-widest border-2 shadow-sm shrink-0",
                      client.source === 'LEGACY' ? "border-rose-200 text-rose-600 bg-rose-50" : "border-emerald-200 text-emerald-600 bg-emerald-50"
                    )}>
                      {client.source || (client.isLegacy ? 'LEGACY' : 'NEW_SYSTEM')}
                    </Badge>
                    {client.remarkCategory && (
                      <Badge className={cn(
                        "h-6 px-2 text-[9px] font-black uppercase tracking-widest",
                        client.remarkCategory === 'Fallecido' ? "bg-slate-900 text-white" : 
                        client.remarkCategory === 'Clearing' ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                      )}>
                        {client.remarkCategory === 'Fallecido' ? 'Fallecido' : 
                         client.remarkCategory === 'Clearing' ? 'Clearing' : client.remarkCategory}
                      </Badge>
                    )}
                    <span className="text-slate-300">|</span>
                    <Badge variant="secondary" className="text-[10px] font-bold bg-slate-200/50 text-slate-700">
                      ID: {client.documentNumber || client.documento}
                    </Badge>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                      <MapPin className="w-3 h-3" /> {client.address || "DIRECCIÓN NO DISPONIBLE"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[180px]">
                <LoanDrawer 
                  clientId={client.id}
                  trigger={
                    <Button className="h-10 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-black uppercase text-[10px] rounded-xl px-4 transition-all active:scale-95">
                      <PlusCircle className="w-4 h-4" /> Nuevo Préstamo
                    </Button>
                  }
                />
                <Button 
                  variant="outline" 
                  className="h-10 w-full gap-2 border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl px-4 transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 active:bg-emerald-100 group"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/dashboard/clients?clientId=${client.id}&view=full`);
                  }}
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" /> Ver ficha completa
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 w-full gap-2 border-slate-200 text-slate-600 font-black uppercase text-[10px] rounded-xl px-4 transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 active:bg-blue-100 group"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/dashboard/loans?clientId=${client.id}`);
                  }}
                >
                  <HistoryIcon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" /> Historial de préstamos
                </Button>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          </DrawerHeader>

          <div className="p-6 space-y-6">
            <Tabs defaultValue="cuotas" className="w-full">
              <TabsList className="w-full grid grid-cols-5 bg-slate-900 p-1.5 rounded-2xl h-14 border border-slate-800 shadow-2xl relative overflow-hidden">
                <TabsTrigger 
                  value="cuotas" 
                  className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-slate-400 font-black uppercase text-[9px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Cuotas
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.3)] text-slate-400 font-black uppercase text-[9px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <HistoryIcon className="w-3.5 h-3.5 mr-1.5" />
                  Historial
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(234,88,12,0.3)] text-slate-400 font-black uppercase text-[9px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(217,119,6,0.3)] text-slate-400 font-black uppercase text-[9px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger 
                  value="summary" 
                  className="rounded-xl data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(51,65,85,0.3)] text-slate-400 font-black uppercase text-[9px] tracking-tight transition-all duration-300 hover:text-slate-100"
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  Perfil
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="pt-4 space-y-6">
                 {/* Resumen Operativo Compacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-emerald-500" /> Datos de Contacto
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 mt-0.5">
                          <Phone className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Teléfonos</p>
                          <p className="text-sm font-bold text-slate-700 leading-tight">
                            {client.telefonos?.join(", ") || client.phone || "No disponible"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 mt-0.5">
                          <Mail className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Email</p>
                          <p className="text-sm font-bold text-slate-700 leading-tight break-all">
                            {client.email || "No disponible"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 mt-0.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Dirección Principal</p>
                          <p className="text-sm font-bold text-slate-700 leading-tight">
                            {client.streetAndNum || client.address || "No disponible"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Laboral / Vivienda
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50/50 flex items-center justify-center border border-blue-100 mt-0.5">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-0.5">Lugar de Trabajo / Referencia</p>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                              {client.employer?.employerName || client.workplaceName || "SIN DATO"}
                            </p>
                            {client.employer && (
                              <Badge variant="outline" className={cn(
                                "text-[7px] font-black uppercase px-1 h-3.5",
                                client.employer.type === 'PUBLIC_INSTITUTION' ? "border-sky-200 text-sky-700 bg-sky-50" :
                                client.employer.type === 'RETIRED_OR_PENSION' ? "border-purple-200 text-purple-700 bg-purple-50" :
                                client.employer.type === 'PRIVATE_COMPANY' ? "border-amber-200 text-amber-700 bg-amber-50" :
                                "border-slate-200 text-slate-600 bg-slate-50"
                              )}>
                                {client.employer.type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {client.jobTitle && (
                              <span className="text-xs font-medium text-slate-500 italic flex items-center gap-1">
                                <HardHat className="w-3 h-3" /> {client.jobTitle}
                              </span>
                            )}
                            {client.employer?.employerCode && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                CÓDIGO LEGADO: {client.employer.employerCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50/50 flex items-center justify-center border border-orange-100 mt-0.5">
                          <Home className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter mb-0.5">Situación Habitacional</p>
                          <p className="text-sm font-bold text-slate-800 leading-tight italic">
                            {workData?.vivienda || "S/D"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cuotas" className="pt-4 space-y-4">
                {/* Unified Internal Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="BUSCAR EN CUOTAS (OP., COMERCIO, FECHA...)"
                    className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       Cartera Operativa / Vivos
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-black border-emerald-200 text-emerald-700 bg-emerald-50">
                      {activeLoans.length + cardMovements.length} COMPROMISOS
                    </Badge>
                  </div>

                  <ScrollArea className="h-[400px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4">
                    <div className="space-y-3">
                      {/* Active Loans (Filters by search term) */}
                      {activeLoans
                        .filter(l => !searchTerm || l.operationNumber?.includes(searchTerm) || l.statusLabel.includes(searchTerm))
                        .map((loan: LoanDTO, idx) => (
                        <div key={`loan-${idx}`} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-600/30 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-600 text-[8px] font-black rounded-sm h-4">PRÉSTAMO</Badge>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OP {loan.operationNumber}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                                  {formatCurrency(loan.outstandingBalance, "es-UY", "UYU")}
                                </h4>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase">
                                  <span>{loan.termCount} Cuotas</span>
                                  <span>•</span>
                                  <span>{formatDate(loan.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-black uppercase px-3 rounded-lg"
                                onClick={() => handleOpenPayment(loan.id)}
                              >
                                COBRAR
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] font-black uppercase px-2 rounded-lg gap-1.5"
                                onClick={() => {
                                  setSelectedLoanForRefinance(loan.id);
                                  setIsRefinanceModalOpen(true);
                                }}
                              >
                                <RefreshCcw className="w-3 h-3 text-emerald-600" />
                                REFINANCIAR
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Card Movements (Active/Pending) */}
                      {cardMovements
                        .filter(m => !searchTerm || m.description?.toUpperCase().includes(searchTerm) || m.merchant_name?.toUpperCase().includes(searchTerm))
                        .map((m, idx) => (
                        <div key={`card-${idx}`} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-600/30 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-600 text-[8px] font-black rounded-sm h-4">TARJETA $</Badge>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(m.date)}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                                  {formatCurrency(m.amount, "es-UY", m.currency || "UYU")}
                                </h4>
                                <div className="flex flex-col text-[10px] font-bold text-slate-600 uppercase">
                                  <span>{m.description || "CONSUMO TARJETA"}</span>
                                  {m.merchant_name && <span className="text-blue-600">COMERCIO: {m.merchant_name}</span>}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50 text-[9px] font-black uppercase px-3 rounded-lg">
                              DETALLE
                            </Button>
                          </div>
                        </div>
                      ))}

                      {activeLoans.length === 0 && cardMovements.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-10 opacity-30">
                           <CreditCard className="w-10 h-10 mb-2" />
                           <p className="text-xs font-black uppercase">Sin compromisos vivos</p>
                         </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="history" className="pt-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="BUSCAR EN HISTORIAL..."
                    className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-10 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  />
                  <HistoryIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <HistoryIcon className="w-3 h-3" /> Operaciones Finalizadas / Legado
                  </h3>
                  <ScrollArea className="h-[400px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center h-full py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : paymentHistory.length > 0 ? (
                      <div className="space-y-2">
                        {paymentHistory
                          .filter(h => !searchTerm || h.label.includes(searchTerm) || h.legacyOperation?.includes(searchTerm))
                          .map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                                <HistoryIcon className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{formatDate(item.date)}</span>
                                  {item.isLegacy && (
                                    <Badge className="bg-slate-200 text-slate-600 text-[7px] font-black h-3.5 px-1">LEGACY</Badge>
                                  )}
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight text-slate-700 leading-tight">{item.label}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.type}</span>
                                {item.receiptNumber && (
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase">RECIBO #{item.receiptNumber}</span>
                                ) || item.legacyOperation && (
                                  <span className="text-[9px] font-bold text-blue-600 uppercase">OP {item.legacyOperation}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black tracking-tighter tabular-nums text-slate-800">
                                {formatCurrency(item.amount, "es-UY", item.currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-40 grayscale">
                        <HistoryIcon className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-black uppercase">Sin historial de pagos</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="pt-4">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Timeline de Eventos Operativos
                  </h3>
                  <ClientTimeline events={paymentHistory} loading={loadingHistory} />
                </div>
              </TabsContent>

              <TabsContent value="billing" className="pt-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="BUSCAR FACTURA O RECIBO..."
                    className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl px-10 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-all text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Repositorio de Comprobantes
                    </h3>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">DGI + INTERNO</Badge>
                  </div>

                  <ScrollArea className="h-[400px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/30 p-4">
                    <div className="space-y-2">
                      {/* Combine Invoices and Receipts for this view */}
                      {[
                        ...invoices.map(inv => ({ ...inv, docType: 'INVOICE', date: inv.fecha, label: inv.numeroFormateado, meta: `${inv.tipoDocumento} • ${inv.estadoDgi}` })),
                        ...paymentHistory.filter(h => h.receiptNumber).map(h => ({ ...h, docType: 'RECEIPT', date: h.date, label: `RECIBO #${h.receiptNumber}`, meta: h.label }))
                      ]
                        .filter(d => !searchTerm || d.label.includes(searchTerm) || d.meta.includes(searchTerm))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((doc, idx) => (
                          <div key={`doc-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-amber-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${doc.docType === 'INVOICE' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {doc.docType === 'INVOICE' ? <FileText className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{formatDate(doc.date)}</span>
                                <span className="text-xs font-black uppercase tracking-tight text-slate-700 leading-tight">{doc.label}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{doc.meta}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-amber-600 hover:bg-amber-50">
                              VER
                            </Button>
                          </div>
                      ))}

                      {invoices.length === 0 && paymentHistory.filter(h => h.receiptNumber).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                          <FileText className="w-12 h-12 mb-2" />
                          <p className="text-xs font-black uppercase">Sin documentos emitidos</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Secondary summary removed for isolation and cleanliness */}
            </Tabs>

            {/* Espaciador inferior para balancear el diseño */}
            <div className="h-6" />
          </div>
        </div>
      </DrawerContent>

      {/* Operational Modals */}
      <PaymentDialog 
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        installment={activePaymentData}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        isProcessing={isProcessingPayment}
        setIsProcessing={setIsProcessingPayment}
        setIsLoanFinishedModalOpen={setIsLoanFinishedModalOpen}
        setFinishedLoanData={setFinishedLoanData}
        onSuccess={handlePaymentSuccess}
      />

      <LoanFinishedDialog 
        isOpen={isLoanFinishedModalOpen}
        onOpenChange={setIsLoanFinishedModalOpen}
        data={finishedLoanData}
      />

      {selectedLoanForRefinance && (
        <RefinanceModal 
          isOpen={isRefinanceModalOpen}
          onClose={() => {
            setIsRefinanceModalOpen(false);
            setSelectedLoanForRefinance(null);
          }}
          loanId={selectedLoanForRefinance}
          onSuccess={() => {
            // Re-fetch loans after refinance
            if (client?.id) {
               getClientLoans(client.id).then(setClientLoans);
            }
          }}
        />
      )}
    </Drawer>
  );
}

function LoanCard({ loan, router }: { loan: LoanDTO, router: any }) {
  return (
    <div 
      className="p-3 rounded-xl bg-white border shadow-sm cursor-pointer hover:border-emerald-600/30 transition-all group"
      onClick={() => router.push(`/dashboard/loans?loanId=${loan.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 border-slate-200">
              {loan.isLegacy ? "LEGACY" : "SISTEMA NUEVO"}
            </Badge>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {loan.operationNumber ? `Operación ${loan.operationNumber}` : `Crédito ${loan.id.substring(0,8)}`}
          </span>
          <h4 className="text-sm font-black text-slate-800 tracking-tight">
            {formatCurrency(loan.outstandingBalance, "es-UY", "UYU")}
          </h4>
        </div>
        <Badge className={cn(
          "text-[9px] font-black",
          loan.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : 
          loan.status === "CLOSED" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"
        )}>
          {loan.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t pt-2 mt-2">
        <div className="flex items-center gap-1.5 text-[10px]">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">{formatDate(loan.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] justify-end">
          <HistoryIcon className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">{loan.termCount} Cuotas</span>
        </div>
      </div>
    </div>
  );
}
