"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import {
    Calculator,
    Save,
    Calendar as CalendarIcon,
    User,
    Search,
    Plus,
    ShieldCheck,
    Tag,
    X,
    CreditCard,
    DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, roundAmount } from "@/lib/utils"
import { getClients } from "@/app/actions/client-actions"
import { getPromotionByCode } from "@/app/actions/promotion-actions"
import { FinanceUtils } from "@/lib/finance"

interface LoanFormProps {
    initialClientId?: string
    onSuccess?: (loanId: string) => void
    onCancel?: () => void
}

export function LoanForm({ initialClientId, onSuccess, onCancel }: LoanFormProps) {
    const [formData, setFormData] = useState({
        clientId: initialClientId || "",
        guarantorId: "",
        currency: "UYU",
        loanType: "Amortizable",
        amount: 1000,
        interestRate: 5,
        termMonths: 12,
        startDate: new Date().toISOString().split('T')[0],
    })

    const [clientsList, setClientsList] = useState<any[]>([])
    const [clientSearch, setClientSearch] = useState("")
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [appliedPromo, setAppliedPromo] = useState<any | null>(null)
    const [promoCode, setPromoCode] = useState("")

    useEffect(() => {
        async function load() {
            const data = await getClients()
            const list = Array.isArray(data) ? data : (data as any).clients ?? []
            setClientsList(list)

            if (initialClientId) {
                const c = list.find((cl: any) => cl.id === initialClientId)
                if (c) setClientSearch(c.nombreCompleto)
            }
        }
        load()
    }, [initialClientId])

    const calculations = useMemo(() => {
        let rate = formData.interestRate
        if (appliedPromo) {
            rate = rate * (1 - (appliedPromo.discount / 100))
        }

        return {
            monthlyPayment: FinanceUtils.calculateFrenchInstallment(
                formData.amount,
                rate,
                formData.termMonths
            ),
            totalToPay: 0, // We could calculate this too or let utils do it
            totalInterest: 0,
            iva: 0
        }
    }, [formData, appliedPromo])

    // Simple filtering for now
    const filteredClients = clientsList.filter(c =>
        c.nombreCompleto.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.documento.includes(clientSearch)
    ).slice(0, 5)

    const handleApplyPromo = async () => {
        if (!promoCode) return
        const res = await getPromotionByCode(promoCode.toUpperCase())
        if (res.success && res.data) {
            setAppliedPromo(res.data)
        } else {
            setAppliedPromo(null)
        }
    }

    return (
        <div className="space-y-6 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Selection */}
                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-black uppercase text-muted-foreground mb-1.5 block px-1">
                            Beneficiario del Crédito
                        </label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50 transition-opacity group-focus-within:opacity-100" />
                            <Input
                                placeholder="Buscar cliente por CI o Nombre..."
                                value={clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value)
                                    setIsClientDropdownOpen(true)
                                }}
                                className="pl-10 h-12 rounded-2xl border-muted bg-muted/20 focus:bg-background transition-all"
                            />
                            {isClientDropdownOpen && clientSearch && (
                                <div className="absolute top-14 left-0 w-full bg-popover border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                    {filteredClients.map(c => (
                                        <div
                                            key={c.id}
                                            className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                                            onClick={() => {
                                                setFormData({ ...formData, clientId: c.id })
                                                setClientSearch(c.nombreCompleto)
                                                setIsClientDropdownOpen(false)
                                            }}
                                        >
                                            <div>
                                                <p className="text-sm font-bold">{c.nombreCompleto}</p>
                                                <p className="text-[10px] opacity-60 font-mono">{c.documento}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">
                                                SELECCIONAR
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block px-1">Moneda</label>
                            <div className="flex bg-muted/30 p-1 rounded-xl border h-10">
                                <button
                                    type="button"
                                    className={cn("flex-1 rounded-lg text-[10px] font-black transition-all", formData.currency === 'UYU' ? 'bg-background shadow text-primary' : 'opacity-50')}
                                    onClick={() => setFormData({ ...formData, currency: 'UYU' })}
                                >
                                    PESOS ($)
                                </button>
                                <button
                                    type="button"
                                    className={cn("flex-1 rounded-lg text-[10px] font-black transition-all", formData.currency === 'USD' ? 'bg-background shadow text-primary' : 'opacity-50')}
                                    onClick={() => setFormData({ ...formData, currency: 'USD' })}
                                >
                                    DÓLARES (U$S)
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block px-1">Importe</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    className="pl-8 h-10 rounded-xl bg-muted/10 font-black text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calculation Summary */}
                <Card className="bg-primary/5 border-primary/10 shadow-none overflow-hidden h-full">
                    <div className="p-4 bg-primary/10 border-b flex justify-between items-center">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Liquidación Estimada</span>
                        <Calculator className="h-4 w-4 text-primary opacity-50" />
                    </div>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Cuota Mensual</p>
                                <p className="text-4xl font-black text-primary tracking-tighter">
                                    {formatCurrency(calculations.monthlyPayment, 'es-UY', formData.currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Plazo</p>
                                <p className="text-lg font-black">{formData.termMonths} meses</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-primary/20">
                            <div>
                                <p className="text-[9px] font-bold opacity-50 uppercase">Tasa Anual</p>
                                <p className="text-xs font-black">{formData.interestRate}% {appliedPromo && <span className="text-emerald-500 font-black">(-{appliedPromo.discount}%)</span>}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold opacity-50 uppercase">Total a Devolver</p>
                                <p className="text-xs font-black">{formatCurrency(calculations.totalToPay, 'es-UY', formData.currency)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground block px-1">Plazo (Meses)</label>
                    <Input
                        type="number"
                        value={formData.termMonths}
                        onChange={(e) => setFormData({ ...formData, termMonths: Number(e.target.value) })}
                        className="h-10 rounded-xl bg-muted/10 font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground block px-1">Tasa Interés (%)</label>
                    <Input
                        type="number"
                        step="0.1"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                        className="h-10 rounded-xl bg-muted/10 font-bold text-amber-600"
                    />
                </div>
                <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground block px-1">Código Promocional</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                            <Input
                                placeholder="HOLA2024..."
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="pl-9 h-10 rounded-xl bg-muted/10 font-black tracking-widest uppercase"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 font-black text-[10px]"
                            onClick={handleApplyPromo}
                        >
                            APLICAR
                        </Button>
                    </div>
                </div>
            </div>

            <div className="pt-6 flex gap-4">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-muted-foreground"
                >
                    Cancelar
                </Button>
                <Button
                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
                    disabled={!formData.clientId || isLoading}
                >
                    <Save className="h-5 w-5" />
                    Confirmar Préstamo
                </Button>
            </div>
        </div>
    )
}
