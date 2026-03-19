"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface UrgencyBoardProps {
    stats: {
        pendingApprovals: number
        overdueCount: number
        rateStatus: "OK" | "OUTDATED" | "ERROR"
    }
    highRiskMora: any[]
}

export function UrgencyBoard({ stats, highRiskMora }: UrgencyBoardProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Pending Approvals */}
            <Card className={cn(
                "border-l-4 shadow-sm transition-all hover:shadow-md",
                stats.pendingApprovals > 0 ? "border-l-amber-500" : "border-l-slate-200"
            )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Aprobaciones Pendientes
                    </CardTitle>
                    <Clock className={cn("h-4 w-4", stats.pendingApprovals > 0 ? "text-amber-500" : "text-muted-foreground")} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{stats.pendingApprovals}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {stats.pendingApprovals > 0 ? "Requieren acción inmediata de gerencia" : "Todo al día"}
                    </p>
                </CardContent>
            </Card>

            {/* Exchange Rate Status */}
            <Card className={cn(
                "border-l-4 shadow-sm transition-all hover:shadow-md",
                stats.rateStatus === "OK" ? "border-l-emerald-500" : "border-l-rose-500"
            )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Cotización USD
                    </CardTitle>
                    {stats.rateStatus === "OK" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">
                        {stats.rateStatus === "OK" ? "ACTUALIZADA" : "DESACTUALIZADA"}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {stats.rateStatus === "OK" ? "Sincronizado con BCU" : "Sincronización requerida"}
                    </p>
                </CardContent>
            </Card>

            {/* High Risk Delinquency */}
            <Card className={cn(
                "border-l-4 shadow-sm transition-all hover:shadow-md",
                highRiskMora.length > 0 ? "border-l-rose-600" : "border-l-slate-200"
            )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Riesgo Crítico
                    </CardTitle>
                    <AlertCircle className={cn("h-4 w-4", highRiskMora.length > 0 ? "text-rose-600" : "text-muted-foreground")} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{highRiskMora.length}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {highRiskMora.length > 0 ? "Préstamos con >30 días de mora" : "Sin casos críticos hoy"}
                    </p>
                </CardContent>
            </Card>

            {/* List of High Risk (Full width below) */}
            {highRiskMora.length > 0 && (
                <div className="md:col-span-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-lg p-4">
                    <h4 className="text-[10px] font-black uppercase text-rose-600 mb-3 tracking-widest">Atención Prioritaria</h4>
                    <div className="flex flex-wrap gap-2">
                        {highRiskMora.map(m => (
                            <Badge key={m.loanId} variant="outline" className="bg-white dark:bg-slate-900 border-rose-200 text-rose-700 h-8 gap-2">
                                <span className="font-black">{m.cliente}</span>
                                <span className="text-[10px] opacity-70">({m.maxDias}d)</span>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
