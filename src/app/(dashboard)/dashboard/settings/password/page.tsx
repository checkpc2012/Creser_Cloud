
import { getLogout } from "@/app/actions/auth-actions";
import { getSession } from "@/lib/auth";
import { Lock, ShieldAlert, KeyRound, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function MustChangePasswordPage() {
  const sessionData = await getSession();
  const userId = sessionData?.user?.id;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background border border-emerald-700/40/30 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 relative overflow-hidden">
        
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <ShieldAlert className="w-48 h-48" />
        </div>

        <div className="text-center space-y-6 relative z-10">
          <div className="inline-flex p-5 bg-amber-100 dark:bg-amber-900/30 rounded-3xl mb-4 group hover:rotate-12 transition-transform duration-500">
             <Lock className="w-10 h-10 text-amber-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tighter italic">CAMBIO OBLIGATORIO</h1>
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] bg-amber-900/20 dark:bg-amber-900/30 dark:bg-amber-900/20 py-1 rounded-full px-4 inline-block">
              Seguridad de acceso Cre-ser
            </p>
          </div>

          <p className="text-sm font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Por política de seguridad de la empresa, es necesario que actualice su contraseña inicial para poder operar el sistema.
          </p>

          <ChangePasswordForm userId={userId || ""} />

          <form action={getLogout}>
             <Button variant="ghost" className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 mx-auto hover:text-rose-600">
               <LogOut className="w-3 h-3" /> Cerrar Sesión
             </Button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-12 p-4 bg-muted/40 border border-border rounded-[1.5rem] flex items-start gap-3">
           <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
           <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
             Importante: Una vez cambiada la clave, el sistema le permitirá acceder a todas las funciones correspondientes a su nivel de jerarquía.
           </p>
        </div>
      </div>
    </div>
  );
}
