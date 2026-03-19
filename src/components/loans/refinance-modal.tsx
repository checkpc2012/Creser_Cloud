"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, RefreshCcw, ShieldCheck, Wallet, Calculator, Table, Info } from "lucide-react";
import { getRefinanceSummary, refinanceLoan, simulateLoanPlan, getSession } from "@/app/actions/loan-actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RefinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  onSuccess?: () => void;
}

export function RefinanceModal({ isOpen, onClose, loanId, onSuccess }: RefinanceModalProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newCash, setNewCash] = useState(0);
  const [termCount, setTermCount] = useState(12);
  const [annualRate, setAnnualRate] = useState(60);
  const [amortizationSystem, setAmortizationSystem] = useState<'FRENCH' | 'DIRECT'>('FRENCH');
  const [reason, setReason] = useState("");
  const [simulation, setSimulation] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && loanId) {
      loadSummary();
      loadRole();
    }
  }, [isOpen, loanId]);

  async function loadRole() {
    const session = await getSession();
    if (session) setUserRole(session.user.rol);
  }

  useEffect(() => {
    if (summary) {
      handleSimulate();
    }
  }, [newCash, termCount, annualRate, amortizationSystem, summary]);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await getRefinanceSummary(loanId);
      setSummary(res);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos de refinanciación");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    if (!summary) return;
    setSimulating(true);
    try {
      const res = await simulateLoanPlan({
        principalAmount: summary.totalPending + newCash,
        annualRate,
        termCount,
        amortizationSystem,
      });
      setSimulation(res);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setSimulating(false);
    }
  }

  const totalToRefinance = summary ? summary.totalPending + newCash : 0;

  async function handleConfirm() {
    setProcessing(true);
    try {
      const res = await refinanceLoan({
        originalLoanId: loanId,
        newPrincipalAmount: totalToRefinance,
        termCount: termCount,
        annualRate: annualRate,
        amortizationSystem: amortizationSystem,
        newReason: reason
      });

      if (res.success) {
        toast.success("Refinanciación completada con éxito");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Error al procesar refinanciación");
      }
    } catch (error) {
      toast.error("Error técnico al refinanciar");
    } finally {
      setProcessing(false);
    }
  }

  if (loading && isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <RefreshCcw className="w-24 h-24 text-emerald-500 animate-spin-slow" />
          </div>
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
            Simulador de <span className="text-emerald-500">Refinanciación</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Consolidación y absorción de saldos operativos
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 bg-white">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Deuda Absorbida</p>
              <p className="text-xl font-black tracking-tighter text-slate-900">
                {summary ? formatCurrency(summary.totalPending) : "$ 0"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Total Nuevo Capital</p>
              <p className="text-xl font-black tracking-tighter text-emerald-700">
                {formatCurrency(totalToRefinance)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dinero Nuevo al Cliente (Efectivo)</Label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={newCash} 
                    onChange={(e) => setNewCash(Number(e.target.value))}
                    className="h-14 pl-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 bg-slate-50 font-black text-lg transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nuevo Plazo (Cuotas)</Label>
                   <Input 
                     type="number" 
                     value={termCount} 
                     onChange={(e) => setTermCount(Number(e.target.value))}
                     className="h-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 bg-slate-50 font-black"
                   />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tasa Anual (%)</Label>
                   <Input 
                     type="number" 
                     value={annualRate} 
                     disabled={userRole === 'AGENT'}
                     onChange={(e) => setAnnualRate(Number(e.target.value))}
                     className="h-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 bg-slate-50 font-black disabled:opacity-50"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sistema de Amortización</Label>
                   <Select 
                    value={amortizationSystem} 
                    disabled={userRole === 'AGENT'}
                    onValueChange={(v: any) => setAmortizationSystem(v)}
                   >
                     <SelectTrigger className="h-12 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black disabled:opacity-50">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="FRENCH">Sistema Francés</SelectItem>
                       <SelectItem value="DIRECT">Sistema Directo</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Motivo de Operación</Label>
                   <Input 
                     value={reason} 
                     onChange={(e) => setReason(e.target.value)}
                     className="h-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 bg-slate-50 font-black text-[11px] uppercase"
                     placeholder="EJ: DIFICULTAD DE PAGO"
                   />
                 </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-100 flex gap-4">
                 <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                   IMPORTANTE: Al confirmar, el préstamo <span className="font-black">{summary?.operationNumber}</span> se cerrará permanentemente.
                 </p>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Proyección de Cuotas
                </h3>
                {simulation && (
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase transition-all ${simulating ? 'opacity-30' : 'opacity-100 bg-emerald-100 text-emerald-600'}`}>
                    {simulating ? 'Recalculando...' : `${simulation.metadata.totalAmount.toLocaleString('es-UY', { style: 'currency', currency: 'UYU' })} Total`}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 h-[300px] border border-slate-200 rounded-2xl bg-white overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-slate-100 font-black uppercase text-[9px] text-slate-500">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Vencimiento</th>
                      <th className="p-3 text-right">Cuota</th>
                      <th className="p-3 text-right">Capital</th>
                      <th className="p-3 text-right">Interés</th>
                      <th className="p-3 text-right">IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation?.installments.map((inst: any) => (
                      <tr key={inst.number} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-400">{inst.number}</td>
                        <td className="p-3 font-semibold text-slate-600">
                          {new Date(inst.dueDate).toLocaleDateString('es-UY')}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">{formatCurrency(inst.totalAmount)}</td>
                        <td className="p-3 text-right font-medium text-slate-500">{formatCurrency(inst.principalAmount)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(inst.interestAmount)}</td>
                        <td className="p-3 text-right font-medium text-amber-600">{formatCurrency(inst.taxAmount)}</td>
                      </tr>
                    ))}
                    {!simulation && !simulating && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center font-bold text-slate-300 italic uppercase">
                          Ajuste los parámetros para simular
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
              
              {simulation && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[8px] font-black uppercase text-slate-400">Total Intereses</p>
                        <p className="text-xs font-black">{formatCurrency(simulation.metadata.totalInterest)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="text-[8px] font-black uppercase text-slate-400">Total IVA (22%)</p>
                        <p className="text-xs font-black">{formatCurrency(simulation.metadata.totalTax)}</p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
           <Button variant="ghost" onClick={onClose} className="font-black uppercase text-[10px] tracking-widest text-slate-400">
             Cancelar
           </Button>
            <Button 
             onClick={handleConfirm}
             disabled={processing || simulating || !simulation}
             className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
            >
             {processing ? (
               <RefreshCcw className="w-4 h-4 animate-spin" />
             ) : (
               <>
                 Confirmar Refinanciación <ArrowRight className="w-4 h-4" />
               </>
             )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
