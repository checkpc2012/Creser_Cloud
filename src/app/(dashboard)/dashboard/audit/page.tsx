"use client"

import { useState, useEffect } from "react"
import {
    ShieldAlert,
    History,
    Fingerprint,
    Search,
    ArrowUpDown,
    Filter,
    Eye,
    ArrowRight,
    User as UserIcon,
    MessageSquare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { VirtualTable } from "@/components/ui/virtual-table"
import { formatDate, cn } from "@/lib/utils"
import { getAuditLogs, getSecurityEvents } from "@/app/actions/audit-actions"

export default function AuditPage() {
    const [activeTab, setActiveTab] = useState<'AUDIT' | 'SECURITY'>('AUDIT')
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true)
            try {
                if (activeTab === 'AUDIT') {
                    const res = await getAuditLogs(page)
                    setLogs(res.logs)
                    setTotalPages(res.totalPages)
                } else {
                    const res = await getSecurityEvents(page)
                    setLogs(res.events)
                    setTotalPages(res.totalPages)
                }
            } catch (error) {
                console.error("Error loading logs:", error)
                setLogs([])
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [activeTab, page])

    // Reset page when switching tabs
    useEffect(() => {
        setPage(1)
    }, [activeTab])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <History className="w-8 h-8 text-primary" /> Centro de Control
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Trazabilidad total de operaciones y eventos de seguridad.
                    </p>
                </div>

                <div className="bg-muted/50 p-1.5 rounded-2xl flex gap-1">
                    <Button
                        variant={activeTab === 'AUDIT' ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab('AUDIT')}
                        className={cn(
                            "rounded-xl gap-2 font-black text-[10px] uppercase",
                            activeTab === 'AUDIT' ? "bg-primary text-white" : "hover:bg-primary/5 text-muted-foreground"
                        )}
                    >
                        <History className="w-3.5 h-3.5" /> Auditoría General
                    </Button>
                    <Button
                        variant={activeTab === 'SECURITY' ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab('SECURITY')}
                        className={cn(
                            "rounded-xl gap-2 font-black text-[10px] uppercase",
                            activeTab === 'SECURITY' ? "bg-rose-500 text-white hover:bg-rose-600" : "hover:bg-rose-50 text-muted-foreground"
                        )}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" /> Seguridad
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold tracking-tight italic">
                            Registros de {activeTab === 'AUDIT' ? 'Actividad' : 'Seguridad'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filtrar por usuario, acción..."
                                    className="pl-9 h-10 w-[250px] bg-background/50 border-none rounded-xl font-medium text-sm focus-visible:ring-primary/20"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-none bg-background/50 rounded-xl">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <VirtualTable
                        data={logs}
                        className="h-[600px] border-none"
                        rowHeight={60}
                        loading={loading}
                        columns={activeTab === 'AUDIT' ? [
                            // ... (keep columns same)
                            {
                                header: "Fecha",
                                width: "180px",
                                cell: (log) => (
                                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                        {formatDate(log.createdAt)}
                                    </span>
                                )
                            },
                            {
                                header: "Usuario",
                                width: "200px",
                                cell: (log) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs uppercase">{log.user.nombreCompleto}</span>
                                        <span className="text-[9px] font-black opacity-40">{log.user.rol}</span>
                                    </div>
                                )
                            },
                            {
                                header: "Acción",
                                width: "120px",
                                cell: (log) => (
                                    <Badge
                                        className={cn(
                                            "font-black text-[9px] uppercase border-none",
                                            log.action === 'CREATE' ? "bg-emerald-500/10 text-emerald-600" :
                                                log.action === 'DELETE' ? "bg-rose-500/10 text-rose-600" :
                                                    "bg-blue-500/10 text-blue-600"
                                        )}
                                    >
                                        {log.action}
                                    </Badge>
                                )
                            },
                            {
                                header: "Entidad",
                                cell: (log) => (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">{log.entityType}</span>
                                        <Badge variant="outline" className="text-[10px] font-mono tracking-tighter opacity-50">
                                            {log.entityId}
                                        </Badge>
                                    </div>
                                )
                            },
                            {
                                header: "",
                                width: "60px",
                                cell: (log) => (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-lg">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                )
                            }
                        ] : [
                            {
                                header: "Severidad",
                                width: "120px",
                                cell: (log) => (
                                    <Badge
                                        className={cn(
                                            "font-black text-[9px] uppercase border-none",
                                            log.severity === 'CRITICAL' ? "bg-rose-600 text-white" :
                                                log.severity === 'HIGH' ? "bg-rose-500/10 text-rose-600" :
                                                    "bg-blue-500/10 text-blue-600"
                                        )}
                                    >
                                        {log.severity}
                                    </Badge>
                                )
                            },
                            {
                                header: "Evento",
                                cell: (log) => (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{log.type}</span>
                                        <span className="text-xs font-bold text-muted-foreground italic truncate max-w-[400px]">
                                            {log.description}
                                        </span>
                                    </div>
                                )
                            },
                            {
                                header: "Fecha",
                                width: "180px",
                                cell: (log) => (
                                    <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                        {formatDate(log.createdAt)}
                                    </span>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
