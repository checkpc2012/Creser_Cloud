"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Ticket, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Percent, 
  Gift, 
  Tag, 
  Search,
  CheckCircle2,
  Calendar,
  Zap,
  Copy,
  PlusCircle,
  AlertCircle
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { getPromotions, createPromotion, deletePromotion } from "@/app/actions/promotion-actions";
import { cn } from "@/lib/utils";

function generatePromoCode() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Removed O and 0
  const random = (len: number) => {
    let result = "";
    for (let i = 0; i < len; i++) {
       result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `CReSer${random(3)}-${random(3)}`;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "DISCOUNT", // DISCOUNT | DISCOUNT_100 (example)
    discount: 0
  });

  const loadPromos = async () => {
    setIsLoading(true);
    const data = await getPromotions();
    setPromotions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleGenerateCode = () => {
    setFormData({ ...formData, code: generatePromoCode() });
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.description) return;
    const res = await createPromotion(formData);
    if (res.success) {
      setIsAddModalOpen(false);
      loadPromos();
      setFormData({ code: "", description: "", type: "DISCOUNT", discount: 0 });
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar promoción?")) return;
    const res = await deletePromotion(id);
    if (res.success) loadPromos();
  };

  const filteredPromos = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return promotions.filter(p => 
      p.code.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q)
    );
  }, [promotions, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 uppercase tracking-tighter">
            <Ticket className="w-8 h-8 text-emerald-500" /> Cupones de Promoción
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Gestión de incentivos y campañas comerciales</p>
        </div>
        <Button className="h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-8" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="w-5 h-5" /> Nueva Promoción
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATS */}
        <Card className="lg:col-span-1 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
           <Zap className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-emerald-600" />
           <CardHeader className="p-4 border-b">
              <CardTitle className="text-[10px] font-black uppercase text-emerald-700">Resumen de Campaña</CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-bold opacity-60 uppercase">Cupones Activos</p>
                 <Badge className="bg-emerald-600 text-white font-black">{promotions.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                 <p className="text-xs font-bold opacity-60 uppercase">Usos Registrados</p>
                 <p className="text-lg font-black italic">0</p>
              </div>
              <div className="pt-4 border-t border-emerald-200/40">
                 <p className="text-[9px] font-black uppercase text-emerald-600/60 leading-tight">TIP: Puedes crear cupones de descuento porcentual para incentivar el pronto pago o captar nuevos clientes.</p>
              </div>
           </CardContent>
        </Card>

        {/* LIST */}
        <Card className="lg:col-span-2 shadow-xl shadow-slate-200/50 border-none">
           <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="relative group w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 opacity-60" />
                 <Input 
                   placeholder="Buscar cupón o descripción..." 
                   className="pl-10 h-10 text-xs font-medium rounded-xl border-muted bg-muted/20"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black">Código</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Descripción</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Valor</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-right">Gestión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPromos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-xs font-bold opacity-40 uppercase italic">
                           No hay promociones registradas o activas
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPromos.map((p) => (
                        <TableRow key={p.id} className="hover:bg-emerald-50 transition-colors">
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-black text-[11px] tracking-widest border-emerald-200 bg-white text-emerald-700 h-8 px-3 rounded-xl border-dashed">
                                   {p.code}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => navigator.clipboard.writeText(p.code)}>
                                   <Copy className="w-3 h-3"/>
                                </Button>
                             </div>
                          </TableCell>
                          <TableCell className="text-[11px] font-bold opacity-80 uppercase leading-snug">
                             {p.description}
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-1.5 font-black text-emerald-600 italic">
                                {p.discount}% <Percent className="w-3 h-3" />
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(p.id)}>
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* MODAL CREAR */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Ticket className="w-7 h-7 text-emerald-500" /> Configurar Promo
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase opacity-60">Complete los parámetros de la nueva campaña</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase opacity-60 ml-2">Código Distintivo</label>
                 <div className="flex gap-2">
                    <Input 
                      placeholder="Código..." 
                      className="h-14 rounded-2xl font-black text-lg tracking-widest border-none bg-muted/40 shadow-inner" 
                      value={formData.code} 
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    />
                    <Button variant="secondary" className="h-14 w-14 rounded-2xl shrink-0" onClick={handleGenerateCode} title="Generar Automático">
                       <RefreshCw className="w-5 h-5" />
                    </Button>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase opacity-60 ml-2">Descripción Informativa</label>
                 <Input 
                   placeholder="Ej: Promo Jubilados 2026" 
                   className="h-12 rounded-xl bg-muted/40 border-none font-bold"
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-2">Tipo</label>
                    <select className="flex h-12 w-full rounded-xl border-none bg-muted/40 px-4 py-2 text-xs font-black ring-offset-background cursor-pointer" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="DISCOUNT">Descuento %</option>
                      <option value="GIFT">Regalo / Sorteo</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-2">Valor (%)</label>
                    <div className="relative">
                       <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 opacity-60" />
                       <Input 
                         type="number" 
                         className="h-12 rounded-xl bg-muted/40 border-none font-black text-center"
                         value={formData.discount}
                         onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                       />
                    </div>
                 </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-16 rounded-[2rem] font-black uppercase text-xl bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 gap-3" onClick={handleCreate}>
                 <CheckCircle2 className="w-7 h-7" /> ACTIVAR PROMOCIÓN
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
