"use client";

import { useState } from "react";
import Link from "next/link";
import { PermissionsPanel } from "./PermissionsPanel";
import { 
  Settings, 
  Building2, 
  CreditCard, 
  Percent, 
  ShieldCheck, 
  Printer, 
  Smartphone,
  Globe,
  Save,
  Bell,
  User,
  Users,
  LogOut,
  HelpCircle,
  FileText,
  UserPlus,
  MoreVertical,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  AlertTriangle,
  Mail,
  Lock,
  Key
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "business", label: "Empresa", icon: Building2 },
    { id: "users", label: "Gestión Empleados", icon: Users },
    { id: "permissions", label: "Permisos de Usuario", icon: Key },
    { id: "loans", label: "Préstamos", icon: Percent },
    { id: "printing", label: "Impresión/Recibos", icon: Printer },
    { id: "security", label: "Seguridad", icon: ShieldCheck },
  ];

  const systemStats = [
    { label: "Parámetros", value: "42", icon: Settings, bg: "bg-emerald-600", description: "Configuraciones globales activas en el motor de Cre-ser." },
    { label: "Último Respaldo", value: "Hace 2h", icon: CheckCircle2, bg: "bg-emerald-600", description: "Copia de seguridad sincronizada correctamente en la nube." },
    { label: "Versión Sistema", value: "v2.0.4", icon: ShieldCheck, bg: "bg-emerald-600", description: "Última compilación estable con parches de seguridad activos." },
    { label: "Usuarios Online", value: "4", icon: Users, bg: "bg-emerald-600", description: "Sesiones administrativas activas en tiempo real." },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Configuración</h1>
          <p className="text-sm text-muted-foreground leading-none">Ajustes globales y parámetros críticos de <span className="text-emerald-600 font-bold">Cre-ser Finance</span></p>
        </div>
        <Button 
          className="h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black uppercase text-xs rounded-2xl px-8 border-none ring-offset-background transition-all"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar Cambios</>}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {systemStats.map((stat, i) => (
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
              <div className="text-2xl font-black tracking-tighter">
                {stat.value}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-[10px] font-black border-none px-2 h-5 bg-background/20 text-white backdrop-blur-sm">
                  ESTADO: OK
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Configuración */}
        <aside className="w-full lg:w-64 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20" 
                  : "hover:bg-accent text-muted-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Contenido Principal */}
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle>Ajustes Generales</CardTitle>
                <CardDescription>Preferencias básicas de interfaz y funcionamiento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Nombre del Sistema</label>
                    <Input defaultValue="Creser - Gestión de Préstamos" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Moneda Principal</label>
                    <Input defaultValue="Pesos Uruguayos (UYU)" disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Idioma</label>
                    <Input defaultValue="Español (Uruguay)" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Zona Horaria</label>
                    <Input defaultValue="UTC-3 (Montevideo)" />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-bold">Notificaciones</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-bold">Alertas de Mora</p>
                          <p className="text-[10px] text-muted-foreground text-left">Notificar cuando un préstamo supere los 3 días de atraso.</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Activado</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold">Envío automático de WhatsApp</p>
                          <p className="text-[10px] text-muted-foreground text-left">Sugerir envío de mensaje al registrar nuevo préstamo.</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Desactivado</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "business" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>Estos datos se utilizarán para la generación de recibos y contratos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Razón Social</label>
                  <Input defaultValue="Creser Soluciones Financieras S.A." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">RUT / Identificador</label>
                    <Input defaultValue="210000000010" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Teléfono de contacto</label>
                    <Input defaultValue="+598 94 000 000" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Dirección Comercial</label>
                    <Input defaultValue="Av. 18 de Julio 1234, Oficina 402, Montevideo" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Email Institucional</label>
                    <Input defaultValue="contacto@creser.com.uy" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "users" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                 <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                    <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
                 </div>
                 <CardTitle className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                   Gestión de Personal Integrada
                 </CardTitle>
                 <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
                   La creación, edición, y administración general de Empleados, Asesores y Gerentes se realiza de manera centralizada en un único módulo para evitar redundancia o confusiones con los clientes finales de la financiera.
                 </CardDescription>
                 <Link href="/dashboard/users" className="mt-6 pt-4">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-xs px-8 h-12 rounded-full transition-all">
                      Abrir Módulo de Staff 
                    </Button>
                 </Link>
              </CardContent>
            </Card>
          )}

          {activeTab === "permissions" && (
            <PermissionsPanel />
          )}

          {activeTab === "loans" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle>Parámetros de Préstamos</CardTitle>
                <CardDescription>Configuración de tasas y penalizaciones por defecto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Tasa TEA % (Por defecto)</label>
                    <div className="relative">
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input defaultValue="25" type="number" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Tasa Mora Diaria %</label>
                    <div className="relative">
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input defaultValue="0.5" type="number" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Días de Gracia</label>
                    <Input defaultValue="3" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Redondeo de Cuotas</label>
                    <Input defaultValue="Sin decimales" disabled />
                  </div>
                </div>

                <div className="p-4 bg-amber-900/20 dark:bg-amber-900/30 dark:bg-amber-900/10 border border-amber-600/40 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                   <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                   <p className="text-xs text-amber-700 dark:text-amber-400">
                     Los cambios en las tasas solo afectarán a los <strong>nuevos préstamos</strong>. Los préstamos vigentes mantendrán las condiciones acordadas al momento de la firma.
                   </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "printing" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle>Configuración de Impresión</CardTitle>
                <CardDescription>Ajusta el diseño de tus recibos y documentos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                 <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground">Pie de página (Recibos)</label>
                  <textarea 
                    className="w-full h-24 p-3 text-sm rounded-xl border bg-background focus:ring-2 ring-emerald-500 outline-none resize-none"
                    defaultValue="Gracias por su pago. Por consultas comuníquese al 094 000 000. Creser Sistema de Gestión v1.0"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-bold">Logo en Documentos</span>
                     </div>
                     <Badge variant="secondary" className="bg-blue-100 text-blue-700">Activado</Badge>
                  </div>
                  <div className="p-4 border rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Printer className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-bold">Impresión Silenciosa</span>
                     </div>
                     <Badge variant="secondary">Desactivado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader>
                <CardTitle>Seguridad y Acceso</CardTitle>
                <CardDescription>Controla quién accede al sistema y protege tus datos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold">Autenticación de Dos Pasos</p>
                        <p className="text-[10px] text-muted-foreground text-left text-left">Mayor seguridad para tu cuenta de administrador.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configurar</Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground">Cambiar Contraseña Actual</label>
                    <div className="grid gap-3">
                      <Input type="password" placeholder="Contraseña Actual" />
                      <Input type="password" placeholder="Nueva Contraseña" />
                      <Input type="password" placeholder="Confirmar Nueva Contraseña" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                   <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 gap-2">
                      <LogOut className="w-4 h-4" /> Cerrar Todas las Sesiones
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* MODALES ELIMINADOS (Movidos al Módulo de Staff) */}

    </div>
  );
}
