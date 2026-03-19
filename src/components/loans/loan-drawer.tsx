"use client"

import * as React from "react"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer"
import { LoanForm } from "./loan-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface LoanDrawerProps {
    clientId?: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function LoanDrawer({ clientId, trigger, open, onOpenChange }: LoanDrawerProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = open !== undefined

    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            {trigger ? (
                <DrawerTrigger asChild>
                    {trigger}
                </DrawerTrigger>
            ) : (
                <DrawerTrigger asChild>
                    <Button size="sm" className="h-11 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase text-xs rounded-2xl px-6">
                        <Plus className="w-4 h-4" /> Nuevo Préstamo
                    </Button>
                </DrawerTrigger>
            )}
            <DrawerContent className="max-w-4xl mx-auto">
                <div className="mx-auto w-full max-w-4xl overflow-y-auto max-h-[90vh]">
                    <DrawerHeader className="border-b px-6">
                        <DrawerTitle className="text-2xl font-black uppercase tracking-tighter italic">
                            Formalización de Crédito
                        </DrawerTitle>
                        <DrawerDescription className="text-xs font-medium uppercase tracking-widest opacity-60">
                            Complete los parámetros para la originación del nuevo préstamo.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-6">
                        <LoanForm
                            initialClientId={clientId}
                            onCancel={() => setIsOpen?.(false)}
                            onSuccess={(id) => {
                                setIsOpen?.(false)
                                // Optional: redirect or show success toast
                            }}
                        />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
