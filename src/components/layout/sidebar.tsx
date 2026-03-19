"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  History,
  Settings,
  LogOut,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  X,
  ShieldCheck,
  Receipt,
  Ticket,
  Building2,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-context";
import { getLogout } from "@/app/actions/auth-actions";

const menuGroups = [
  {
    title: "PRINCIPAL",
    items: [
      { icon: LayoutDashboard, label: "Panel Principal", href: "/dashboard" },
      { icon: ShieldCheck, label: "Aprobaciones", href: "/dashboard/approvals", tag: "Pte. Backend" },
    ]
  },
  {
    title: "OPERACIONES",
    items: [
      { icon: User, label: "Clientes", href: "/dashboard/clients" },
      { icon: CreditCard, label: "Préstamos", href: "/dashboard/loans" },
      { icon: History, label: "Historial Pagos", href: "/dashboard/payments" },
      { icon: AlertCircle, label: "Cobranza / Mora", href: "/dashboard/collections" },
    ]
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      { icon: Receipt, label: "Facturación DGI", href: "/dashboard/billing" },
      { icon: History, label: "Auditoría / Log", href: "/dashboard/audit" },
      { icon: Building2, label: "Lugares de Trabajo", href: "/dashboard/employers" },
      { icon: Building2, label: "Sucursales", href: "/dashboard/branches" },
      { icon: Users, label: "Usuarios / Staff", href: "/dashboard/users" },
      { icon: FileText, label: "Reportes", href: "/dashboard/reports" },
      { icon: Ticket, label: "Promociones", href: "/dashboard/promotions" },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await getLogout();
    logout();
  };


  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "flex flex-col h-screen w-64 border-r bg-card text-card-foreground fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-white dark:bg-transparent rounded-2xl px-3 py-2 shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent">
              <Image
                src="/logo-creser.png"
                alt="Creser Logo"
                width={140}
                height={70}
                className="object-contain dark:[mix-blend-mode:screen] dark:[filter:invert(1)_hue-rotate(180deg)]"
              />
            </div>
          </div>

          <button
            className="lg:hidden p-2 hover:bg-accent rounded-full transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => {
            const filteredItems = group.items.filter(item => {
              if (!user) return true;
              const isGlobal = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(user.role);
              
              if (item.href === "/dashboard/audit" && !isGlobal) return false;
              if (item.href === "/dashboard/branches" && !isGlobal) return false;
              if (item.href === "/dashboard/promotions" && !isGlobal) return false;
              if (item.href === "/dashboard/billing" && !isGlobal) return false;
              if (item.href === "/dashboard/users" && !["SYSTEMS", "OWNER"].includes(user.role)) return false;
              if (item.href === "/dashboard/approvals" && !["SYSTEMS", "OWNER", "MANAGER"].includes(user.role)) return false;
                
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                          isActive
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/20"
                            : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                        <span className="flex-1">{item.label}</span>
                        {item.tag && (
                          <Badge variant="outline" className="text-[8px] h-4 px-1 font-black bg-amber-500/10 border-amber-500/20 text-amber-600 uppercase">
                            {item.tag}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        
        <div className="p-4 border-t space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
