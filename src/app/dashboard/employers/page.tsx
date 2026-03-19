
"use client";

import * as React from "react";
import { getEmployers } from "@/app/actions/employer-actions";
import { EmployerDTO } from "@/types/dtos";
import { 
  Building2, 
  Search, 
  Filter, 
  ChevronRight, 
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployerDetailDialog } from "@/components/employers/employer-detail-dialog";
import { EmployerQuickCreate } from "@/components/employers/employer-quick-create";

export default function EmployersPage() {
  const [employers, setEmployers] = React.useState<EmployerDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  
  const [selectedEmployer, setSelectedEmployer] = React.useState<EmployerDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const fetchEmployers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployers(page, search);
      setEmployers(res.employers);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployers]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-emerald-600" /> Lugares de Trabajo
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Gestión de catálogos y referencias laborales ({total} registros)
          </p>
        </div>
        <Button 
          className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-8 border-none ring-offset-background transition-all"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-5 h-5" /> Nuevo Lugar de Trabajo
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="BUSCAR POR NOMBRE O CÓDIGO LEGADO..."
              className="pl-10 h-12 bg-slate-50 border-none rounded-2xl text-[10px] font-bold uppercase tracking-widest focus-visible:ring-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
            />
          </div>
          <Button variant="outline" className="h-12 rounded-2xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-6 font-black uppercase text-[10px]">
            <Filter className="w-4 h-4" /> Filtros
          </Button>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden shadow-slate-200/50">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <Table>
              <TableHeader className="bg-slate-900">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 pl-6">Tipo / Clasificación</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Lugar de Trabajo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Código</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Clientes</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Estado Investigación</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right pr-6">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={6} className="h-20 bg-slate-50/20" />
                    </TableRow>
                  ))
                ) : employers.length > 0 ? (
                  employers.map((emp) => (
                    <TableRow key={emp.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="pl-6">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase px-2 h-5",
                          emp.type === 'PUBLIC_INSTITUTION' ? "border-sky-200 text-sky-700 bg-sky-50" :
                          emp.type === 'RETIRED_OR_PENSION' ? "border-purple-200 text-purple-700 bg-purple-50" :
                          emp.type === 'PRIVATE_COMPANY' ? "border-amber-200 text-amber-700 bg-amber-50" :
                          "border-slate-200 text-slate-600 bg-slate-50"
                        )}>
                          {emp.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 tracking-tight uppercase italic">{emp.employerName}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase flex items-center justify-center gap-1">
                            {emp.isLegacy && <Badge className="h-3 text-[6px] font-black px-1 bg-slate-200 text-slate-600">LEGADO</Badge>}
                            {emp.legacyAddress || "SIN DIRECCIÓN PUBLICADA"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <code className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {emp.employerCode}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-black text-slate-700 leading-none">{emp.clientCount || 0}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Activos</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase px-2 h-5 gap-1 mx-auto",
                          emp.researchStatus === 'VERIFIED' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                          emp.researchStatus === 'RESEARCHED' ? "text-blue-600 bg-blue-50 border-blue-100" : "text-slate-400 bg-slate-100 border-slate-200"
                        )}>
                          {emp.researchStatus === 'VERIFIED' ? 'VERIFICADO' : 
                           emp.researchStatus === 'RESEARCHED' ? 'INVESTIGADO' : 'PENDIENTE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600"
                          onClick={() => {
                            setSelectedEmployer(emp);
                            setIsDetailOpen(true);
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-60 text-center text-slate-400 opacity-50 grayscale">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-12 h-12" />
                        <p className="text-xs font-black uppercase tracking-widest">No se encontraron resultados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      <EmployerDetailDialog 
        employer={selectedEmployer}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSuccess={fetchEmployers}
      />

      <EmployerQuickCreate 
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchEmployers}
      />
    </div>
  );
}
