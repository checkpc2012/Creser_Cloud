"use client";

import * as React from "react";
import { Search, Building2, Plus, Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEmployers } from "@/app/actions/employer-actions";
import { EmployerDTO } from "@/types/dtos";
import { cn } from "@/lib/utils";
import { EmployerQuickCreate } from "./employer-quick-create";

interface EmployerSelectorProps {
  value?: string; // employerId
  onChange: (employerId: string, employerName: string) => void;
  className?: string;
  placeholder?: string;
}

export function EmployerSelector({ value, onChange, className, placeholder = "BUSCAR LUGAR DE TRABAJO..." }: EmployerSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<EmployerDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedName, setSelectedName] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Load initial selection name if value is provided
  React.useEffect(() => {
    if (value && !selectedName) {
      // Small hack: if we have a value but no name, we might want to fetch it
      // but usually the parent knows the name or we rely on the search to find it.
      // For now, if we don't have it, we'll just show the ID or leave it empty
      // until the user interacts.
    }
  }, [value]);

  const handleSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getEmployers(1, query);
      setResults(res.employers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (open) handleSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, handleSearch]);

  const onSelect = (emp: EmployerDTO) => {
    setSelectedName(emp.employerName);
    onChange(emp.id, emp.employerName);
    setSearch("");
    setOpen(false);
  };

  const handleCreateSuccess = (newEmp: EmployerDTO) => {
    setSelectedName(newEmp.employerName);
    onChange(newEmp.id, newEmp.employerName);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative group">
        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
        <Input
          placeholder={selectedName || placeholder}
          className={cn(
            "pl-11 h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-tight focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all text-emerald-500 placeholder:text-slate-500",
            selectedName && "border-emerald-500/30 bg-slate-900/50"
          )}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value.toUpperCase());
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {selectedName && !search && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-800 rounded-full transition-colors group"
            onClick={() => {
              setSelectedName("");
              onChange("", "");
              setSearch("");
            }}
          >
            <X className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-500" />
          </button>
        )}
      </div>

      {open && (search.length >= 2 || loading) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-10 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">Consultando Base de Datos...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((emp) => (
                  <button
                    key={emp.id}
                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-emerald-500/10 text-left transition-all group border border-transparent hover:border-emerald-500/20"
                    onClick={() => onSelect(emp)}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-200 uppercase italic group-hover:text-emerald-400">
                        {emp.employerName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                         REF: {emp.employerCode}
                      </span>
                    </div>
                    {value === emp.id && (
                      <div className="bg-emerald-500/20 p-1 rounded-md">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl m-1">
                <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800">
                  <Search className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-tight">Sin coincidencias para "{search}"</p>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 gap-2 font-black uppercase text-[10px] shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Registrar Nuevo Lugar
                </Button>
              </div>
            )}
          </div>
          {(results.length > 0 || !loading) && (
            <div className="p-3 border-t border-emerald-500/10 bg-slate-900/50">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-11 gap-3 font-black uppercase text-[10px] text-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all rounded-xl"
                onClick={() => setIsCreateOpen(true)}
              >
                <div className="bg-emerald-500/10 p-1.5 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                Crear nuevo lugar de trabajo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close on click outside (simplified for now) */}
      {open && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />}

      <EmployerQuickCreate 
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
        initialName={search}
      />
    </div>
  );
}
