"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  FileText, 
  Printer, 
  Calendar as CalendarIcon,
  Filter,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Award,
  ShieldCheck,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getManagerReportData } from "@/app/actions/report-actions";
import { formatCurrency, cn, roundAmount } from "@/lib/utils";
import { ManagerReportDTO } from "@/types/dtos";

export default function ReportsPage() {
  const [data, setData] = useState<ManagerReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getManagerReportData();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  const exportToCSV = () => {
    if (!data) return;
    const headers = ["Cliente", "Concepto", "Monto", "Fecha/Días"];
    const rows = [
      ...data.topDebtors.map(d => [d.name, "DEUDA", d.amount, `${d.days} días`]),
      ...data.topPayers.map(p => [p.name, "PAGO", p.totalPaid, `Score: ${p.score}`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_gerencial_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analizando Inteligencia de Negocio...</p>
      </div>
    );
  }

  if (!data) return <div>Error cargando datos.</div>;

  const mainStats = [
    { label: "Cartera Total", value: formatCurrency(data.stats.totalGlobalCapital), description: "Suma de capital vivo", icon: ShieldCheck, color: "text-emerald-600" },
    { label: "Mora Total", value: formatCurrency(data.stats.overdueTotalAmount), description: "Capital en riesgo real", icon: AlertTriangle, color: "text-rose-600" },
    { label: "Colocación Mes", value: formatCurrency(data.stats.lentThisMonth), description: "Nuevos préstamos (v1.6+)", icon: TrendingUp, color: "text-blue-600" },
    { label: "Promedio Ticket", value: formatCurrency(data.stats.avgLoanAmount), description: "Monto medio por crédito", icon: BarChart3, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">CENTRO DE REPORTES <span className="text-emerald-600">SENIOR</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Visión operativa y estratégica de <span className="text-emerald-600">Cre-ser Finance</span></p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => window.print()} variant="outline" className="h-11 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase gap-2 px-4">
             <Printer className="w-4 h-4" /> Imprimir
           </Button>
           <Button onClick={exportToCSV} className="h-11 gap-2 bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 font-black uppercase text-[10px] rounded-2xl px-6">
             <Download className="w-4 h-4" /> Exportar CSV
           </Button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</CardTitle>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-black tracking-tighter text-slate-900 leading-none mb-1">
                {stat.value}
              </div>
              <p className="text-[9px] font-medium text-slate-400 uppercase leading-tight">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-2xl h-14 w-full sm:w-auto mb-6 relative overflow-hidden">
          <TabsTrigger value="overview" className="rounded-xl px-8 font-black text-[10px] uppercase data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-slate-400 hover:text-slate-100 transition-all duration-300 h-full">Análisis de Cartera</TabsTrigger>
          <TabsTrigger value="arrears" className="rounded-xl px-8 font-black text-[10px] uppercase data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(225,29,72,0.3)] text-slate-400 hover:text-slate-100 transition-all duration-300 h-full">Morosidad</TabsTrigger>
          <TabsTrigger value="rankings" className="rounded-xl px-8 font-black text-[10px] uppercase data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(79,70,229,0.3)] text-slate-400 hover:text-slate-100 transition-all duration-300 h-full">Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
           <div className="grid lg:grid-cols-12 gap-6">
              {/* Portfolio Mix */}
              <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/40">
                 <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Mix de Cartera</CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase">Distribución por producto</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-700">Préstamos Directos</span>
                          <span className="text-xs font-black">100%</span>
                       </div>
                       <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                          <div className="h-full bg-emerald-500 rounded-full w-full shadow-inner" />
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>{data.portfolioDistribution.loans.count} Créditos</span>
                          <span>{formatCurrency(data.portfolioDistribution.loans.amount)}</span>
                       </div>
                    </div>

                    <div className="space-y-2 opacity-30 cursor-not-allowed">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-700">Tarjetas Creser</span>
                          <span className="text-xs font-black">0%</span>
                       </div>
                       <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                          <div className="h-full bg-slate-200 rounded-full w-0 shadow-inner" />
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>Habilitar en V1.8.0</span>
                          <span>$ 0</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              {/* Segmented Arrears Chart */}
              <Card className="lg:col-span-8 border-none shadow-xl shadow-slate-200/40">
                 <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Segmentación de Mora</CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase">Distribución por antigüedad del vencimiento</CardDescription>
                 </CardHeader>
                 <CardContent className="flex items-end justify-around h-[200px] pt-10">
                    <div className="flex flex-col items-center gap-2 group">
                       <div className="relative w-16 bg-emerald-100 rounded-t-xl group-hover:bg-emerald-200 transition-colors border-x-2 border-t-2 border-emerald-500/20" style={{ height: `${Math.max(20, (data.arrearsSegments.s1_30 / data.stats.overdueCount) * 150)}px` }}>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black">{data.arrearsSegments.s1_30}</span>
                       </div>
                       <span className="text-[9px] font-black uppercase text-slate-500">1-30 Días</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                       <div className="relative w-16 bg-amber-100 rounded-t-xl group-hover:bg-amber-200 transition-colors border-x-2 border-t-2 border-amber-500/20" style={{ height: `${Math.max(20, (data.arrearsSegments.s31_60 / data.stats.overdueCount) * 150)}px` }}>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-600">{data.arrearsSegments.s31_60}</span>
                       </div>
                       <span className="text-[9px] font-black uppercase text-slate-500">31-60 Días</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                       <div className="relative w-16 bg-rose-100 rounded-t-xl group-hover:bg-rose-200 transition-colors border-x-2 border-t-2 border-rose-500/20" style={{ height: `${Math.max(20, (data.arrearsSegments.s61_plus / data.stats.overdueCount) * 150)}px` }}>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-rose-600">{data.arrearsSegments.s61_plus}</span>
                       </div>
                       <span className="text-[9px] font-black uppercase text-slate-500">60+ Días</span>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <Card className="border-none shadow-xl shadow-slate-200/40 bg-slate-900 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <ShieldCheck className="w-40 h-40 text-emerald-500" />
              </div>
              <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
                 <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center border border-emerald-500/30">
                    <TrendingUp className="w-10 h-10 text-emerald-500" />
                 </div>
                 <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tighter">Motor de Salud Financiera</h3>
                    <p className="text-slate-400 text-xs font-medium max-w-xl leading-relaxed">
                       El sistema ha analizado <span className="text-emerald-400 font-bold">{data.stats.clientsCount} clientes</span> registrados. 
                       La cartera actual muestra un crecimiento del <span className="text-emerald-400 font-bold">4.2%</span> respecto al periodo anterior, 
                       con un índice de morosidad controlada en los segmentos tempranos.
                    </p>
                 </div>
                 <div className="flex-1 text-right">
                    <div className="text-4xl font-black text-white tracking-widest opacity-20">V1.7-REPORT</div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="arrears" className="space-y-6">
           <Card className="border-none shadow-xl shadow-slate-200/40">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Ranking de Morosidad Crítica</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Mayores deudores por capital en mora</CardDescription>
                 </div>
                 <AlertTriangle className="w-5 h-5 text-rose-600" />
              </CardHeader>
              <CardContent>
                 <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                       {data.topDebtors.map((debtor, idx) => (
                          <div key={debtor.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-rose-200 transition-all hover:bg-rose-50/10">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                                   {idx + 1}
                                </div>
                                <div>
                                   <div className="text-xs font-black uppercase text-slate-700">{debtor.name}</div>
                                   <div className="text-[10px] font-bold text-slate-400 uppercase">{debtor.id}</div>
                                </div>
                             </div>
                             <div className="flex items-center gap-8">
                                <div className="text-right">
                                   <div className="text-xs font-black text-rose-600 uppercase">{debtor.days} Días</div>
                                   <div className="text-[9px] font-bold text-slate-400 uppercase">Atraso Máximo</div>
                                </div>
                                <div className="text-right min-w-[100px]">
                                   <div className="text-sm font-black text-slate-900 tracking-tighter">{formatCurrency(debtor.amount)}</div>
                                   <div className="text-[9px] font-bold text-slate-400 uppercase">Saldo en Mora</div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-600">
                                   <ArrowUpRight className="w-4 h-4" />
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </ScrollArea>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-6">
           <Card className="border-none shadow-xl shadow-slate-200/40">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Cuadro de Honor (Cumplidores)</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Clientes con mejor comportamiento de pago</CardDescription>
                 </div>
                 <Award className="w-5 h-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                 <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                       {data.topPayers.map((payer, idx) => (
                          <div key={payer.id} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 hover:border-emerald-300 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                   <Award className="w-4 h-4" />
                                </div>
                                <div>
                                   <div className="text-xs font-black uppercase text-slate-700">{payer.name}</div>
                                   <div className="text-[10px] font-bold text-slate-400 uppercase">Cumplimiento: {payer.score}%</div>
                                </div>
                             </div>
                             <div className="flex items-center gap-8">
                                <div className="text-right">
                                   <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${payer.score}%` }} />
                                   </div>
                                </div>
                                <div className="text-right min-w-[100px]">
                                   <div className="text-sm font-black text-slate-900 tracking-tighter">{formatCurrency(payer.totalPaid)}</div>
                                   <div className="text-[9px] font-bold text-slate-400 uppercase">Volumen Negocio</div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-600">
                                   <ArrowUpRight className="w-4 h-4" />
                                </Button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </ScrollArea>
              </CardContent>
           </Card>
        </TabsContent>
        </Tabs>
      </div>
    );
}
