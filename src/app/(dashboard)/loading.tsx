"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        
        {/* Loading Spinner */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeDasharray="283"
                strokeDashoffset="283"
                className="animate-[progress_2s_ease-in-out_infinite] origin-center"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground animate-pulse">
              Preparando Entorno
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
              Cargando servicios y sucursal...
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { stroke-dashoffset: 283; transform: rotate(0deg); }
          50% { stroke-dashoffset: 70; transform: rotate(180deg); }
          100% { stroke-dashoffset: 283; transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
