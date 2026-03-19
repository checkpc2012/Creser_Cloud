
import { Suspense } from "react";
import { getBranchesWithDetails } from "@/app/actions/branch-actions";
import { BranchList } from "@/components/branches/branch-list";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Sucursales | CRESER",
  description: "Administración de sucursales, anexos y dependencias territoriales.",
};

export default async function BranchesPage() {
  const branches = await getBranchesWithDetails();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Sucursales
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestione la estructura organizacional y dependencias de CRESER.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<div className="h-96 w-full animate-pulse bg-muted rounded-xl" />}>
          <BranchList initialBranches={branches} />
        </Suspense>
      </div>
    </div>
  );
}
