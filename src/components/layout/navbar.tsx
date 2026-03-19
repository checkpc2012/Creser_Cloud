
"use client";

import { Search, Menu, LogOut, Shield, Settings, RefreshCw, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/store/search-context";
import { useCurrency } from "@/store/currency-context";
import { useAuth } from "@/store/auth-context";
import { useEffect, useState } from "react";
import { getLogout } from "@/app/actions/auth-actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const { currency, setCurrency, rates, bank, setBank, isLoading: isRateLoading, trend, refreshRates } = useCurrency();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await getLogout();
    logout();
  };

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      if (!pathname.startsWith('/dashboard/clients')) {
        router.push('/dashboard/clients');
      }
    }
  };

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Fecha y Hora */}
        <div className="hidden md:flex flex-col items-start justify-center min-w-[130px]">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">
            {currentTime ? currentTime.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '') : '-'}
          </span>
          <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none mt-0.5">
            {currentTime ? currentTime.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
          </span>
        </div>


        <div className="relative w-full hidden xs:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 p-1">
          <button
            onClick={() => setCurrency('UYU')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black transition-all ${currency === 'UYU' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/80 dark:hover:bg-slate-700/80'}`}
            title="Pesos Uruguayos"
          >
            $
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black tracking-tighter transition-all ${currency === 'USD' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/80 dark:hover:bg-slate-700/80'}`}
            title="Dólares"
          >
            US$
          </button>
        </div>

        {/* Bank Rate Indicator */}
        <div className="hidden lg:flex flex-col text-[10px] leading-none text-slate-500 justify-center min-w-[120px] bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                 <span className="font-bold opacity-60 uppercase text-[8px]">Cotización</span>
                 <button 
                  onClick={() => setBank(bank === 'BCU' ? 'BROU' : 'BCU')}
                  className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors bg-emerald-500/10 px-1 rounded-md uppercase text-[9px]"
                  title="Cambiar entre BCU y BROU"
                >
                  {bank}
                </button>
              </div>
              <div className="flex items-center gap-1">
                 <button 
                  onClick={() => refreshRates()} 
                  className={cn("p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-all", isRateLoading && "animate-spin")}
                  title="Actualizar cotización ahora"
                 >
                    <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                 </button>
                 <a 
                  href={bank === 'BCU' ? "https://www.bcu.gub.uy/Estadisticas-e-Indicadores/Paginas/Cotizaciones.aspx" : "https://www.brou.com.uy/cotizaciones"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                  title={`Ver cotizaciones oficiales del ${bank}`}
                >
                  <Info className="w-3 h-3" />
                </a>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[7px] uppercase opacity-50 font-black mb-0.5">Compra</span>
                <span className="font-black text-slate-700 dark:text-slate-300 text-[11px] tabular-nums">
                  {isRateLoading ? "..." : rates[bank].buy.toFixed(2)}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[7px] uppercase opacity-50 font-black mb-0.5 flex items-center gap-0.5">
                  Venta 
                  {!isRateLoading && trend === 'up' && <TrendingUp className="w-2 h-2 text-rose-500" />}
                  {!isRateLoading && trend === 'down' && <TrendingDown className="w-2 h-2 text-emerald-500" />}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">
                  {isRateLoading ? "..." : rates[bank].sell.toFixed(2)}
                </span>
              </div>
           </div>
        </div>


        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter leading-none mb-1">
                {user?.name || "Cargando..."}
            </p>
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                {user?.role === 'EMPLOYEE' ? 'Empleado' : 
                 user?.role === 'ADMIN' ? 'Administrador' : 
                 user?.role === 'MANAGER' ? 'Gerente' : 
                 user?.role === 'OWNER' ? 'Dueño/a' : 
                 user?.role || "Staff"}
            </p>
          </div>
          
          <div className="relative group/user">
             {/* Trigger con Shield Icon */}
             <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10 cursor-pointer group-hover/user:border-emerald-500 transition-all">
                <Shield className="w-5 h-5 text-emerald-500" />
             </div>
             
             {/* Dropdown Menu - Sin gap para evitar cierre temprano */}
             <div className="absolute top-10 right-0 pt-4 hidden group-hover/user:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-emerald-500/10">
                   <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">
                         {user?.role === 'EMPLOYEE' ? 'Empleado' : 
                          user?.role === 'ADMIN' ? 'Administrador' : 
                          user?.role === 'MANAGER' ? 'Gerente' : 
                          user?.role === 'OWNER' ? 'Dueño/a' : 
                          user?.role || "Personal"}
                      </p>
                      <p className="text-xs font-black text-emerald-400 truncate uppercase">{user?.name || "Usuario"}</p>
                      <p className="text-[9px] text-emerald-500/70 font-bold mt-1 uppercase flex items-center gap-1">
                         <span className="w-1 h-1 bg-emerald-950/20 dark:bg-emerald-950/300 rounded-full animate-pulse" />
                         {user?.activeBranchName || user?.branch || "Sucursal Central"}
                      </p>
                   </div>
                   
                   {/* OPCIONES */}
                   <div className="py-1">
                      <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
                         <Settings className="w-4 h-4 text-emerald-500" />
                         Configuración
                      </Link>
                      
                      <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-rose-500 hover:text-rose-400 hover:bg-rose-900/20 dark:bg-rose-900/300/10 transition-all uppercase tracking-widest border-t border-white/5"
                      >
                         <LogOut className="w-4 h-4" />
                         Cerrar Sesión
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
