"use client";

import { useActionState, useEffect } from "react";
import { authenticate } from "@/app/actions/auth-actions";
import { 
  ShieldCheck, 
  User, 
  Lock, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-950/20 dark:bg-emerald-950/300/30">
      
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-slate-900 relative overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full">
           <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-emerald-950/20 dark:bg-emerald-950/300/20 rounded-full blur-[100px] animate-pulse" />
           <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-900/20 dark:bg-blue-900/300/10 rounded-full blur-[120px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
           </div>
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md px-8">
           <div className="inline-flex p-4 rounded-3xl bg-emerald-950/20 dark:bg-emerald-950/300/10 border border-emerald-500/20 backdrop-blur-md mb-4 group hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-12 h-12 text-emerald-400 group-hover:rotate-12 transition-transform" />
           </div>
           
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter leading-none italic">
                SISTEMA DE GESTIÓN <br/>
                <span className="text-emerald-400">CRESER FINANCE</span>
              </h2>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest leading-relaxed">
                Control de Cartera, Cobranzas y <br/> Estructura Corporativa Profesional.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="p-4 rounded-2xl bg-background/5 border border-white/10 backdrop-blur-sm text-left group hover:bg-background/10 transition-colors">
                 <TrendingUp className="w-6 h-6 text-emerald-400 mb-2" />
                 <p className="text-white font-black text-xs uppercase">Eficiencia</p>
                 <p className="text-[10px] text-muted-foreground font-bold">Optimización de procesos operativos.</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/5 border border-white/10 backdrop-blur-sm text-left group hover:bg-background/10 transition-colors">
                 <LayoutDashboard className="w-6 h-6 text-blue-400 mb-2" />
                 <p className="text-white font-black text-xs uppercase">Inteligencia</p>
                 <p className="text-[10px] text-muted-foreground font-bold">Análisis de datos en tiempo real.</p>
              </div>
           </div>
        </div>

        <div className="absolute bottom-10 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
          Uruguay - 2025 ®
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle Decorative Circle */}
        <div className="lg:hidden absolute -top-24 -right-24 w-64 h-64 bg-emerald-950/20 dark:bg-emerald-950/300/10 rounded-full blur-[80px]" />
        
        <div className="w-full max-w-sm space-y-10 relative z-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="bg-background border border-slate-100 p-4 rounded-[2rem] shadow-xl shadow-slate-200/50">
                 <Image 
                    src="/logo-creser.png" 
                    alt="Creser Finance" 
                    width={180} 
                    height={90} 
                    className="object-contain dark:[filter:invert(1)_hue-rotate(180deg)]"
                  />
              </div>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Acceso Personal</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Ingrese sus credenciales de Staff</p>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
               <div className="p-4 rounded-2xl bg-rose-900/20 dark:bg-rose-900/30 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  {state.error}
               </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors">Usuario Corporativo</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors">
                      <User className="w-4 h-4" />
                   </div>
                   <input 
                    name="usuario"
                    type="text"
                    required
                    placeholder="Usuario"
                    className="w-full pl-12 pr-4 h-14 bg-background border-2 border-border focus:border-emerald-500 dark:focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm shadow-sm text-foreground"
                   />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors">Contraseña de acceso</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors">
                      <Lock className="w-4 h-4" />
                   </div>
                   <input 
                    name="password"
                    type="password"
                    required
                    placeholder="Contraseña"
                    className="w-full pl-12 pr-4 h-14 bg-background border-2 border-border focus:border-emerald-500 dark:focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm shadow-sm text-foreground"
                   />

                </div>
              </div>
            </div>

            <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-emerald-500/20 group transition-all"
            >
              {isPending ? (
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   INICIAR SESIÓN
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="pt-6 text-center">
             <p className="text-[10px] text-muted-foreground font-bold uppercase italic">
                En caso de olvido, contacte al Administrador de Sistemas.
             </p>
          </div>
        </div>
      </div>

    </div>
  );
}
