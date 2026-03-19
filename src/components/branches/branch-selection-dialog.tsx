
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Check } from "lucide-react";
import { setActiveBranchAction } from "@/app/actions/auth-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BranchSelectionDialog({ user, branches }: { user: any; branches: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const isGlobalRole = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(user.role);
    // Show if no active branch is set in session AND it's not a global role
    if (!user.activeBranchId && !isGlobalRole) {
      setOpen(true);
    }
  }, [user.activeBranchId, user.role]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    const res = await setActiveBranchAction(id);
    if (res.success) {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl p-0 overflow-hidden bg-card">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-bold">Seleccionar Sucursal</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">
              Bienvenido, <span className="font-semibold text-foreground">{user.name}</span>. Por favor elija la sucursal con la que operará hoy.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid gap-3">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                disabled={loading}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-all group relative",
                  selectedId === branch.id
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-transparent bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    selectedId === branch.id ? "bg-primary text-white" : "bg-card text-muted-foreground group-hover:text-primary"
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-left font-semibold">
                    {branch.name}
                    {user.branchId === branch.id && (
                      <span className="block text-[10px] text-muted-foreground font-normal">Sucursal Base</span>
                    )}
                  </div>
                </div>
                {selectedId === branch.id ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-6 pb-6 pt-2 text-center">
            <p className="text-[10px] text-muted-foreground">
                Podrá cambiar su sucursal de operación en cualquier momento desde los ajustes.
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
