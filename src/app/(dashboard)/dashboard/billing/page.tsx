"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  FileText, Plus, Search, Download, Eye, X, CheckCircle2,
  AlertCircle, Building2, Receipt, Printer, Send, ChevronDown,
  Calendar, DollarSign, Hash, User, Filter, RefreshCw, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  getInvoices, getCompanyFiscal, createInvoice, upsertCompanyFiscal,
  getBillingStats, getInvoiceById, anularInvoice, getClientsForInvoice
} from "@/app/actions/billing-actions";

const TIPO_LABELS: any = {
  E_TICKET: "e-Ticket",
  E_TICKET_CONTINGENCIA: "e-Ticket Contingencia",
  FACTURA_ELECTRONICA: "Factura Electrónica",
  NOTA_CREDITO: "Nota de Crédito",
  NOTA_DEBITO: "Nota de Débito",
};

const TIPO_COLOR: any = {
  E_TICKET: "bg-emerald-100 text-emerald-700 border-emerald-200",
  E_TICKET_CONTINGENCIA: "bg-amber-100 text-amber-700 border-amber-200",
  FACTURA_ELECTRONICA: "bg-blue-100 text-blue-700 border-blue-200",
  NOTA_CREDITO: "bg-rose-100 text-rose-700 border-rose-200",
  NOTA_DEBITO: "bg-orange-100 text-orange-700 border-orange-200",
};

const ESTADO_DGI_COLOR: any = {
  ACEPTADO: "bg-emerald-100 text-emerald-700",
  SIMULADO: "bg-violet-100 text-violet-700",   // generado localmente, sin envío a DGI
  PENDIENTE: "bg-amber-100 text-amber-700",
  RECHAZADO: "bg-rose-100 text-rose-700",
  CONTINGENCIA: "bg-slate-100 text-slate-600",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modales
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPrintFormatOpen, setIsPrintFormatOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"A4" | "THERMAL">("A4");

  // Form nueva factura
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdown, setIsClientDropdown] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    clientId: "",
    clientName: "",
    tipoDocumento: "E_TICKET",
    moneda: "UYU",
    details: [
      { concepto: "", cantidad: 1, precioUnit: 0, ivaRate: 0 }
    ],
    notas: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Config fiscal
  const [configData, setConfigData] = useState({
    rut: "", razonSocial: "", nombreComercial: "",
    direccion: "", ciudad: "", telefono: "", email: "",
    sucursal: "001", establecimiento: "001",
    seriePorDefecto: "A", ambiente: "TEST",
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  async function load(p = page, q = search) {
    setIsLoading(true);
    const [res, s, c] = await Promise.all([
      getInvoices(p, { search: q || undefined }),
      getBillingStats(),
      getCompanyFiscal(),
    ]);
    setInvoices(res.invoices);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setStats(s);
    setCompany(c);
    if (c) {
      setConfigData({
        rut: c.rut, razonSocial: c.razonSocial, nombreComercial: c.nombreComercial || "",
        direccion: c.direccion || "", ciudad: c.ciudad || "", telefono: c.telefono || "",
        email: c.email || "", sucursal: c.sucursal || "", establecimiento: c.establecimiento || "",
        seriePorDefecto: c.seriePorDefecto || "", ambiente: c.ambiente || "",
      });
    }
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 6);
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.nombreCompleto.toLowerCase().includes(q) || c.documento.includes(q)
    ).slice(0, 8);
  }, [clientSearch, clients]);

  async function openNew() {
    const c = await getClientsForInvoice();
    setClients(c);
    setNewInvoice({ clientId: "", clientName: "", tipoDocumento: "E_TICKET", moneda: "UYU", details: [{ concepto: "", cantidad: 1, precioUnit: 0, ivaRate: 0 }], notas: "" });
    setClientSearch("");
    setFormError("");
    setIsNewOpen(true);
  }

  async function openDetail(inv: any) {
    setIsLoading(true);
    const full = await getInvoiceById(inv.id);
    setSelectedInvoice(full);
    setIsDetailOpen(true);
    setIsLoading(false);
  }

  // Cálculo en tiempo real
  const invoiceCalc = useMemo(() => {
    let noGravado = 0, baseBasica = 0, baseMinima = 0;
    newInvoice.details.forEach(d => {
      const imp = d.cantidad * d.precioUnit;
      if (d.ivaRate === 22) baseBasica += imp / 1.22;
      else if (d.ivaRate === 10) baseMinima += imp / 1.10;
      else noGravado += imp;
    });
    const ivaBasica = baseBasica * 0.22;
    const ivaMinima = baseMinima * 0.10;
    const total = noGravado + baseBasica + baseMinima + ivaBasica + ivaMinima;
    return { noGravado, baseBasica, baseMinima, ivaBasica, ivaMinima, total };
  }, [newInvoice.details]);

  const addLine = () => setNewInvoice(p => ({ ...p, details: [...p.details, { concepto: "", cantidad: 1, precioUnit: 0, ivaRate: 22 }] }));
  const removeLine = (i: number) => setNewInvoice(p => ({ ...p, details: p.details.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, value: any) => {
    setNewInvoice(p => {
      const d = [...p.details];
      d[i] = { ...d[i], [field]: value };
      return { ...p, details: d };
    });
  };

  async function handleSubmitInvoice() {
    if (!newInvoice.clientId) { setFormError("Seleccione un cliente."); return; }
    if (newInvoice.details.some(d => !d.concepto || d.precioUnit <= 0)) {
      setFormError("Complete todos los conceptos con monto válido."); return;
    }
    if (!company) { setFormError("Configure los datos fiscales primero."); return; }
    setFormError(""); setIsSubmitting(true);
    const res = await createInvoice({
      clientId: newInvoice.clientId,
      tipoDocumento: newInvoice.tipoDocumento as any,
      moneda: newInvoice.moneda,
      details: newInvoice.details.map(d => ({ ...d, cantidad: Number(d.cantidad), precioUnit: Number(d.precioUnit) })),
      notas: newInvoice.notas,
    });
    if (res.success && res.data) {
      setIsNewOpen(false);
      const full = await getInvoiceById(res.data.id);
      setSelectedInvoice(full);
      setIsDetailOpen(true);
      load();
    } else {
      setFormError(res.error || "Error al emitir");
    }
    setIsSubmitting(false);
  }

  async function handleSaveConfig() {
    setIsSavingConfig(true);
    await upsertCompanyFiscal(configData as any);
    setIsSavingConfig(false);
    setIsConfigOpen(false);
    load();
  }

  function handlePrint() {
    setIsPrintFormatOpen(true);
  }

  function executePrint(format: "A4" | "THERMAL") {
    setPrintFormat(format);
    // Esperamos un frame para que el state se aplique y el DOM se actualice antes de window.print()
    setTimeout(() => {
      window.print();
      setIsPrintFormatOpen(false);
    }, 150);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Facturación Electrónica
          </h1>
          <p className="text-sm text-muted-foreground">
            {company ? (
              <span>Emitiendo como <strong>{company.razonSocial}</strong> · RUT <strong>{company.rut}</strong></span>
            ) : (
              <span className="text-amber-600 font-bold">⚠ Configure los datos fiscales para comenzar</span>
            )}
          </p>
          {/* Banner modo simulación */}
          {company && (
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-400">
                Modo Simulación Local — Los comprobantes no se envían a DGI. Para habilitar envío real configure el certificado digital.
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-10 gap-2 rounded-2xl" onClick={() => setIsConfigOpen(true)}>
            <Settings className="w-4 h-4" /> Config. Fiscal
          </Button>
          <Button
            className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs rounded-2xl px-6 shadow-lg shadow-emerald-500/20"
            onClick={openNew}
          >
            <Plus className="w-4 h-4" /> Nueva Factura
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Emitidas este mes", value: stats.facturasMes ?? 0, sub: formatCurrency(stats.totalMes ?? 0, 'es-UY', 'UYU'), icon: FileText, bg: "bg-emerald-600" },
          { label: "Total Emitidas", value: stats.totalEmitidas ?? 0, sub: "historial completo", icon: Receipt, bg: "bg-blue-600" },
          { label: "Pendientes DGI", value: stats.pendientes ?? 0, sub: stats.pendientes > 0 ? "requieren envío" : "al día", icon: Send, bg: stats.pendientes > 0 ? "bg-amber-600" : "bg-emerald-600" },
          { label: "Empresa", value: company ? "✓" : "✗", sub: company ? company.ambiente : "sin configur.", icon: Building2, bg: company ? "bg-emerald-600" : "bg-rose-600" },
        ].map((s, i) => (
          <Card key={i} className={cn("border-none text-white shadow-xl overflow-hidden relative", s.bg)}>
            <div className="absolute -right-4 -top-4 opacity-20">
              <s.icon className="w-20 h-20" />
            </div>
            <CardContent className="p-4 relative z-10">
              <p className="text-[10px] font-black uppercase opacity-80 mb-1">{s.label}</p>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[10px] opacity-70 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card className="shadow-xl rounded-3xl overflow-hidden border-0">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-center bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por número, cliente, CAE..." className="pl-10 h-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl" onClick={() => load()}>
            <RefreshCw className="w-4 h-4" /> Actualizar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {["Número", "Tipo", "Cliente", "Fecha", "Total", "Estado DGI", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 animate-pulse">
                    <Receipt className="w-10 h-10 text-muted-foreground/20" />
                    <span className="text-xs font-bold text-muted-foreground uppercase">Cargando...</span>
                  </div>
                </td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="w-10 h-10 text-muted-foreground/20" />
                    <span className="text-xs font-bold text-muted-foreground uppercase">No hay facturas</span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl mt-2" onClick={openNew}>
                      <Plus className="w-4 h-4 mr-1" /> Emitir primera factura
                    </Button>
                  </div>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 font-mono font-black text-xs text-emerald-600">{inv.numeroFormateado}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-[9px] border", TIPO_COLOR[inv.tipoDocumento])}>{TIPO_LABELS[inv.tipoDocumento]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-xs">{inv.client.nombreCompleto}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.client.documento}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.fecha).toLocaleDateString('es-UY')}</td>
                  <td className="px-4 py-3 font-black text-sm">{formatCurrency(inv.total, 'es-UY', inv.moneda)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-[9px]", ESTADO_DGI_COLOR[inv.estadoDgi])}>{inv.estadoDgi}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openDetail(inv)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{total} comprobantes · Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>Ant.</Button>
              <Button size="sm" variant="outline" className="rounded-xl" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}>Sig.</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─────── MODAL: NUEVA FACTURA ─────── */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-t-4 border-t-emerald-500">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" /> Emitir Comprobante
            </DialogTitle>
            <DialogDescription>Completa los datos para generar el comprobante fiscal.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            {/* Tipo y moneda */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Tipo de Comprobante</label>
                <select className="field-base" value={newInvoice.tipoDocumento} onChange={e => setNewInvoice(p => ({ ...p, tipoDocumento: e.target.value }))}>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Moneda</label>
                <select className="field-base" value={newInvoice.moneda} onChange={e => setNewInvoice(p => ({ ...p, moneda: e.target.value }))}>
                  <option value="UYU">$ UYU - Peso Uruguayo</option>
                  <option value="USD">US$ - Dólar</option>
                </select>
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  className="field-base pl-10"
                  placeholder="Buscar cliente por nombre o cédula..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setIsClientDropdown(true); setNewInvoice(p => ({ ...p, clientId: "", clientName: "" })); }}
                  onFocus={() => setIsClientDropdown(true)}
                />
              </div>
              {newInvoice.clientName && (
                <p className="text-xs text-emerald-600 font-bold">✓ {newInvoice.clientName}</p>
              )}
              {isClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <div key={c.id} className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      onClick={() => { setNewInvoice(p => ({ ...p, clientId: c.id, clientName: c.nombreCompleto })); setClientSearch(c.nombreCompleto); setIsClientDropdown(false); }}>
                      <p className="font-bold text-sm">{c.nombreCompleto}</p>
                      <p className="text-[10px] text-muted-foreground">{c.documento}</p>
                    </div>
                  ))}
                </div>
              )}
              {isClientDropdown && <div className="fixed inset-0 z-40" onClick={() => setIsClientDropdown(false)} />}
            </div>

            {/* Detalle de líneas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Conceptos / Detalle</label>
                <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-xl gap-1" onClick={addLine}>
                  <Plus className="w-3 h-3" /> Agregar línea
                </Button>
              </div>

              <div className="rounded-xl border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-muted/40 text-[9px] font-black uppercase text-muted-foreground">
                  <div className="col-span-5">Concepto</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-right">IVA %</div>
                  <div className="col-span-1"></div>
                </div>
                {newInvoice.details.map((d, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 p-2 border-t items-center">
                    <input className="col-span-5 field-base h-9 text-xs" placeholder="Descripción..." value={d.concepto} onChange={e => updateLine(i, "concepto", e.target.value)} />
                    <input className="col-span-2 field-base h-9 text-xs text-right" type="number" min="1" value={d.cantidad} onChange={e => updateLine(i, "cantidad", Number(e.target.value))} />
                    <input className="col-span-2 field-base h-9 text-xs text-right" type="number" min="0" step="0.01" value={d.precioUnit} onChange={e => updateLine(i, "precioUnit", Number(e.target.value))} />
                    <select className="col-span-2 field-base h-9 text-xs" value={d.ivaRate} onChange={e => updateLine(i, "ivaRate", Number(e.target.value))}>
                      <option value={0}>0% (No grav.)</option>
                      <option value={10}>10% Mín.</option>
                      <option value={22}>22% Básica</option>
                    </select>
                    <div className="col-span-1 flex justify-center">
                      {newInvoice.details.length > 1 && (
                        <button onClick={() => removeLine(i)} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales en tiempo real */}
            <div className="p-4 bg-muted/30 rounded-xl border space-y-2 text-sm">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Neto IVA Básica (22%)</span><span className="font-bold">{formatCurrency(invoiceCalc.baseBasica, 'es-UY', newInvoice.moneda)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">IVA Básica</span><span className="font-bold">{formatCurrency(invoiceCalc.ivaBasica, 'es-UY', newInvoice.moneda)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">No Gravado</span><span className="font-bold">{formatCurrency(invoiceCalc.noGravado, 'es-UY', newInvoice.moneda)}</span></div>
              <div className="flex justify-between text-base font-black border-t pt-2">
                <span>TOTAL A PAGAR</span>
                <span className="text-emerald-600">{formatCurrency(invoiceCalc.total, 'es-UY', newInvoice.moneda)}</span>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Notas / Adenda</label>
              <textarea className="field-base h-20 resize-none pt-2" placeholder="Observaciones opcionales..." value={newInvoice.notas} onChange={e => setNewInvoice(p => ({ ...p, notas: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-bold text-xs" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 shadow-lg shadow-emerald-500/20 rounded-2xl"
              onClick={handleSubmitInvoice}
            >
              {isSubmitting ? "Emitiendo..." : "⚡ Emitir y Enviar a DGI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── MODAL: DETALLE / COMPROBANTE ─────── */}
      {selectedInvoice && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-sm">{TIPO_LABELS[selectedInvoice.tipoDocumento]}</p>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.numeroFormateado}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-xs" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </Button>
              </div>
            </div>

            {/* Cuerpo del comprobante — formato visual similar al PDF del ejemplo */}
            <div id="invoice-print" className="p-6 space-y-4 text-sm">
              {/* Cabecera */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                      {selectedInvoice.company?.razonSocial?.[0]}
                    </div>
                    <div>
                      <p className="font-black text-base">{selectedInvoice.company?.razonSocial}</p>
                      {selectedInvoice.company?.nombreComercial && <p className="text-xs text-muted-foreground">{selectedInvoice.company.nombreComercial}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedInvoice.company?.direccion}</p>
                  <p className="text-xs text-muted-foreground">Tel: {selectedInvoice.company?.telefono}</p>
                </div>
                <div className="border rounded-xl overflow-hidden min-w-[220px]">
                  <div className="bg-muted/40 px-3 py-1 grid grid-cols-2 gap-2 text-[9px] font-black text-muted-foreground uppercase border-b">
                    <span>RUT Emisor</span><span className="text-right font-mono">{selectedInvoice.company?.rut}</span>
                  </div>
                  <div className="px-3 py-1 grid grid-cols-3 gap-1 text-[10px] border-b bg-emerald-950/10">
                    <span className="font-black text-emerald-600">{TIPO_LABELS[selectedInvoice.tipoDocumento]}</span>
                    <span className="text-center">Serie {selectedInvoice.serie}</span>
                    <span className="text-right font-mono font-black">{String(selectedInvoice.numero).padStart(9,'0')}</span>
                  </div>
                  <div className="px-3 py-1 grid grid-cols-3 text-[9px] font-black text-muted-foreground uppercase border-b">
                    <span>Fecha</span><span className="text-center">Pago</span><span className="text-right">Moneda</span>
                  </div>
                  <div className="px-3 py-1 grid grid-cols-3 text-[10px] border-b">
                    <span>{new Date(selectedInvoice.fecha).toLocaleDateString('es-UY')}</span>
                    <span className="text-center">Contado</span>
                    <span className="text-right font-black">{selectedInvoice.moneda}</span>
                  </div>
                  <div className="px-3 py-1 grid grid-cols-2 text-[9px] text-muted-foreground uppercase">
                    <span>RUT</span><span className="text-right">Cons. Final</span>
                  </div>
                  <div className="px-3 py-1 grid grid-cols-2 text-[10px]">
                    <span className="font-mono">{selectedInvoice.client?.documento}</span>
                    <span className="text-right">X</span>
                  </div>
                </div>
              </div>

              {/* Datos cliente */}
              <div className="border-t pt-3 text-xs space-y-0.5">
                <p><span className="font-black">Nombre: </span>{selectedInvoice.client?.nombreCompleto}</p>
                <p><span className="font-black">Cédula: </span>{selectedInvoice.client?.documento}</p>
                {(selectedInvoice.client?.streetAndNum || selectedInvoice.client?.address) && (
                  <p><span className="font-black">Dirección: </span>{selectedInvoice.client?.streetAndNum || selectedInvoice.client?.address}</p>
                )}
              </div>

              {/* Tabla de conceptos */}
              <table className="w-full text-xs border rounded-xl overflow-hidden">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left p-2 font-black uppercase text-[9px]">Concepto</th>
                    <th className="text-right p-2 font-black uppercase text-[9px]">IVA %</th>
                    <th className="text-right p-2 font-black uppercase text-[9px]">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.details?.map((d: any) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-2">{d.concepto}</td>
                      <td className="p-2 text-right">{d.ivaRate > 0 ? d.ivaRate.toFixed(2) : ""}</td>
                      <td className="p-2 text-right font-bold">{d.importe.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales + CAE */}
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1 space-y-1 text-xs border-r pr-4">
                  <p className="text-muted-foreground italic text-[10px]">Puede verificar comprobante en <strong>www.dgi.gub.uy</strong></p>
                  <p className="text-[10px] font-bold">I.V.A. al día</p>
                  {selectedInvoice.cae && (<>
                    <p className="text-[10px]">CAE Nº: <strong className="font-mono">{selectedInvoice.cae}</strong></p>
                    <p className="text-[10px]">SERIE: {selectedInvoice.serie} - {String(selectedInvoice.numero).padStart(6,'0')} AL {String(selectedInvoice.numero + 39999).padStart(6,'0')}</p>
                    <p className="text-[10px] font-bold">Código de Seguridad: <span className="font-mono">{selectedInvoice.codigoSeguridad}</span></p>
                  </>)}
                </div>
                <div className="min-w-[200px] space-y-1 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground font-bold uppercase text-[9px]">Neto IVA T. Básica:</span>
                    <span>$ {((selectedInvoice.subTotalGravado - selectedInvoice.totalIvaMinima / 0.10 * (selectedInvoice.totalIvaMinima > 0 ? 1 : 0))).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground font-bold uppercase text-[9px]">Importe IVA T. Básica:</span>
                    <span>$ {selectedInvoice.totalIvaBasica.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground font-bold uppercase text-[9px]">Sub-Total Gravado:</span>
                    <span>$ {selectedInvoice.subTotalGravado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground font-bold uppercase text-[9px]">Total No Gravado:</span>
                    <span>$ {selectedInvoice.subTotalNoGravado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-black uppercase text-[10px]">Total a Pagar:</span>
                    <span className="font-black text-base text-emerald-600">$ {selectedInvoice.total.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.fechaVencimientoCae && (
                    <div className="flex justify-between text-[9px] border-t pt-1">
                      <span className="font-black uppercase text-muted-foreground">Fecha de Vencimiento:</span>
                      <span>{new Date(selectedInvoice.fechaVencimientoCae).toLocaleDateString('es-UY')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ADENDA */}
              {selectedInvoice.notas && (
                <div className="border rounded-xl p-3 text-center text-xs text-muted-foreground">
                  <p className="font-black uppercase text-[9px] mb-1">ADENDA</p>
                  <p>{selectedInvoice.notas}</p>
                </div>
              )}

              {/* CAE Badge */}
              <div className="flex justify-center">
                <Badge className={cn("text-xs font-black px-4 py-2", ESTADO_DGI_COLOR[selectedInvoice.estadoDgi])}>
                  DGI: {selectedInvoice.estadoDgi}
                  {selectedInvoice.cae && ` · CAE ${selectedInvoice.cae}`}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────── MODAL: SELECCIÓN DE FORMATO DE IMPRESIÓN ─────── */}
      <Dialog open={isPrintFormatOpen} onOpenChange={setIsPrintFormatOpen}>
        <DialogContent className="sm:max-w-sm border-t-4 border-t-emerald-500">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600" /> Formato de Impresión
            </DialogTitle>
            <DialogDescription>Seleccione el tamaño de papel para el comprobante.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col gap-2 rounded-2xl border-2 transition-all",
                printFormat === "A4" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "hover:border-emerald-200"
              )}
              onClick={() => executePrint("A4")}
            >
              <FileText className="w-8 h-8 text-emerald-600" />
              <span className="font-bold">Hoja A4</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col gap-2 rounded-2xl border-2 transition-all",
                printFormat === "THERMAL" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "hover:border-emerald-200"
              )}
              onClick={() => executePrint("THERMAL")}
            >
              <Receipt className="w-8 h-8 text-emerald-600" />
              <span className="font-bold">Térmico (80mm)</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPrintFormatOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── COMPONENTES IMPRIMIBLES (Ocultos en UI, visibles en @media print) ─────── */}
      {selectedInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white dark:bg-white text-black z-[9999]" id="printable-area">
          {printFormat === "A4" ? (
            <div className="p-10 w-[210mm] mx-auto bg-white text-black">
              {/* Cabecera A4 */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-3xl">
                    {selectedInvoice.company?.razonSocial?.[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black">{selectedInvoice.company?.razonSocial}</h1>
                    <p className="text-lg font-bold text-muted-foreground">{selectedInvoice.company?.nombreComercial}</p>
                    <p className="text-sm mt-2">{selectedInvoice.company?.direccion} · {selectedInvoice.company?.ciudad}</p>
                    <p className="text-sm">Tel: {selectedInvoice.company?.telefono} · {selectedInvoice.company?.email}</p>
                  </div>
                </div>
                <div className="border-2 border-black p-4 w-[280px] rounded-sm">
                  <div className="text-center border-b border-black mb-2 pb-1">
                    <p className="text-sm font-black tracking-widest uppercase">RUT EMISOR</p>
                    <p className="text-xl font-mono font-black">{selectedInvoice.company?.rut}</p>
                  </div>
                  <div className="text-center mb-2">
                    <p className="text-lg font-black">{TIPO_LABELS[selectedInvoice.tipoDocumento]}</p>
                    <p className="text-2xl font-mono font-black">
                      Serie {selectedInvoice.serie} - {String(selectedInvoice.numero).padStart(9, '0')}
                    </p>
                  </div>
                  <div className="text-[10px] font-black italic bg-gray-100 p-1 text-center border mt-2">
                    EMISIÓN ELECTRÓNICA
                  </div>
                </div>
              </div>

              {/* Datos del Documento y Cliente A4 */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-2 border p-4 rounded-sm">
                  <h3 className="font-black text-xs uppercase text-gray-400 mb-1 border-b">DATOS DEL COMPROBANTE</h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="font-bold">Fecha Emisión:</span>
                    <span>{new Date(selectedInvoice.fecha).toLocaleDateString('es-UY')}</span>
                    <span className="font-bold">Forma de Pago:</span>
                    <span>Contado</span>
                    <span className="font-bold">Moneda:</span>
                    <span>{selectedInvoice.moneda}</span>
                    <span className="font-bold">Vto. CAE:</span>
                    <span>{selectedInvoice.fechaVencimientoCae ? new Date(selectedInvoice.fechaVencimientoCae).toLocaleDateString('es-UY') : '-'}</span>
                  </div>
                </div>
                <div className="space-y-2 border p-4 rounded-sm">
                  <h3 className="font-black text-xs uppercase text-gray-400 mb-1 border-b">RECEPTOR</h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="font-bold">Cliente:</span>
                    <span className="font-black">{selectedInvoice.client?.nombreCompleto}</span>
                    <span className="font-bold">Documento:</span>
                    <span>{selectedInvoice.client?.documento}</span>
                    <span className="font-bold">Dirección:</span>
                    <span className="break-words">{selectedInvoice.client?.streetAndNum || selectedInvoice.client?.address || '-'}</span>
                    <span className="font-bold">Localidad:</span>
                    <span>{selectedInvoice.client?.ciudad || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Detalle A4 */}
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-t-2 border-b-2 border-black">
                    <th className="text-left p-3 font-black text-xs uppercase">Descripción / Concepto</th>
                    <th className="text-right p-3 font-black text-xs uppercase w-[100px]">Cantidad</th>
                    <th className="text-right p-3 font-black text-xs uppercase w-[100px]">Precio Unit.</th>
                    <th className="text-right p-3 font-black text-xs uppercase w-[100px]">IVA %</th>
                    <th className="text-right p-3 font-black text-xs uppercase w-[130px]">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {selectedInvoice.details?.map((d: any) => (
                    <tr key={d.id}>
                      <td className="p-3 text-sm">{d.concepto}</td>
                      <td className="p-3 text-right text-sm">{d.cantidad}</td>
                      <td className="p-3 text-right text-sm">{formatCurrency(d.precioUnit, 'es-UY', '')}</td>
                      <td className="p-3 text-right text-sm font-bold">{d.ivaRate === 0 ? "Exento" : d.ivaRate.toFixed(1)}%</td>
                      <td className="p-3 text-right text-sm font-black">{formatCurrency(d.importe, 'es-UY', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer / Totales A4 */}
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-7 space-y-4">
                  {selectedInvoice.notas && (
                    <div className="border border-dashed p-4 rounded-sm bg-gray-50">
                      <p className="font-black text-[10px] uppercase text-gray-400 mb-2">Observaciones / Adenda</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedInvoice.notas}</p>
                    </div>
                  )}
                  <div className="text-[10px] space-y-1 mt-4">
                    <p className="font-black uppercase italic tracking-wider">Certificado por DGI - Resolución 410/2026</p>
                    <p className="font-bold">CAE Nº: {selectedInvoice.cae}</p>
                    <p>Serie {selectedInvoice.serie} · Nros del {String(selectedInvoice.numero - 100).padStart(6,'0')} al {String(selectedInvoice.numero + 100).padStart(6,'0')}</p>
                    <p className="font-bold">Código de Seguridad: {selectedInvoice.codigoSeguridad}</p>
                    <p className="mt-4 border-t pt-2 opacity-50">Representación impreso del comprobante fiscal electrónico. Consultar en www.dgi.gub.uy</p>
                  </div>
                </div>
                <div className="col-span-5 space-y-2 border-l-2 border-black pl-8">
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span>Monto No Gravado:</span>
                    <span className="font-bold">{formatCurrency(selectedInvoice.subTotalNoGravado, 'es-UY', selectedInvoice.moneda)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span>Neto Gravado IVA Básica:</span>
                    <span className="font-bold">{formatCurrency(selectedInvoice.subTotalGravado - selectedInvoice.totalIvaBasica, 'es-UY', selectedInvoice.moneda)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span>IVA Básica (22%):</span>
                    <span className="font-bold">{formatCurrency(selectedInvoice.totalIvaBasica, 'es-UY', selectedInvoice.moneda)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black py-4">
                    <span>TOTAL:</span>
                    <span className="text-2xl">{formatCurrency(selectedInvoice.total, 'es-UY', selectedInvoice.moneda)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[80mm] mx-auto bg-white p-4 font-mono text-black text-sm">
              {/* Layout TÉRMICO */}
              <div className="text-center mb-4 space-y-1">
                <h1 className="text-lg font-black uppercase tracking-tighter">{selectedInvoice.company?.razonSocial}</h1>
                <p className="text-[10px] font-bold">{selectedInvoice.company?.nombreComercial}</p>
                <p className="text-[10px]">{selectedInvoice.company?.direccion} · {selectedInvoice.company?.ciudad}</p>
                <div className="border-y border-dashed border-black py-1 my-2">
                  <p className="font-black">RUT: {selectedInvoice.company?.rut}</p>
                </div>
                <h2 className="font-black text-xs">{TIPO_LABELS[selectedInvoice.tipoDocumento]}</h2>
                <p className="font-bold text-lg leading-none">Serie {selectedInvoice.serie} - {String(selectedInvoice.numero).padStart(9, '0')}</p>
              </div>

              <div className="text-[10px] border-b border-black pb-2 mb-2 space-y-0.5">
                <div className="flex justify-between"><span>Fecha:</span><span>{new Date(selectedInvoice.fecha).toLocaleDateString('es-UY')}</span></div>
                <div className="flex justify-between"><span>Condición:</span><span>Contado</span></div>
                <div className="flex justify-between font-black uppercase border-t pt-1 mt-1"><span>Receptor:</span><span>{selectedInvoice.client?.documento}</span></div>
                <div className="text-right font-bold truncate">{selectedInvoice.client?.nombreCompleto}</div>
              </div>

              <div className="text-[10px] space-y-1 mb-4">
                <div className="flex font-black border-b border-black pb-0.5 mb-1">
                  <div className="flex-1">DESCRIPCIÓN</div>
                  <div className="w-16 text-right">TOTAL</div>
                </div>
                {selectedInvoice.details?.map((d: any) => (
                  <div key={d.id} className="flex leading-tight">
                    <div className="flex-1">{d.concepto}</div>
                    <div className="w-16 text-right font-black">{d.importe.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-black pt-2 space-y-1 mb-6">
                <div className="flex justify-between text-[11px] font-black uppercase">
                  <span>TOTAL {selectedInvoice.moneda}</span>
                  <span className="text-lg">{formatCurrency(selectedInvoice.total, 'es-UY', '')}</span>
                </div>
                <div className="flex justify-between text-[9px] opacity-70">
                  <span>IVA Incluido:</span>
                  <span>{formatCurrency(selectedInvoice.totalIva, 'es-UY', '')}</span>
                </div>
              </div>

              <div className="text-center text-[9px] space-y-1 border border-black p-2 bg-gray-50">
                <p className="font-black uppercase tracking-widest bg-black text-white py-0.5">CAE: {selectedInvoice.cae}</p>
                <p className="font-bold">Seguridad: {selectedInvoice.codigoSeguridad}</p>
                <p>Nros. autorizados del {String(selectedInvoice.numero - 50).padStart(6,'0')} al {String(selectedInvoice.numero + 50).padStart(6,'0')}</p>
                <p>Vto. CAE: {selectedInvoice.fechaVencimientoCae ? new Date(selectedInvoice.fechaVencimientoCae).toLocaleDateString('es-UY') : '-'}</p>
              </div>

              {selectedInvoice.notas && (
                <div className="mt-4 border-t border-dashed pt-2">
                  <p className="text-[8px] font-black text-gray-400 mb-1">NOTAS:</p>
                  <p className="text-[9px] leading-tight">{selectedInvoice.notas}</p>
                </div>
              )}

              <div className="text-center mt-6 text-[8px] opacity-50 uppercase tracking-tighter">
                <p>Representación impreso de CFE</p>
                <p>Verifique en www.dgi.gub.uy</p>
                <p className="mt-2 font-black">*** Gracias por su confianza ***</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────── MODAL: CONFIG FISCAL ─────── */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-lg border-t-4 border-t-blue-500">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Configuración Fiscal
            </DialogTitle>
            <DialogDescription>Datos del emisor registrados ante DGI Uruguay.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "RUT Empresa", field: "rut", placeholder: "215429370017" },
                { label: "Razón Social", field: "razonSocial", placeholder: "Mi Empresa S.A." },
                { label: "Nombre Comercial", field: "nombreComercial", placeholder: "Mi Empresa" },
                { label: "Dirección Fiscal", field: "direccion", placeholder: "Piedras 112" },
                { label: "Ciudad", field: "ciudad", placeholder: "Montevideo" },
                { label: "Teléfono", field: "telefono", placeholder: "44720917" },
                { label: "Email", field: "email", placeholder: "info@empresa.com.uy" },
                { label: "Nº Sucursal", field: "sucursal", placeholder: "001" },
                { label: "Nº Establecimiento", field: "establecimiento", placeholder: "001" },
                { label: "Serie por defecto", field: "seriePorDefecto", placeholder: "A" },
              ].map(f => (
                <div key={f.field} className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">{f.label}</label>
                  <input
                    className="field-base h-10 text-xs"
                    placeholder={f.placeholder}
                    value={(configData as any)[f.field]}
                    onChange={e => setConfigData(p => ({ ...p, [f.field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Ambiente DGI</label>
              <select className="field-base" value={configData.ambiente} onChange={e => setConfigData(p => ({ ...p, ambiente: e.target.value }))}>
                <option value="TEST">TEST (Pruebas)</option>
                <option value="PROD">PRODUCCIÓN</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
            <Button disabled={isSavingConfig} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-8" onClick={handleSaveConfig}>
              {isSavingConfig ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print styles */}
      <style>{`
        @media print {
          /* Ocultar todo el sitio */
          body * { visibility: hidden !important; }
          #printable-area, #printable-area * { visibility: visible !important; }
          #printable-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: block !important;
            visibility: visible !important;
            background: white !important;
            color: black !important;
          }
          /* Ajustes de página */
          @page {
            margin: 0 !important;
            size: auto !important;
          }
          /* Fixes para el modal de Radix/Shadcn que suele forzar pointer-events none */
          body { overflow: visible !important; }
          [data-state="open"] { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}
