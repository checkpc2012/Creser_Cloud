
"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmployerDTO } from "@/types/dtos";
import { updateEmployerResearch } from "@/app/actions/employer-actions";
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MessageSquare, 
  Facebook, 
  Instagram, 
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Save,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployerDetailDialogProps {
  employer: EmployerDTO | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmployerDetailDialog({ employer, isOpen, onOpenChange, onSuccess }: EmployerDetailDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});

  React.useEffect(() => {
    if (employer) {
      setFormData({
        publicPhone: employer.publicPhone || "",
        publicMobile: employer.publicMobile || "",
        whatsapp: employer.whatsapp || "",
        publicEmail: employer.publicEmail || "",
        website: employer.website || "",
        facebookUrl: employer.facebookUrl || "",
        instagramUrl: employer.instagramUrl || "",
        notes: employer.notes || "",
        researchStatus: employer.researchStatus || "PENDING"
      });
    }
  }, [employer, isEditing]);

  if (!employer) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateEmployerResearch(employer.id, formData);
      if (res.success) {
        setIsEditing(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-8 relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-black uppercase text-emerald-400 border-emerald-400/30 mb-2">
                {employer.type.replace(/_/g, ' ')}
              </Badge>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                {employer.employerName}
              </DialogTitle>
              <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> CÓDIGO: {employer.employerCode}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {employer.clientCount || 0} CLIENTES</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={cn(
                "h-7 px-3 text-[10px] font-black uppercase tracking-widest",
                employer.researchStatus === 'VERIFIED' ? "bg-emerald-500 text-white" :
                employer.researchStatus === 'RESEARCHED' ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"
              )}>
                {employer.researchStatus === 'VERIFIED' ? 'VERIFICADO' : 
                 employer.researchStatus === 'RESEARCHED' ? 'INVESTIGADO' : 'PENDIENTE'}
              </Badge>
            </div>
          </div>
          {/* Abstract background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </DialogHeader>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-500" /> Contacto Público / Digital
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-500 uppercase">Teléfono Fijo / Empresa</Label>
                  <Input 
                    disabled={!isEditing}
                    className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                    value={formData.publicPhone}
                    onChange={(e) => setFormData({...formData, publicPhone: e.target.value})}
                    placeholder="Ejem: 2901 1234"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-500 uppercase">WhatsApp / Móvil Regional</Label>
                  <Input 
                    disabled={!isEditing}
                    className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="Ejem: 099 123 456"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-500 uppercase">Email Institucional</Label>
                  <Input 
                    disabled={!isEditing}
                    className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                    value={formData.publicEmail}
                    onChange={(e) => setFormData({...formData, publicEmail: e.target.value.toLowerCase()})}
                    placeholder="info@empresa.com.uy"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-500" /> Presencia Online
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-500 uppercase">Sitio Web</Label>
                  <Input 
                    disabled={!isEditing}
                    className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value.toLowerCase()})}
                    placeholder="www.empresa.com.uy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-500 uppercase">Facebook</Label>
                    <Input 
                      disabled={!isEditing}
                      className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-500 uppercase">Instagram</Label>
                    <Input 
                      disabled={!isEditing}
                      className="h-10 bg-white border-slate-200 rounded-xl text-sm font-bold"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-orange-500" /> Notas de Investigación / Requerimientos
              </h3>
              <textarea
                disabled={!isEditing}
                className="w-full h-40 p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none disabled:opacity-50"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Indique aquí horarios de atención, canales de verificación de empleo, o cualquier dato relevante para la operativa..."
              />
            </section>

            <section className="space-y-4 bg-white p-6 rounded-3xl border shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Verificación</h3>
              <div className="flex flex-col gap-3">
                <Button 
                  disabled={!isEditing}
                  variant={formData.researchStatus === 'VERIFIED' ? 'primary' : 'outline'}
                  className={cn(
                    "h-12 rounded-2xl gap-2 font-black uppercase text-[10px] transition-all",
                    formData.researchStatus === 'VERIFIED' ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-100"
                  )}
                  onClick={() => setFormData({...formData, researchStatus: 'VERIFIED'})}
                >
                  <CheckCircle2 className="w-4 h-4" /> Validado por Creser
                </Button>
                <Button 
                  disabled={!isEditing}
                  variant={formData.researchStatus === 'RESEARCHED' ? 'primary' : 'outline'}
                  className={cn(
                    "h-12 rounded-2xl gap-2 font-black uppercase text-[10px] transition-all",
                    formData.researchStatus === 'RESEARCHED' ? "bg-blue-600 hover:bg-blue-700" : "border-slate-100"
                  )}
                  onClick={() => setFormData({...formData, researchStatus: 'RESEARCHED'})}
                >
                  <Search className="w-4 h-4" /> Investigado (Sin validar)
                </Button>
                <Button 
                  disabled={!isEditing}
                  variant={formData.researchStatus === 'PENDING' ? 'primary' : 'outline'}
                  className={cn(
                    "h-12 rounded-2xl gap-2 font-black uppercase text-[10px] transition-all",
                    formData.researchStatus === 'PENDING' ? "bg-slate-800 hover:bg-slate-900" : "border-slate-100"
                  )}
                  onClick={() => setFormData({...formData, researchStatus: 'PENDING'})}
                >
                  <Clock className="w-4 h-4" /> Pendiente de Análisis
                </Button>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-white border-t p-6 flex items-center justify-between">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            Última actualización: {employer.isLegacy ? 'Legado' : 'Manual'}
          </p>
          <div className="flex gap-3">
            {!isEditing ? (
              <Button 
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] px-6 h-11"
                onClick={() => setIsEditing(true)}
              >
                Editar Información
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-slate-200 font-black uppercase text-[10px] px-6 h-11"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] px-6 h-11 gap-2"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="w-4 h-4" /> {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
