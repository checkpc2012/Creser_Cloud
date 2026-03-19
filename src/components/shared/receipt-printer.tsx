"use client";

import React from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptPrinterProps {
  payment: any;
  onClose: () => void;
  type?: "THERMAL" | "STANDARD";
}

export function ReceiptPrinter({ payment, onClose, type = "STANDARD" }: ReceiptPrinterProps) {
  const handlePrint = () => {
    window.print();
  };

  const receiptId = `REC-${payment?.id?.toString().padStart(6, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Lado Izquierdo: Vista Previa Operativa */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Control de Emisión</h2>
              <p className="text-sm text-slate-500 font-bold uppercase">Configure el formato de salida antes de imprimir</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Detalles del Pago</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Cliente</p>
                  <p className="text-sm font-black text-slate-800">{payment.user}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Monto</p>
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(payment.amount, "es-UY", "UYU")}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Fecha</p>
                  <p className="text-sm font-bold text-slate-700">{formatDate(payment.date)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Recibo #</p>
                  <p className="text-sm font-mono font-bold text-slate-700">{receiptId}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handlePrint} className="h-14 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20">
                <Printer className="w-5 h-5 mr-3" /> Imprimir Ahora
              </Button>
              <Button variant="outline" className="h-14 border-slate-200 text-slate-600 font-black uppercase tracking-widest rounded-2xl" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Renderizado Real (Lo que se imprime) */}
        <div className="hidden md:flex w-[400px] bg-slate-200 p-8 items-start justify-center overflow-y-auto">
          {/* Contenedor de Impresión Realizado con CSS Escala */}
          <div className="scale-75 origin-top shadow-2xl">
             <div className={cn(
               "bg-white ring-1 ring-slate-300",
               type === "THERMAL" ? "w-[80mm] min-h-[120mm] p-4 text-xs" : "w-[210mm] h-[297mm] p-12 text-sm"
             )} id="printable-receipt">
                <ReceiptContent payment={payment} type={type} receiptId={receiptId} />
             </div>
          </div>
        </div>
      </div>

      {/* COMPONENTE OCULTO PARA IMPRESORA (Solo visible al imprimir) */}
      <div className="print-only fixed inset-0 z-[-1] bg-white text-black overflow-visible">
         <style jsx global>{`
           @media print {
             body * { visibility: hidden; }
             .print-only, .print-only * { visibility: visible; }
             .print-only { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                display: block !important;
                background: white !important;
                color: black !important;
             }
             header, footer, .no-print { display: none !important; }
             @page { 
               margin: 0; 
               size: ${type === "THERMAL" ? "80mm auto" : "A4"};
             }
           }
         `}</style>
         <div className={cn(
           "mx-auto",
           type === "THERMAL" ? "w-[80mm] p-4" : "w-[210mm] p-12"
         )}>
           <ReceiptContent payment={payment} type={type} receiptId={receiptId} />
         </div>
      </div>
    </div>
  );
}

function ReceiptContent({ payment, type, receiptId }: { payment: any, type: string, receiptId: string }) {
  const isThermal = type === "THERMAL";
  
  return (
    <div className={cn("flex flex-col font-sans", isThermal ? "gap-2" : "gap-8")}>
      {/* Header */}
      <div className="flex flex-col items-center text-center border-b border-dashed border-slate-300 pb-4">
        <img src="/logo-creser.png" alt="CRESER" className={isThermal ? "h-12 mb-2" : "h-20 mb-4"} />
        <h1 className={cn("font-black uppercase tracking-tighter italic", isThermal ? "text-xl" : "text-4xl")}>Creser</h1>
        <p className={cn("uppercase font-bold text-slate-500", isThermal ? "text-[8px]" : "text-xs")}>Servicios Financieros</p>
        <div className="mt-2 text-[9px] text-slate-400 font-medium">
          <p>RUT: 216508430018 | Tel: +598 2345 6789</p>
          <p>Juan Carlos Blanco 3456, Montevideo - Uruguay</p>
        </div>
      </div>

      {/* Receipt Info */}
      <div className={cn("grid", isThermal ? "grid-cols-1 gap-1" : "grid-cols-2 gap-4")}>
        <div className="flex flex-col">
          <span className="uppercase text-[8px] font-black text-slate-400">Comprobante No.</span>
          <span className="font-mono font-black text-lg">{receiptId}</span>
        </div>
        <div className={cn("flex flex-col", !isThermal && "text-right")}>
          <span className="uppercase text-[8px] font-black text-slate-400">Fecha de Emisión</span>
          <span className="font-bold">{formatDate(payment.date)}</span>
        </div>
      </div>

      {/* Client Data */}
      <div className="bg-slate-50 p-4 border border-slate-100">
        <span className="uppercase text-[8px] font-black text-slate-400 mb-1 block">Datos del Cliente</span>
        <p className="font-black text-md leading-none uppercase">{payment.user}</p>
        <p className="text-xs font-bold text-slate-600 mt-1">DOC: {payment.documento || 'S/D'}</p>
      </div>

      {/* Table of concepts */}
      <div className="flex flex-col border-y border-slate-200 py-4">
        <div className="flex justify-between font-black uppercase text-[9px] text-slate-400 mb-2">
           <span>Concepto</span>
           <span>Monto</span>
        </div>
        <div className="flex justify-between items-center py-2">
           <div className="flex flex-col">
              <span className="font-bold text-sm">{payment.label || 'PAGO DE CUOTA'}</span>
              <span className="text-[10px] text-slate-500">Crédito Ref: {payment.loanId || 'N/A'}</span>
           </div>
           <span className="font-black text-md">{formatCurrency(payment.amount, "es-UY", "UYU")}</span>
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex flex-col items-end gap-1 mt-4">
        <div className="flex justify-between w-full max-w-[200px] items-center">
           <span className="text-[10px] font-bold text-slate-500 uppercase">Total Recibido:</span>
           <span className="font-black text-xl italic">{formatCurrency(payment.amount, "es-UY", "UYU")}</span>
        </div>
        <div className="flex justify-between w-full max-w-[200px] items-center border-t border-slate-100 pt-1">
           <span className="text-[8px] font-bold text-slate-400 uppercase">Medio:</span>
           <span className="text-[10px] font-black text-emerald-600 uppercase">Efectivo</span>
        </div>
      </div>

      {/* Footer / Legal */}
      <div className="mt-8 pt-8 border-t border-dashed border-slate-300 text-center text-[9px] text-slate-400 space-y-2">
         <p className="font-bold">¡Gracias por confiar en Creser!</p>
         <p>Documento no válido como factura. Comprobante interno de caja.</p>
         <div className="flex justify-center gap-8 mt-12 opacity-50">
           <div className="w-32 border-t border-slate-400 pt-1 uppercase text-[7px] font-bold">Firma Cajero: {payment.agentName}</div>
           <div className="w-32 border-t border-slate-400 pt-1 uppercase text-[7px] font-bold">Firma Cliente</div>
         </div>
      </div>
    </div>
  );
}
