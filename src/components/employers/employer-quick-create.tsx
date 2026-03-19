"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployer } from "@/app/actions/employer-actions";
import { Building2, Plus, Save } from "lucide-react";

interface EmployerQuickCreateProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (employer: any) => void;
  initialName?: string;
}

export function EmployerQuickCreate({ isOpen, onOpenChange, onSuccess, initialName = "" }: EmployerQuickCreateProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    employerName: "",
    employerCode: "",
    type: "PRIVATE_COMPANY"
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        employerName: initialName,
        employerCode: "",
        type: "PRIVATE_COMPANY"
      });
    }
  }, [isOpen, initialName]);

  const handleCreate = async () => {
    if (!formData.employerName) return;
    setLoading(true);
    try {
      const res = await createEmployer(formData);
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-6 border-b border-emerald-500/20">
          <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" /> Nuevo Lugar de Trabajo
          </DialogTitle>
          <DialogDescription className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest">
            Registro rápido de referencia laboral • Sistema Local
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-slate-950">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest px-1">Nombre / Razón Social *</Label>
            <Input 
              className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-sm font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 transition-all"
              value={formData.employerName}
              onChange={(e) => setFormData({...formData, employerName: e.target.value.toUpperCase()})}
              placeholder="EJ: INTENDENCIA DE MONTEVIDEO"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest px-1">Código (Opcional)</Label>
              <Input 
                className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-sm font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 transition-all"
                value={formData.employerCode}
                onChange={(e) => setFormData({...formData, employerCode: e.target.value.toUpperCase()})}
                placeholder="EJ: IM-01"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest px-1">Tipo de Entidad</Label>
              <select 
                className="w-full h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-sm font-bold px-4 text-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="PUBLIC_INSTITUTION" className="bg-slate-900">INSTITUCIÓN PÚBLICA</option>
                <option value="PRIVATE_COMPANY" className="bg-slate-900">EMPRESA PRIVADA</option>
                <option value="RETIRED_OR_PENSION" className="bg-slate-900">PASIVIDAD / JUBILACIÓN</option>
                <option value="OTHER" className="bg-slate-900">OTRO / PARTICULAR</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-900 border-t border-emerald-500/10 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-2xl font-black uppercase text-[10px] h-12 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] h-12 gap-2 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            onClick={handleCreate}
            disabled={loading || !formData.employerName}
          >
            <Save className="w-4 h-4" /> {loading ? "CREANDO..." : "CONFIRMAR REGISTRO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
