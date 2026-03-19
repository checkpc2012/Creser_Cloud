
"use client";

import { useActionState, useState } from "react";
import { changePasswordAction } from "@/app/actions/auth-actions";
import { KeyRound, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChangePasswordFormProps {
  userId: string;
}

export function ChangePasswordForm({ userId }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-6 text-left pt-6">
      <input type="hidden" name="userId" value={userId} />
      
      {state?.error && (
        <div className="p-4 rounded-2xl bg-rose-900/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4" />
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5 group">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Actual</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500" />
            <input 
              name="currentPassword"
              type="password"
              required
              className="w-full pl-12 pr-4 h-14 bg-muted/40 border-2 border-border focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm text-foreground"
              placeholder="Contraseña actual"
            />
          </div>
        </div>

        <div className="space-y-1.5 group">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña</label>
          <div className="relative">
            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500" />
            <input 
              name="newPassword"
              type="password"
              required
              className="w-full pl-12 pr-4 h-14 bg-muted/40 border-2 border-border focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm text-foreground"
              placeholder="8+ Caracteres, 1 Mayúscula"
            />
          </div>
        </div>

        <div className="space-y-1.5 group">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirmar Nueva Contraseña</label>
          <div className="relative">
            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500" />
            <input 
              name="confirmPassword"
              type="password"
              required
              className="w-full pl-12 pr-4 h-14 bg-muted/40 border-2 border-border focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm text-foreground"
              placeholder="Repita la nueva contraseña"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isPending}
          className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 px-8"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ACTUALIZANDO...</span>
            </div>
          ) : (
            "ACTUALIZAR Y ENTRAR"
          )}
        </Button>
      </div>
    </form>
  );
}
