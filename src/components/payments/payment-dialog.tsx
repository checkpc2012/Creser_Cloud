"use client";

import { useState } from "react";
import {
    CheckCircle2,
    Calculator,
    AlertCircle,
    X,
    ExternalLink
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, roundAmount } from "@/lib/utils";
import { useCurrency } from "@/store/currency-context";
import { processPayment } from "@/app/actions/payment-actions";
import { LoanDetailDrawer } from "../loans/loan-detail-drawer";

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    installment: any;
    paymentAmount: string;
    setPaymentAmount: (amount: string) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    setIsLoanFinishedModalOpen: (open: boolean) => void;
    setFinishedLoanData: (data: any) => void;
    onSuccess: () => void;
}

export function PaymentDialog({
    isOpen,
    onOpenChange,
    installment,
    paymentAmount,
    setPaymentAmount,
    isProcessing,
    setIsProcessing,
    setIsLoanFinishedModalOpen,
    setFinishedLoanData,
    onSuccess
}: PaymentDialogProps) {
    const { currency, exchangeRate } = useCurrency();
    const [confirmData, setConfirmData] = useState<{ amount: number; label: string; isTotalLiquidation: boolean } | null>(null);
    const [isLoanInfoOpen, setIsLoanInfoOpen] = useState(false);

    if (!installment) return null;

    const requestPayment = (exactAmount: number, label: string, isTotalLiquidation = false) => {
        if (isNaN(exactAmount) || exactAmount <= 0) {
            alert("Por favor ingrese un monto válido.");
            return;
        }
        setConfirmData({ amount: exactAmount, label, isTotalLiquidation });
    };

    const handlePayment = async () => {
        if (!confirmData) return;
        const { amount } = confirmData;
        const firstInstallment = installment.cuotasPendientes[0];

        setConfirmData(null);
        setIsProcessing(true);
        let amountToProcess = amount;

        const res = await processPayment({
            installmentId: firstInstallment.id,
            amount: amountToProcess,
            method: "CASH",
            notes: amountToProcess > (firstInstallment.monto || 0) ? "Pago múltiple o excedente aplicado" : ""
        });

        if (res.success) {
            if (res.loanFinished) {
                setFinishedLoanData(installment);
                setIsLoanFinishedModalOpen(true);
            } else {
                onSuccess();
            }
        } else {
            alert(res.error);
        }
        setIsProcessing(false);
    };

    const nextInstallment = installment.cuotasPendientes[0];
    const countPending = installment.cuotasPendientes.length;

    const displayConvert = (val: number) => {
        if (currency === 'USD') return val / exchangeRate;
        return val;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md border-t-4 border-t-emerald-500">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            Gestión de Entrega
                        </DialogTitle>
                        <DialogDescription className="flex items-center justify-between">
                            <span>Registra el pago para <span className="font-bold text-foreground">{installment.cliente}</span>.</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[9px] font-black uppercase text-blue-600 hover:bg-blue-50 px-2"
                                onClick={() => setIsLoanInfoOpen(true)}
                            >
                                <ExternalLink className="w-3 h-3 mr-1" /> Ver Registro
                            </Button>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="p-2 bg-muted/30 rounded-lg border flex flex-col justify-center">
                                <p className="font-bold text-muted-foreground uppercase opacity-70">Capital Inicial</p>
                                <p className="text-sm font-black">{formatCurrency(displayConvert(installment.capital), 'es-UY', currency)}</p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded-lg border flex flex-col justify-center text-center">
                                <p className="font-bold text-muted-foreground uppercase opacity-70">Cuotas en Mora/Pend.</p>
                                <p className="text-sm font-black">{countPending} cuotas</p>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-600/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Calculator className="w-12 h-12" />
                            </div>
                            <div className="flex justify-between items-center mb-1 relative z-10">
                                <span className="text-[10px] font-black text-emerald-400 uppercase">Total Deuda Acumulada</span>
                                <Badge className="bg-emerald-600 text-[9px]">{installment.id.substring(0, 8)}</Badge>
                            </div>
                            <p className="text-3xl font-black text-emerald-400 relative z-10">
                                {formatCurrency(displayConvert(installment.monto), 'es-UY', currency).replace('UYU', '$ UY').replace('USD', 'US$')}
                            </p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-bold text-emerald-400/70 uppercase">Desglose:</p>
                                {installment.cuotasPendientes.slice(0, 3).map((c: any) => (
                                    <div key={c.id} className="flex justify-between text-[11px] font-medium text-emerald-300 border-b border-emerald-600/30 pb-1">
                                        <span>Cuota #{c.num}</span>
                                        <span>{formatCurrency(displayConvert(c.monto), 'es-UY', currency).replace('UYU', '$ UY').replace('USD', 'US$')}</span>
                                    </div>
                                ))}
                                {countPending > 3 && <p className="text-[9px] text-center text-emerald-400/60 pt-1 italic">... y {countPending - 3} cuotas más</p>}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-[10px] bg-emerald-900/50 border-emerald-500 font-bold text-emerald-300 hover:bg-emerald-800/60 flex-1"
                                    onClick={() => requestPayment(nextInstallment.monto, `Cuota #${nextInstallment.num}`)}
                                    disabled={isProcessing}
                                >
                                    PAGAR SOLO CUOTA #{nextInstallment.num}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold flex-1 shadow-md shadow-rose-500/20"
                                    onClick={() => requestPayment(installment.monto, `Pago Total (${countPending} cuotas)`, true)}
                                    disabled={isProcessing}
                                >
                                    PAGO TOTAL (LIQUIDAR)
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
                                    className="pl-12 text-xl font-black h-14 border-2 focus:border-emerald-500 bg-background shadow-inner text-foreground"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            {parseFloat(paymentAmount) > nextInstallment.monto && (
                                <p className="text-[10px] text-blue-600 font-bold animate-pulse">
                                    🔔 ¡Atención! Se pagará la cuota #{nextInstallment.num} y el excedente se aplicará automáticamente a la deuda futura del préstamo.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="ghost" className="font-bold text-xs" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button
                            disabled={isProcessing || !paymentAmount}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 flex-1 shadow-lg shadow-emerald-500/20"
                            onClick={() => {
                                let amt = parseFloat(paymentAmount);
                                if (currency === 'USD') amt = amt * exchangeRate;
                                requestPayment(roundAmount(amt), `Entrega personalizada`);
                            }}
                        >
                            {isProcessing ? "Procesando..." : "REGISTRAR ENTREGA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <LoanDetailDrawer
                isOpen={isLoanInfoOpen}
                onOpenChange={setIsLoanInfoOpen}
                loanId={installment.loanId || installment.id}
            />

            <Dialog open={!!confirmData} onOpenChange={() => setConfirmData(null)}>
                <DialogContent className="sm:max-w-sm border-t-4 border-t-amber-500 rounded-3xl">
                    <DialogHeader>
                        <div className="mx-auto p-4 bg-amber-100 dark:bg-amber-900/30 rounded-3xl mb-2">
                            <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-black">Confirmar Pago</DialogTitle>
                        <DialogDescription className="text-center text-xs">
                            Verificá los datos antes de confirmar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-muted/40 rounded-xl border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Cliente</p>
                                <p className="text-xs font-black text-foreground leading-tight">{installment.cliente}</p>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-xl border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Concepto</p>
                                <p className="text-xs font-bold text-foreground leading-tight">{confirmData?.label}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-muted/40 rounded-xl border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Medio</p>
                                <p className="text-xs font-bold text-foreground">💵 Efectivo</p>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-xl border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Préstamo ID</p>
                                <p className="text-[9px] font-mono text-muted-foreground">{installment.id?.substring(0, 12)}...</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl text-center ${confirmData?.isTotalLiquidation ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                            <p className="text-white/80 text-[9px] font-black uppercase mb-1">Monto a Cobrar</p>
                            <p className="text-3xl font-black text-white italic">
                                {confirmData ? formatCurrency(displayConvert(confirmData.amount), 'es-UY', currency).replace('UYU', '$ UY').replace('USD', 'US$') : ''}
                            </p>
                            {confirmData?.isTotalLiquidation && (
                                <p className="text-white/70 text-[9px] font-bold mt-1 uppercase">Cancela la deuda total</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2">
                        <Button
                            className={`w-full font-black py-6 rounded-2xl text-sm shadow-lg ${confirmData?.isTotalLiquidation
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                } text-white`}
                            onClick={handlePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Procesando...' : '✓ CONFIRMAR PAGO'}
                        </Button>
                        <Button variant="ghost" className="w-full font-bold text-xs uppercase" onClick={() => setConfirmData(null)}>
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function LoanFinishedDialog({ isOpen, onOpenChange, data }: { isOpen: boolean; onOpenChange: (open: boolean) => void; data: any }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950 border-emerald-500 border-2">
                <div className="flex flex-col items-center text-center py-6 space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">¡PRESTAMO PAGADO!</DialogTitle>
                        <DialogDescription className="text-base font-medium text-muted-foreground dark:text-slate-300">
                            El crédito de <span className="font-bold text-foreground">{data?.cliente}</span> ha sido liquidado en su totalidad.
                        </DialogDescription>
                    </div>

                    <div className="w-full p-4 bg-background rounded-2xl border border-emerald-700/40 shadow-inner">
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">ID Préstamo</p>
                                <p className="font-bold text-sm tracking-tighter truncate">{data?.loanId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">Total Liquidado</p>
                                <p className="font-bold text-sm">{data?.currency} {data?.capital}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 text-lg shadow-xl shadow-emerald-500/20"
                        onClick={() => onOpenChange(false)}
                    >
                        LISTO
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
