
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Shield, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Search,
  Filter,
  X,
  UserCheck,
  UserMinus,
  HelpCircle
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  getUsers, 
  getBranches, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetPassword 
} from "@/app/actions/user-actions";
import { cn } from "@/lib/utils";

// Roles en español para mostrar
const ROLE_LABELS: any = {
  OWNER: "Dueña",
  ACCOUNTANT: "Contador",
  MANAGER: "Gerente",
  SYSTEMS: "Sistemas",
  AGENT_SENIOR: "Agente Senior",
  AGENT: "Agente"
};

const ROLE_COLORS: any = {
  OWNER: "bg-purple-100 text-purple-700 border-purple-200",
  ACCOUNTANT: "bg-blue-100 text-blue-700 border-blue-200",
  MANAGER: "bg-amber-100 text-amber-700 border-amber-600/40",
  SYSTEMS: "bg-emerald-100 text-emerald-700 border-emerald-600/40",
  AGENT_SENIOR: "bg-emerald-100 text-emerald-700 border-emerald-600/40",
  AGENT: "bg-slate-100 text-slate-700 border-border"
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "AGENT",
    branchId: "",
    isActive: true,
    contrasena: "Creser1" // Default x defecto
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [u, b] = await Promise.all([getUsers(), getBranches()]);
    setUsers(u);
    setBranches(b);
    setIsLoading(false);
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleCreateOrUpdate = async () => {
    setFormError("");
    if (!formData.firstName || !formData.lastName || !formData.role) {
      setFormError("Complete los campos obligatorios.");
      return;
    }

    let res;
    if (isEditing && selectedUser) {
      res = await updateUser(selectedUser.id, formData);
    } else {
      res = await createUser(formData);
    }

    if (res.success) {
      setIsFormOpen(false);
      resetForm();
      loadData();
    } else {
      setFormError(res.error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const res = await deleteUser(selectedUser.id);
    if (res.success) {
      setIsDeleteOpen(false);
      loadData();
    }
  };

  const handleReset = async () => {
    if (!selectedUser) return;
    const res = await resetPassword(selectedUser.id);
    if (res.success) {
      setIsResetOpen(false);
      loadData();
    }
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId || "",
      isActive: user.isActive,
      contrasena: "" // No se edita pass dsd aquí
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      role: "AGENT",
      branchId: "",
      isActive: true,
      contrasena: "Creser1"
    });
    setFormError("");
    setIsEditing(false);
    setSelectedUser(null);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const activeCount = users.filter(u => u.isActive).length;
    const admins = users.filter(u => ['OWNER', 'MANAGER', 'SYSTEMS'].includes(u.role)).length;
    
    return [
      { label: "Total Usuarios", value: total, icon: Users, bg: "bg-emerald-600", description: "Personal total con acceso al ecosistema Creser." },
      { label: "Cuentas Activas", value: activeCount, icon: CheckCircle2, bg: "bg-emerald-600", description: "Usuarios operativos con sesión habilitada." },
      { label: "Admin / Gerencia", value: admins, icon: Shield, bg: "bg-emerald-600", description: "Personal con facultades de gestión y auditoría." },
      { label: "Sucursales", value: branches.length, icon: Building2, bg: "bg-emerald-600", description: "Puntos de atención física registrados." },
    ];
  }, [users, branches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Personal</h1>
          <p className="text-sm text-muted-foreground leading-none">Administración de <span className="text-emerald-600 font-bold">{users.length}</span> colaboradores autorizados.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-8 border-none ring-offset-background transition-all"
        >
          <Plus className="w-5 h-5" /> Agregar Usuario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {stats.map((stat, i) => (
          <Card 
            key={i} 
            className={cn(
               "border-none shadow-xl transition-all duration-300 group overflow-hidden relative shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
               stat.bg
            )}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-125 bg-background/20 rounded-full blur-2xl`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 text-white">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</CardTitle>
              <div className="p-2 rounded-lg bg-background/20 backdrop-blur-md">
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <div className="text-3xl font-black tracking-tighter">
                {stat.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                  ACTUALIZADO
                </Badge>
                <div className="group/tooltip relative">
                   <AlertCircle className="w-4 h-4 text-white/40 hover:text-white cursor-help transition-colors" />
                   <div className="absolute bottom-6 right-0 w-48 p-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl scale-0 group-hover/tooltip:scale-100 transition-all origin-bottom-right z-[100]">
                      <p className="text-[9px] text-white font-medium leading-relaxed italic">
                        {stat.description}
                      </p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-emerald-700/30/30 shadow-xl overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <div className="p-6 border-b flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input 
                placeholder="Buscar por nombre o usuario..." 
                className="field-base pl-10 h-11 rounded-2xl font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6">Usuario / Nombre</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Rol</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Sucursal</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Acceso</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 animate-pulse">
                        <Users className="w-12 h-12 text-emerald-500/20" />
                        <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Cargando Usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                       <span className="font-bold text-muted-foreground">No se encontraron usuarios.</span>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-emerald-950/20 dark:bg-emerald-950/30/30 transition-all border-emerald-50/20">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-emerald-400 font-black text-sm shadow-inner shadow-emerald-500/20">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors uppercase text-xs">{`${user.firstName} ${user.lastName}`}</span>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground">@{user.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("px-3 py-1 rounded-lg border font-black text-[10px] uppercase tracking-tighter", ROLE_COLORS[user.role])}>
                         {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase">
                        <Building2 className="w-3 h-3 text-emerald-500" />
                        {user.branch?.name || 'General'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-emerald-950/20 dark:bg-emerald-950/30 text-emerald-700 border-emerald-700/30 text-[9px] font-black uppercase flex w-fit items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-900/20 dark:bg-rose-900/30 text-rose-700 border-rose-100 text-[9px] font-black uppercase flex w-fit items-center gap-1">
                          <UserMinus className="w-3 h-3" /> Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-900/20 dark:bg-blue-900/30 rounded-xl shadow-lg border border-transparent hover:border-blue-100 bg-background" onClick={() => openEdit(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 hover:bg-amber-900/20 dark:bg-amber-900/30 rounded-xl shadow-lg border border-transparent hover:border-amber-100 bg-background" onClick={() => { setSelectedUser(user); setIsResetOpen(true); }}>
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-900/20 dark:bg-rose-900/30 rounded-xl shadow-lg border border-transparent hover:border-rose-100 bg-background" onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL USUARIO */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-t-8 border-emerald-600 rounded-[2rem]">
          <DialogHeader className="pt-2">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                  <Shield className="w-6 h-6 text-emerald-600" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black">{isEditing ? 'Editar Perfil' : 'Nuevo Usuario'}</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">Configuración de acceso para Cre-ser</DialogDescription>
               </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-900/20 dark:bg-rose-900/30 border border-rose-100 text-rose-600 text-[10px] font-black uppercase flex items-center gap-2 animate-bounce">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre</label>
                  <input 
                    className="field-base"
                    placeholder="Ej: Fernando"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Apellido</label>
                  <input 
                    className="field-base"
                    placeholder="Ej: Rebollo"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cargo / Rol</label>
               <select 
                 className="field-base"
                 value={formData.role}
                 onChange={(e) => setFormData({...formData, role: e.target.value})}
               >
                 <option value="AGENT">Agente</option>
                 <option value="AGENT_SENIOR">Agente Senior</option>
                 <option value="MANAGER">Gerente de Área</option>
                 <option value="ACCOUNTANT">Contador</option>
                 <option value="SYSTEMS">Sistemas</option>
                 <option value="OWNER">Dueña</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sucursal / Dependencia</label>
               <select 
                 className="field-base"
                 value={formData.branchId}
                 onChange={(e) => setFormData({...formData, branchId: e.target.value})}
               >
                 <option value="">Seleccione Sucursal</option>
                 {branches.map(b => (
                   <option key={b.id} value={b.id}>{b.name}</option>
                 ))}
               </select>
            </div>

            {!isEditing && (
              <div className="p-4 bg-slate-900 rounded-2xl border-2 border-slate-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <KeyRound className="w-12 h-12 text-white" />
                 </div>
                 <label className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3" /> Contraseña Inicial Segura
                 </label>
                 <input 
                    type="text"
                    className="w-full bg-transparent text-white font-mono font-black text-lg outline-none"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                 />
                 <p className="text-[8px] text-white/40 font-bold uppercase mt-1 tracking-widest mt-2 flex items-center gap-1">
                   <HelpCircle className="w-3 h-3" /> Mín. 8 caracteres y 1 Mayúscula
                 </p>
              </div>
            )}

            {isEditing && (
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Estado de la cuenta</label>
                 <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className={cn("flex-1 rounded-xl font-bold h-12 uppercase text-[10px]", formData.isActive ? "bg-emerald-950/20 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700" : "")}
                      onClick={() => setFormData({...formData, isActive: true})}
                    >
                      Activo
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn("flex-1 rounded-xl font-bold h-12 uppercase text-[10px]", !formData.isActive ? "bg-rose-900/20 dark:bg-rose-900/30 border-rose-500 text-rose-700" : "")}
                      onClick={() => setFormData({...formData, isActive: false})}
                    >
                      Inactivo
                    </Button>
                 </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="ghost" className="font-bold text-[10px] uppercase" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 flex-1 shadow-lg shadow-emerald-500/20 rounded-2xl uppercase text-xs"
              onClick={handleCreateOrUpdate}
            >
              {isEditing ? "Guardar Cambios" : "Confirmar Alta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-[2rem]">
           <DialogHeader>
              <div className="mx-auto p-4 bg-rose-100 rounded-3xl mb-4">
                 <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <DialogTitle className="text-center text-2xl font-black">¿Inhabilitar Usuario?</DialogTitle>
              <DialogDescription className="text-center font-bold text-xs uppercase px-4 pt-2">
                 Se desactivará el acceso para <span className="text-rose-600">{selectedUser?.firstName} {selectedUser?.lastName}</span>.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
              <Button variant="ghost" className="w-full flex-1 font-bold text-xs uppercase" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
              <Button className="bg-rose-600 hover:bg-rose-700 text-white w-full flex-1 font-black py-6 rounded-2xl uppercase text-[10px]" onClick={handleDelete}>SI, INHABILITAR</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RESET PASS */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-sm rounded-[2rem]">
           <DialogHeader>
              <div className="mx-auto p-4 bg-amber-100 rounded-3xl mb-4">
                 <KeyRound className="w-8 h-8 text-amber-600" />
              </div>
              <DialogTitle className="text-center text-2xl font-black">Reset de Clave</DialogTitle>
              <DialogDescription className="text-center font-bold text-xs uppercase px-4 pt-2">
                 La clave para <span className="text-slate-800">{selectedUser?.firstName} {selectedUser?.lastName}</span> volverá a ser <span className="font-black text-amber-600">Creser12</span>.
              </DialogDescription>
           </DialogHeader>
           <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
              <Button variant="ghost" className="w-full flex-1 font-bold text-xs uppercase" onClick={() => setIsResetOpen(false)}>Cancelar</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full flex-1 font-black py-6 rounded-2xl uppercase text-[10px]" onClick={handleReset}>RESETEAR CLAVE</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
