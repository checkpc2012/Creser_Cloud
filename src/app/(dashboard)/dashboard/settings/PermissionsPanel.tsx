"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, User, Info, Building2 } from "lucide-react";
import { getUsers } from "@/app/actions/user-actions";
import { useAuth } from "@/store/auth-context";

export function PermissionsPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const dbUsers = await getUsers();
      setUsers(dbUsers);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
  };

  // Solo Gerentes o Sistemas deberían poder modificar esto
  if (currentUser?.role !== "MANAGER" && currentUser?.role !== "SYSTEMS" && currentUser?.role !== "OWNER") {
    return (
      <Card className="border-none shadow-sm bg-card/50">
        <CardContent className="p-10 text-center flex flex-col items-center">
          <Shield className="w-16 h-16 text-rose-500/50 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Solo el personal de gerencia (MANAGER, SYSTEMS, OWNER) puede modificar los accesos del sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Lista de Usuarios */}
      <Card className="lg:col-span-1 border-none shadow-sm bg-card/50 h-[fit-content]">
        <CardHeader>
          <CardTitle className="text-sm">Seleccionar Personal</CardTitle>
          <CardDescription>Escoja el agente para visualizar permisos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Cargando personal...</div>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selectedUser?.id === u.id
                    ? "bg-emerald-950/20 dark:bg-emerald-950/30 border-emerald-600/40 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : "bg-background border-slate-100 hover:border-emerald-600/40 dark:bg-slate-900 dark:border-slate-800 hover:dark:border-emerald-800/50"
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <User className={`w-4 h-4 ${selectedUser?.id === u.id ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tighter text-slate-800 dark:text-slate-200">{`${u.firstName} ${u.lastName}`}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{u.role}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Panel de Permisos */}
      <Card className="lg:col-span-2 border-none shadow-sm bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Niveles y Accesos</CardTitle>
            <CardDescription>
              {selectedUser
                ? `Esquema de seguridad para: ${selectedUser.firstName} ${selectedUser.lastName}`
                : "Seleccione un empleado del panel izquierdo"}
            </CardDescription>
          </div>
        </CardHeader>

        {selectedUser ? (
          <CardContent className="space-y-6">
            <div className="p-4 bg-emerald-950/10 dark:bg-emerald-950/20 border border-emerald-700/30 dark:border-emerald-500/20 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Los permisos ahora se gestionan automáticamente según el <span className="font-bold">Rol</span> del usuario.
                Cualquier cambio de nivel debe realizarse editando el usuario en la sección de Personal.
              </p>
            </div>

            <div className="p-6 border rounded-2xl bg-background/50 space-y-4">
               <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <div>
                     <p className="text-sm font-black uppercase tracking-tight">Rol Asignado: {selectedUser.role}</p>
                     <p className="text-xs text-muted-foreground">Este nivel define el alcance de las operaciones permitidas.</p>
                  </div>
               </div>
            </div>
          </CardContent>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-slate-300">
            <Shield className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-bold text-sm uppercase">Seleccione un elemento</p>
          </div>
        )}
      </Card>
    </div>
  );
}
