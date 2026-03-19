
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth-context";
import { setActiveBranchAction } from "@/app/actions/auth-actions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  UserCircle, 
  MapPin, 
  MoreVertical, 
  ArrowRight,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BranchList({ initialBranches }: { initialBranches: any[] }) {
  const [branches] = useState(initialBranches);
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const isGlobalRole = user && ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(user.role);

  const handleSwitchActive = async (branchId: string) => {
    setLoading(branchId);
    const res = await setActiveBranchAction(branchId);
    if (res.success) {
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {branches.map((branch) => (
          <Card key={branch.id} className="relative overflow-hidden group hover:shadow-md transition-all border-primary/10">
            <div className={`absolute top-0 left-0 w-1 h-full ${branch.isActive !== false ? 'bg-primary' : 'bg-muted'}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {branch.name}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                   <div className="text-2xl font-bold">
                    {branch._count.users}
                   </div>
                    <Badge variant={branch.isActive !== false ? "default" : "secondary"}>
                     {branch.isActive !== false ? "Activa" : "Inactiva"}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Usuarios asignados
                </p>
                
                {branch.isAnnex && branch.parent && (
                  <div className="mt-2 pt-2 border-t flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ArrowRight className="h-3 w-3" /> Depende de: <span className="font-semibold text-foreground">{branch.parent.name}</span>
                  </div>
                )}
                
                {!branch.isAnnex && branch.children.length > 0 && (
                  <div className="mt-2 pt-2 border-t flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Posee {branch.children.length} anexos
                  </div>
                )}

                {isGlobalRole && (
                  <Button 
                    variant={user?.activeBranchId === branch.id ? "primary" : "outline"}
                    size="sm"
                    className="w-full mt-4 text-[10px] h-8 font-bold"
                    onClick={() => handleSwitchActive(branch.id)}
                    disabled={loading === branch.id || user?.activeBranchId === branch.id}
                  >
                    {user?.activeBranchId === branch.id ? (
                      <><CheckCircle2 className="mr-2 h-3 w-3" /> Sucursal Activa</>
                    ) : (
                      "Operar en esta sucursal"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px]">Sucursal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Legacy ID</TableHead>
                <TableHead>Cuentas / Clientes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${branch.isAnnex ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span>{branch.name}</span>
                        {branch.parent && (
                          <span className="text-[10px] text-muted-foreground">Dep. de {branch.parent.name}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={branch.isAnnex ? "text-orange-600 border-orange-200 bg-orange-50" : "text-primary border-primary/20 bg-primary/5"}>
                      {branch.isAnnex ? "Anexo" : "Casa Central"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{branch.legacy_id || "N/A"}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5" title="Usuarios">
                        <UserCircle className="h-3 w-3 text-muted-foreground" />
                        {branch._count.users}
                      </div>
                      <div className="flex items-center gap-1.5" title="Clientes">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {branch._count.clients}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {branch.isActive !== false ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Activa
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        Inactiva
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar detalles</DropdownMenuItem>
                        <DropdownMenuItem>Ver usuarios</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isGlobalRole && (
                          <DropdownMenuItem 
                            onClick={() => handleSwitchActive(branch.id)}
                            disabled={user?.activeBranchId === branch.id}
                            className="font-bold text-primary"
                          >
                            Seleccionar como Activa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className={branch.isActive !== false ? "text-destructive" : "text-primary"}>
                          {branch.isActive !== false ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
