"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    User,
    Clock,
    Printer,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    Calendar
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useCurrency } from "@/store/currency-context";
import { getLoanById, getLoanHistory } from "@/app/actions/loan-actions";
import Link from "next/link";

interface LoanInfoDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    loanId?: string;
    initialData?: any;
}

export function LoanInfoDialog({ isOpen, onOpenChange, loanId, initialData }: LoanInfoDialogProps) {
    const { currency, exchangeRate } = useCurrency();
    const [loan, setLoan] = useState<any>(initialData || null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && loanId) {
            const fetchData = async () => {
                setLoading(true);
                setLoadingHistory(true);

                // Fetch basic data if not provided
                if (!initialData) {
                    const data = await getLoanById(loanId);
                    setLoan(data);
                } else {
                    setLoan(initialData);
                }
                setLoading(false);

                // Fetch history
                const histData = await getLoanHistory(loanId);
                setHistory(histData);
                setLoadingHistory(false);
            };
            fetchData();
        }
    }, [isOpen, loanId, initialData]);

    const convert = (val: number) => {
        if (currency === 'USD') return val / exchangeRate;
        return val;
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden border-t-4 border-t-blue-600 max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-0 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Expediente de Préstamo</DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{loan?.id}</span>
                                {loan?.is_legacy && (
                                    <Badge variant="outline" className="h-4 text-[8px] bg-slate-100 text-slate-600 font-black">LEGACY: {loan.legacy_operacion}</Badge>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-xs font-bold text-muted-foreground uppercase animate-pulse">Cargando expediente...</p>
                        </div>
                    ) : !loan ? (
                        <div className="py-20 text-center">
                            <p className="text-sm font-bold text-rose-600">No se pudo cargar la información del préstamo.</p>
                        </div>
                    ) : (
                        <>
                            {/* Cliente Section */}
                            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-full border shadow-sm">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase">Titular del Crédito</p>
                                        <p className="font-bold leading-none">{loan.cliente}</p>
                                    </div>
                                </div>
                                <Link href={`/dashboard/clients?clientId=${loan.clientId}`}>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50">
                                        Ver Ficha <ExternalLink className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Core Financials */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Original Desembolsado</p>
                                    <p className="text-2xl font-black">{formatCurrency(convert(loan.monto || 0), 'es-UY', currency)}</p>
                                    {loan.current_balance !== undefined && (
                                        <p className="text-[10px] font-bold text-blue-600">Saldo Actual: {formatCurrency(convert(loan.current_balance), 'es-UY', currency)}</p>
                                    )}
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Tasa de Interés</p>
                                    <p className="text-2xl font-black">{loan.interestRate || loan.tasa || 25}% <span className="text-xs text-muted-foreground font-medium uppercase">TEA</span></p>
                                </div>
                            </div>

                            {/* History Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-xs font-black uppercase tracking-wider">Historial de Movimientos</h3>
                                </div>

                                <div className="border rounded-2xl overflow-hidden bg-background">
                                    {loadingHistory ? (
                                        <div className="p-8 text-center animate-pulse">
                                            <p className="text-[10px] font-bold text-muted-foreground grayscale italic">Sincronizando movimientos históricos...</p>
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground italic uppercase">No hay movimientos registrados</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y max-h-48 overflow-y-auto scrollbar-thin">
                                            {history.map((h, i) => (
                                                <div key={i} className="p-3 hover:bg-muted/30 transition-colors flex justify-between items-center bg-white">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black">{formatDate(h.date)}</span>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] h-4 px-1 font-black",
                                                                h.type === 'APLICACION' || h.type === 'CREDITO' || h.type === 'PAGO' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                                            )}>
                                                                {h.type}
                                                            </Badge>
                                                            {h.installmentNum && h.totalInstallments && (
                                                                <span className="text-[9px] font-black text-slate-500 uppercase italic">
                                                                    Cuota {h.installmentNum}/{h.totalInstallments}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5 capitalize">Ref: {h.reference}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black">{formatCurrency(convert(h.amount), 'es-UY', currency)}</p>
                                                        {h.mora > 0 && (
                                                            <p className="text-[9px] font-bold text-rose-600">+ {formatCurrency(convert(h.mora), 'es-UY', currency)} Mora</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Progreso del Contrato</span>
                                    </div>
                                    <span className="text-lg font-black text-blue-600">{loan.progreso}%</span>
                                </div>
                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden border">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                        style={{ width: `${loan.progreso}%` }}
                                    />
                                </div>
                            </div>

                            {/* Grid of Details */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-muted/40 rounded-xl border">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Cuotas</p>
                                    <p className="text-sm font-bold text-foreground">{loan.cuotas || loan.termMonths} meses</p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-xl border">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Aprobación</p>
                                    <p className="text-sm font-bold text-foreground">{formatDate(loan.fechaAprobacion || loan.startDate)}</p>
                                </div>
                            </div>

                            {/* Footer Badge */}
                            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-600 uppercase">
                                <ShieldCheck className="w-4 h-4" />
                                Información auditada por el sistema central
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-2 flex-shrink-0">
                    <Button variant="outline" className="flex-1 gap-2 text-xs font-bold" onClick={() => window.print()} disabled={loading}>
                        <Printer className="w-4 h-4" /> Imprimir
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white" onClick={() => onOpenChange(false)}>
                        Cerrar Expediente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
