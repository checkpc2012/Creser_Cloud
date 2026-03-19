"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    ShieldCheck,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ArrowRight,
    User as UserIcon,
    MessageSquare
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, cn } from "@/lib/utils"
// We would create server actions in approvals-actions.ts
// import { getApprovals, approveRequest, rejectRequest } from "@/app/actions/approval-actions"

export default function ApprovalsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center animate-pulse">
                <ShieldCheck className="w-10 h-10 text-amber-500" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tighter">Centro de Aprobaciones</h1>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    Este módulo está pendiente de integración con el motor de flujos de aprobación en PostgreSQL.
                </p>
                <Badge variant="outline" className="mt-4 uppercase font-black text-[10px] border-amber-200 text-amber-600 bg-amber-50/50">
                    Estado: Pendiente (Backend Not Ready)
                </Badge>
            </div>
            
            <Button variant="outline" className="rounded-2xl font-bold">
                <Link href="/dashboard">Volver al Dashboard</Link>
            </Button>
        </div>
    )
}
