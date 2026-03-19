"use client";

import { HistoricalEventDTO } from "@/types/dtos";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  RefreshCcw, 
  AlertCircle,
  TrendingUp,
  Receipt
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientTimelineProps {
  events: HistoricalEventDTO[];
  loading?: boolean;
}

export function ClientTimeline({ events, loading }: ClientTimelineProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Clock className="w-10 h-10 text-slate-200 mb-2" />
        <p className="text-[10px] font-black uppercase text-slate-300">Cargando Historia...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale">
        <Clock className="w-10 h-10 mb-2" />
        <p className="text-[10px] font-black uppercase">Sin eventos registrados</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
        {events.map((event, idx) => {
          const isRefinance = event.eventType === 'TERM_REFINANCE' || event.type === 'REFINANCE';
          const isFinish = event.eventType === 'LOAN_FINISHED' || event.type === 'FINISHED';
          const isPayment = event.eventType === 'INSTALLMENT_PAYMENT' || event.receiptNumber;

          return (
            <div key={event.id || idx} className="relative">
              {/* Dot */}
              <div className={cn(
                "absolute -left-[27px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10",
                isRefinance ? "bg-emerald-500" : 
                isFinish ? "bg-slate-900" : 
                isPayment ? "bg-blue-500" : "bg-slate-300"
              )}>
                {isRefinance ? <RefreshCcw className="w-2.5 h-2.5 text-white" /> :
                 isFinish ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> :
                 isPayment ? <CreditCard className="w-2.5 h-2.5 text-white" /> :
                 <Clock className="w-2.5 h-2.5 text-white" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    {formatDate(event.date || event.eventDate)}
                  </span>
                  {event.isLegacy && (
                    <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded uppercase border border-rose-100">
                      Legado
                    </span>
                  )}
                </div>
                
                <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 leading-tight">
                  {event.label}
                </h4>
                
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  {event.receiptNumber ? (
                    <><Receipt className="w-3 h-3" /> Recibo #{event.receiptNumber}</>
                  ) : event.legacyOperation ? (
                    <><TrendingUp className="w-3 h-3" /> Op {event.legacyOperation}</>
                  ) : event.type}
                </p>

                {parseFloat(event.amount) > 0 && (
                  <div className="mt-2 text-sm font-black text-slate-900 tabular-nums">
                    {formatCurrency(event.amount, "es-UY", event.currency)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
