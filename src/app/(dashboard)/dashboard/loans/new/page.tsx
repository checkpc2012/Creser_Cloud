"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ArrowLeft, 
  Calculator, 
  Save, 
  Calendar as CalendarIcon,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ShieldCheck,
  TrendingDown,
  Activity,
  DollarSign,
  History,
  Info,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  CreditCard,
  Tag,
  Printer,
  Trash2,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, normalizeSearch, roundAmount, cn } from "@/lib/utils";
import { validateCI, formatCI, validateRUT, formatRUT } from "@/lib/ci-validator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { getClients, createClient } from "@/app/actions/client-actions";
import { createLoan } from "@/app/actions/loan-actions";
import { getPromotionByCode } from "@/app/actions/promotion-actions";

const URUGUAY_CITIES: Record<string, string[]> = {
  "Artigas": ["Artigas", "Baltasar Brum", "Bella Unión", "Bernabé Rivera", "Cainsa", "Campamento", "Colonia Palma", "Coronado", "Cuaro", "Diego Lamas", "Franquia", "Javier de Viana", "Mones Quintela", "Paso Campamento", "Paso Farías", "Pintadito", "Portones de Hierro y Campodónico", "San Eugenio", "Sequeira", "Tomás Gomensoro", "Topador"],
  "Canelones": ["Aguas Corrientes", "Araminda", "Atlántida", "Barros Blancos", "Bello Horizonte", "Biarritz", "Canelones", "Cerrillos", "Ciudad de la Costa", "Colonia Nicolich", "Costa Azul", "Cuchilla Alta", "El Bosque", "Empalme Olmos", "Estación Atlántida", "Estación La Floresta", "Estación Pedrera", "Guazuvirá", "Jaureguiberry", "Joaquín Suárez", "Juanicó", "La Floresta", "La Paz", "La Tuna", "Las Piedras", "Las Toscas", "Los Cerrillos", "Marindia", "Migues", "Montes", "Neptunia", "Pando", "Parque del Plata", "Paso Carrasco", "Pinamar - Pinepark", "Progreso", "Ruta 74", "Salinas", "San Antonio", "San Bautista", "San Jacinto", "San Luis", "San Ramón", "Santa Lucía", "Santa Rosa", "Sauce", "Soca", "Tala", "Toledo", "Villa Aeroparque", "Villa Crespo y San Andrés", "Villa Felicidad", "Villa San José"],
  "Cerro Largo": ["Aceguá", "Arbolito", "Arévalo", "Bañado de Medina", "Cerro de las Cuentas", "Esperanza", "Fraile Muerto", "Isidoro Noblía", "La Pedrera", "Lago Merín", "Las Toscas", "Melo", "Plácido Rosas", "Poblado Uruguay", "Quebracho", "Ramón Trigo", "Río Branco", "Tres Islas", "Tupambaé"],
  "Colonia": ["Agraciada", "Barker", "Campana", "Carmelo", "Cerro de las Armas", "Colonia Cosmopolita", "Colonia Valdense", "Colonia del Sacramento", "Conchillas", "Cufré", "Estanzuela", "Florencio Sánchez", "Gil", "Juan Lacaze", "La Paz", "Los Pinos", "Miguelete", "Nueva Helvecia", "Nueva Palmira", "Ombúes de Lavalle", "Paso Antolín", "Riachuelo", "Rosario", "Santa Ana", "Semillero", "Tarariras"],
  "Durazno": ["Aguas Buenas", "Blanquillo", "Carlos Reyles", "Carmen", "Centenario", "Cerro Chato", "Durazno", "Feliciano", "La Paloma", "Las Palmas", "Ombúes de Oribe", "Pueblo de Álvarez", "Rossell y Rius", "San Jorge", "Santa Bernardina", "Sarandí del Yí"],
  "Flores": ["Andresito", "Cerro Colorado", "Ismael Cortinas", "Juan José Castro", "La Casilla", "Trinidad"],
  "Florida": ["25 de Agosto", "25 de Mayo", "Alejandro Gallinal", "Berrondo", "Capilla del Sauce", "Cardal", "Casupá", "Cerro Colorado", "Chamizo", "Florida", "Fray Marcos", "Goñi", "Illescas", "Independencia", "La Cruz", "Mendoza", "Mendoza Chico", "Nico Pérez", "Polanco del Yí", "Reboledo", "San Gabriel", "Sarandí Grande"],
  "Lavalleja": ["Aramendía", "Batlle y Ordóñez", "Campanero", "Colón", "Estación Solís", "Gaetán", "Illescas", "José Batlle y Ordóñez", "José Pedro Varela", "La Coronilla", "Mariscala", "Minas", "Pirarajá", "Polanco Norte", "Polanco Sur", "Retamosa", "San Francisco de las Sierras", "Solis de Mataojo", "Villa del Rosario", "Zapicán"],
  "Maldonado": ["Aiguá", "Balneario Buenos Aires", "Bella Vista", "Cerro Pelado", "Cerros Azules", "El Chorro", "El Edén", "El Tesoro", "Faro José Ignacio", "Garzón", "Gregorio Aznárez", "José Ignacio", "La Barra", "La Capuera", "Las Flores", "Los Talas", "Maldonado", "Manantiales", "Nueva Carrara", "Ocean Park", "Pan de Azúcar", "Pinares - Las Delicias", "Piriápolis", "Playa Grande", "Playa Hermosa", "Playa Verde", "Pueblo Eden", "Punta Ballena", "Punta Colorada", "Punta Negra", "Punta del Este", "San Carlos", "Solís"],
  "Montevideo": ["Abayubá", "Bañados de Carrasco", "Barrio Sarandi", "Casabó", "Cerro", "Colón", "Lezica", "Melilla", "Montevideo", "Pajas Blancas", "Paso de la Arena", "Peñarol", "Punta Rieles", "Santiago Vázquez", "Sayago", "Toledo Chico", "Villa García", "Zabala"],
  "Paysandú": ["Beisso", "Casa Blanca", "Cerro Chato", "Chapicuy", "Constancia", "Esperanza", "Gallinal", "Guichón", "Lorenzo Geyres", "Merinos", "Morató", "Orgoroso", "Paysandú", "Piedra Sola", "Piedras Coloradas", "Porvenir", "Quebracho", "San Félix", "Tambores", "Termas de Guaviyú"],
  "Rivera": ["Amarillo", "Arroyo Blanco", "Cerrillada", "Cerro Pelado", "Cerros de la Calera", "La Puente", "Lagos del Norte", "Masoller", "Minas de Corrales", "Moirones", "Paso Campamento", "Paso Hospital", "Rivera", "Tranqueras", "Vichadero"],
  "Rocha": ["18 de Julio", "19 de Abril", "Aguas Dulces", "Arroyo Garzón", "Barra de Valizas", "Barrio Torres", "Cabo Polonio", "Capacho", "Castillos", "Cebollatí", "Chuy", "La Coronilla", "La Esmeralda", "La Paloma", "La Pedrera", "Lascano", "Palmares de la Coronilla", "Paso del Bañado", "Puimayen", "Punta del Diablo", "Rocha", "San Luis al Medio", "Velázquez"],
  "Río Negro": ["Algorta", "Barrio Anglo", "Bellaco", "El Ombú", "Fray Bentos", "Gargantioco", "Grecco", "Las Cañas", "Menafra", "Nuevo Berlín", "Paso de los Mellizos", "San Javier", "Sarandí de Navarro", "Tres Quintas", "Villa María", "Young"],
  "Salto": ["18 de Julio", "Albisu", "Arapey", "Belén", "Biassini", "Campo de Todos", "Cayetano", "Celeste", "Cerro de Vera", "Colonia 18 de Julio", "Colonia Itapebí", "Constitución", "Fernández", "Garibaldi", "ItuZaingó", "Lluveras", "Migues", "Palomas", "Paso Cementerio", "Paso del Parque del Daymán", "Quintana", "Rincón de Valentín", "Salto", "San Antonio", "Sarandí de Arapey", "Saucedo", "Termas del Arapéy", "Termas del Daymán"],
  "San José": ["Capurro", "Ciudad del Plata", "Colonia Delta", "Ecilda Paullier", "Ituzaingó", "Kiyú-Ordeig", "Libertad", "Mal Abrigo", "Puntas de Valdez", "Rafael Perazza", "Raigón", "Rodríguez", "San José de Mayo", "Villa María"],
  "Soriano": ["Agraciada", "Cardona", "Castillos", "Cañada Nieto", "Chacras de Dolores", "Cuchilla del Ombú", "Dolores", "Egaña", "José Enrique Rodó", "La Jackson", "Mercedes", "Palmitas", "Palo Solo", "Perseé", "Risso", "Santa Catalina", "Soriano", "Villa Darwin"],
  "Tacuarembó": ["Achar", "Ansina", "Balneario Iporá", "Cardozo", "Cerro Chato", "Clara", "Cuchilla de Peralta", "Curtina", "Las Toscas", "Paso Bonilla", "Paso de los Toros", "Paso del Cerro", "Piedra Sola", "Pueblo de Arriba", "San Gregorio de Polanco", "Tacuarembó", "Tambores", "Valle Edén"],
  "Treinta y Tres": ["Arrocera Zapata", "Arroyo Malo", "Cerro Chato", "Ejido de Treinta y Tres", "General Enrique Martínez", "Isla Patrulla", "Maria Albina", "Mendizábal", "Poblado Alonso", "Punta Alta", "Santa Clara de Olimar", "Treinta y Tres", "Vergara", "Villa Passano"]
};

export default function NewLoanPage() {
  const router = useRouter();
  
  // State
  const [formData, setFormData] = useState({
    clientId: "",
    guarantorId: "",
    currency: "UYU",
    loanType: "Amortizable",
    amount: 1000,
    interestRate: 5,
    termMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isGuarantorDropdownOpen, setIsGuarantorDropdownOpen] = useState(false);
  const [isGuarantorEnabled, setIsGuarantorEnabled] = useState(false);
  
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    type: "PERSONA", // PERSONA | EMPRESA
    documentType: "CI", // CI | RUT
    sex: "MASCULINO",
    birthDate: "",
    nombre: "",
    apellido: "",
    documento: "",
    telefonos: [""],
    emails: [""],
    ciudad: "Montevideo",
    department: "Montevideo",
    streetAndNum: "",
    workData: {
      company: "",
      position: "",
      salary: "",
      phone: "",
      startDate: ""
    }
  });
  const [isWorkDataModalOpen, setIsWorkDataModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Promotions State
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [isPromoLoading, setIsPromoLoading] = useState(false);

  // Modals for Audit
  const [historyModal, setHistoryModal] = useState<{ open: boolean, client: any | null }>({
    open: false,
    client: null
  });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean, client: any | null }>({
    open: false,
    client: null
  });

  useEffect(() => {
    async function load() {
      const data = await getClients();
      setClientsList(Array.isArray(data) ? data : (data as any).clients ?? []);
    }
    load();
  }, []);

  // Filtering
  const filteredClients = useMemo(() => {
    const q = normalizeSearch(clientSearch);
    if (!q) return [];
    return clientsList.filter(c => 
      normalizeSearch(c.nombreCompleto).includes(q) || normalizeSearch(c.documento).includes(q)
    ).slice(0, 3);
  }, [clientSearch, clientsList]);

  const filteredGuarantors = useMemo(() => {
    const q = normalizeSearch(guarantorSearch);
    if (!q) return [];
    return clientsList.filter(c => 
      (normalizeSearch(c.nombreCompleto).includes(q) || normalizeSearch(c.documento).includes(q)) &&
      c.id !== formData.clientId
    ).slice(0, 3);
  }, [guarantorSearch, clientsList, formData.clientId]);

  // Calculations (French Method)
  const calculations = useMemo(() => {
    const principal = Number(formData.amount) || 0;
    const months = Number(formData.termMonths) || 1;
    let rMonthly = (Number(formData.interestRate) / 100); 

    // APLICAR PROMOCIÓN (Si existe)
    if (appliedPromo && appliedPromo.discount > 0) {
      const factor = (1 - (appliedPromo.discount / 100));
      rMonthly = rMonthly * factor;
    }

    if (principal <= 0) return { monthlyPayment: 0, totalInterest: 0, iva: 0, totalToPay: 0 };
    if (months <= 0) return { monthlyPayment: 0, totalInterest: 0, iva: 0, totalToPay: principal };

    const rTaxed = rMonthly * 1.22;
    
    let monthlyPayment = 0;
    if (rMonthly === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment = (principal * rTaxed) / (1 - Math.pow(1 + rTaxed, -months));
    }
    
    const totalToPay = monthlyPayment * months;
    const totalInterestPlusIVA = totalToPay - principal;
    const totalInterest = totalInterestPlusIVA / 1.22;
    const iva = totalInterest * 0.22;

    return { 
      monthlyPayment: roundAmount(monthlyPayment), 
      totalInterest: roundAmount(totalInterest), 
      iva: roundAmount(iva), 
      totalToPay: roundAmount(totalToPay) 
    };
  }, [formData, appliedPromo]);

  const handleCreateClient = async () => {
    if (!newClientForm.nombre || !newClientForm.documento) return;
    setIsLoading(true);
    const cleanDoc = newClientForm.documento.replace(/\D/g, "");
    
    // Validación Dinámica
    if (newClientForm.type === "PERSONA" && newClientForm.documentType === "CI") {
      if (!validateCI(cleanDoc)) {
        setFormError("Cédula de Identidad inválida. Verifique el dígito verificador.");
        setIsLoading(false);
        return;
      }
    } else if (newClientForm.documentType === "RUT") {
      if (!validateRUT(cleanDoc)) {
        setFormError("RUT no válido. Debe contener 12 dígitos y formato correcto.");
        setIsLoading(false);
        return;
      }
    }
    
    const formattedDoc = newClientForm.documentType === "CI" ? formatCI(cleanDoc) : formatRUT(cleanDoc);

    const exists = clientsList.some(c => c.documento === formattedDoc);
    if (exists) { setFormError("Error: Ya registrada."); setIsLoading(false); return; }

    const response = await createClient({
      type: newClientForm.type,
      documentType: newClientForm.documentType,
      sex: newClientForm.sex,
      birthDate: newClientForm.birthDate,
      department: newClientForm.department,
      ciudad: newClientForm.ciudad,
      streetAndNum: newClientForm.streetAndNum,
      nombre: newClientForm.nombre,
      apellido: newClientForm.apellido,
      documento: formattedDoc,
      telefonos: newClientForm.telefonos.filter((t: string) => t.trim() !== ""),
      emails: newClientForm.emails.filter((e: string) => e.trim() !== ""),
      workData: newClientForm.workData,
      branchId: null
    });

    if (!response.success || !response.data) { 
        setFormError(response.error || "Error al crear cliente"); 
        setIsLoading(false); 
        return; 
    }
    
    const newClient = response.data;
    setClientsList([newClient, ...clientsList]);
    setFormData({ ...formData, clientId: newClient.id });
    setClientSearch(newClient.fullName || "");
    setIsNewClientModalOpen(false);
    setIsLoading(false);
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setIsPromoLoading(true);
    const res = await getPromotionByCode(promoCode.toUpperCase());
    if (res.success && res.data) {
      setAppliedPromo(res.data);
    } else {
      alert("Cupón no válido o inexistente.");
      setAppliedPromo(null);
    }
    setIsPromoLoading(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) { alert("Seleccione un cliente."); return; }
    setIsLoading(true);
    const res = await createLoan({ 
      clientId: formData.clientId,
      principalAmount: formData.amount,
      annualRate: formData.interestRate,
      termCount: formData.termMonths,
      amortizationSystem: formData.loanType as any,
      startDate: formData.startDate,
      promotionId: appliedPromo?.id 
    });
    if (!res.success || !res.data) { alert(res.error); setIsLoading(false); return; }
    
    // Abrir comprobante en lugar de irse directo
    setCreatedLoanId(res.data.id);
    setIsReceiptOpen(true);
    setIsLoading(false);
  };
  
  const handleCloseReceipt = () => {
    setIsReceiptOpen(false);
    router.push("/dashboard/loans");
  };

  const selectedClient = clientsList.find(c => c.id === formData.clientId);
  const selectedGuarantor = clientsList.find(c => c.id === formData.guarantorId);

  // Helper to render client summary card
  const ClientSummary = ({ client, isGuarantor = false }: { client: any, isGuarantor?: boolean }) => {
    if (!client) return null;
    const statusColor = client.status === "ACTIVE" ? "text-emerald-500" : "text-rose-500";
    
    return (
      <div className={`p-4 border rounded-2xl bg-background shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${isGuarantor ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
              {(client.fullName || client.nombreCompleto || "?")[0]}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight leading-none">{client.nombreCompleto}</p>
              <p className="text-[11px] opacity-60 font-bold mt-1 uppercase">{client.documento}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => {
            if (isGuarantor) {
              setFormData({...formData, guarantorId: ""});
              setGuarantorSearch("");
            } else {
              setFormData({...formData, clientId: ""});
              setClientSearch("");
            }
          }}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black opacity-40 uppercase">Estado Operativo</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${client.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
              <p className={`text-[11px] font-black uppercase ${statusColor}`}>{client.status === 'ACTIVE' ? 'Habilitado' : 'En Mora'}</p>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black opacity-40 uppercase">Historial Créditos</p>
            <p className="text-[11px] font-black">{client.loans?.length || 0} Registrados</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" className="h-9 text-[10px] font-black uppercase flex-1 gap-2 rounded-xl" onClick={() => setHistoryModal({ open: true, client })}>
            <History className="w-3.5 h-3.5" /> Historial
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase flex-1 gap-2 rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={() => setDetailsModal({ open: true, client })}>
            <Info className="w-3.5 h-3.5" /> FICHA COMPLETA
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-10 h-10 hover:bg-muted" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
               <Activity className="w-5 h-5 text-primary" /> Nuevo Préstamo
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 h-6">{formData.currency}</Badge>
           <Badge variant="outline" className="font-bold border-emerald-500/20 text-emerald-500 bg-emerald-500/5 h-6">{formData.loanType}</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-none border-muted/60">
            <CardHeader className="py-2.5 px-4 bg-muted/10 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" /> Titular
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black opacity-60 uppercase">Cliente Titular</label>
                {!formData.clientId ? (
                  <div className="relative">
                    <Input placeholder="Buscar por Nombre o CI..." className="h-10 text-xs rounded-xl" value={clientSearch} onChange={(e) => {setClientSearch(e.target.value); setIsClientDropdownOpen(true);}} onFocus={() => setIsClientDropdownOpen(true)} />
                    {isClientDropdownOpen && clientSearch.trim() !== "" && (
                      <div className="absolute top-11 left-0 w-full bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {filteredClients.length > 0 ? filteredClients.map(c => (
                          <div key={c.id} className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer flex justify-between items-center group" onClick={() => {setFormData({...formData, clientId: c.id}); setClientSearch(c.nombreCompleto); setIsClientDropdownOpen(false);}}>
                            <div>
                               <p className="text-[11px] font-black group-hover:text-primary transition-colors">{c.nombreCompleto}</p>
                               <p className="text-[9px] opacity-60">{c.documento}</p>
                            </div>
                            <Badge variant="secondary" className="text-[8px] h-4 font-black">{c.status === 'ACTIVE' ? 'SISTEMA OK' : 'EN MORA'}</Badge>
                          </div>
                        )) : (
                          <div className="p-3 text-center text-xs font-bold text-muted-foreground">No se encontraron clientes</div>
                        )}
                        <Button variant="ghost" className="w-full text-[10px] h-10 justify-start font-black text-primary hover:bg-primary/5 rounded-none border-t" onClick={() => setIsNewClientModalOpen(true)}><Plus className="w-4 h-4 mr-2 text-primary"/> REGISTRAR NUEVO CLIENTE</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <ClientSummary client={selectedClient} />
                )}
              </div>

              {formData.clientId && (
                <div className="space-y-2 transition-all">
                  {!isGuarantorEnabled && !formData.guarantorId ? (
                    <Button type="button" variant="outline" size="sm" className="w-full text-[10px] h-9 border-dashed hover:border-emerald-500 hover:text-emerald-600 gap-2 font-black uppercase rounded-2xl transition-all" onClick={() => setIsGuarantorEnabled(true)}>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> + Agregar Garantía Personal
                    </Button>
                  ) : (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black opacity-60 uppercase flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Cliente Garantía</label>
                          {!formData.guarantorId && (
                            <Button type="button" variant="ghost" className="h-4 p-0 text-[9px] text-rose-500 font-black" onClick={() => setIsGuarantorEnabled(false)}>CANCELAR</Button>
                          )}
                       </div>
                       {!formData.guarantorId ? (
                         <div className="relative">
                           <Input placeholder="Buscar garantía..." className="h-10 text-xs rounded-xl" value={guarantorSearch} onChange={(e) => {setGuarantorSearch(e.target.value); setIsGuarantorDropdownOpen(true);}} onFocus={() => setIsGuarantorDropdownOpen(true)} />
                           {isGuarantorDropdownOpen && guarantorSearch.trim() !== "" && (
                             <div className="absolute top-11 left-0 w-full bg-card border rounded-2xl shadow-2xl z-50">
                               {filteredGuarantors.length > 0 ? filteredGuarantors.map(c => (
                                 <div key={c.id} className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer flex justify-between items-center" onClick={() => {setFormData({...formData, guarantorId: c.id}); setGuarantorSearch(c.nombreCompleto); setIsGuarantorDropdownOpen(false);}}>
                                    <div>
                                      <p className="text-[11px] font-black">{c.nombreCompleto}</p>
                                      <p className="text-[9px] opacity-60">{c.documento}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[8px] h-4 font-black">{c.status === 'ACTIVE' ? 'OK' : 'MORA'}</Badge>
                                 </div>
                               )) : (
                                 <div className="p-3 text-center text-xs font-bold text-muted-foreground">No se encontraron garantías</div>
                               )}
                             </div>
                           )}
                         </div>
                       ) : (
                         <ClientSummary client={selectedGuarantor} isGuarantor />
                       )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none border-primary/20 bg-primary/5">
             <CardHeader className="py-2.5 px-4 bg-primary/10 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
                   <TrendingDown className="w-3 h-3" /> Resumen de Liquidación
                </CardTitle>
                <Badge variant="secondary" className="bg-primary/20 text-primary text-[9px] font-bold h-5 uppercase tracking-tighter">Cálculo Francés</Badge>
             </CardHeader>
             <CardContent className="p-5 flex flex-col justify-between h-[calc(100%-45px)]">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black opacity-50 uppercase leading-none">Capital Solicitado</p>
                      <p className="text-sm font-black tracking-tight">{formatCurrency(formData.amount, 'es-UY', formData.currency)}</p>
                   </div>
                   <div className="space-y-0.5 text-right">
                      <p className="text-[9px] font-black opacity-50 uppercase leading-none">Intereses Totales</p>
                      <p className="text-sm font-black text-amber-600">+{formatCurrency(calculations.totalInterest, 'es-UY', formData.currency)}</p>
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black opacity-50 uppercase leading-none">IVA sobre Interés (22%)</p>
                      <p className="text-sm font-black text-rose-500">+{formatCurrency(calculations.iva, 'es-UY', formData.currency)}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black opacity-50 uppercase leading-none">Total Devolución</p>
                      <p className="text-lg font-black text-foreground leading-none">{formatCurrency(calculations.totalToPay, 'es-UY', formData.currency)}</p>
                   </div>
                </div>

                <div className="mt-4 flex items-center justify-between bg-primary/10 border border-primary/20 p-5 rounded-[2.5rem] relative overflow-hidden group shadow-inner">
                   <div className="absolute -top-4 -right-4 p-1 opacity-5 group-hover:opacity-15 transition-opacity duration-700"><Calculator className="w-24 h-24" /></div>
                   <div className="z-10">
                      <p className="text-[11px] font-black text-primary uppercase leading-tight italic opacity-70">Cuota Mensual Fija</p>
                      <p className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(calculations.monthlyPayment, 'es-UY', formData.currency)}</p>
                      <p className="text-[10px] font-black opacity-60 mt-1 uppercase tracking-widest">{formData.termMonths} Pagos Iguales</p>
                   </div>
                   <div className="text-right z-10 hidden md:block">
                      <Badge className="bg-primary text-white text-[11px] font-black px-5 py-2 rounded-full shadow-2xl shadow-primary/30 uppercase">{formData.interestRate}% TASA</Badge>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Cupón de Descuento / Promoción */}
          <Card className="lg:col-span-2 shadow-none border-emerald-500/20 bg-emerald-500/5">
             <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                      <Tag className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-emerald-700 leading-none">¿Tienes un cupón?</p>
                      <p className="text-[9px] font-bold opacity-60 uppercase">Introduce el código de cupón para aplicar beneficios</p>
                   </div>
                </div>
                {!appliedPromo ? (
                   <div className="flex gap-2 w-full sm:w-auto">
                      <Input 
                        placeholder="Código de cupón..." 
                        className="h-10 text-xs font-black tracking-widest uppercase rounded-xl border-emerald-200 bg-white"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-10 px-4 text-xs font-black text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                        onClick={handleApplyPromo}
                        disabled={isPromoLoading}
                      >
                         {isPromoLoading ? "..." : "Aplicar"}
                      </Button>
                   </div>
                ) : (
                   <div className="flex items-center gap-4 bg-white/80 p-2 pl-4 pr-2 rounded-2xl border border-emerald-200 shadow-sm animate-in zoom-in-95">
                      <div className="flex flex-col">
                         <p className="text-[10px] font-black text-emerald-600 uppercase leading-none">{appliedPromo.code}</p>
                         <p className="text-[9px] font-bold opacity-60">{appliedPromo.description}</p>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-black text-[10px] italic">-{appliedPromo.discount}% OFF EN TASA</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={handleRemovePromo}>
                        <X className="w-4 h-4" />
                      </Button>
                   </div>
                )}
             </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-muted/60 relative overflow-hidden">
           <div className="absolute left-0 top-0 w-1.5 h-full bg-primary/40"></div>
           <CardHeader className="py-2.5 px-4 bg-muted/10 border-b">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                 <Calculator className="w-4 h-4" /> Parámetros del Crédito
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 pt-5">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-1">Tipo de Préstamo</label>
                    <select className="flex h-12 w-full rounded-2xl border border-input bg-muted/20 px-4 py-2 text-xs font-black ring-offset-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/40" value={formData.loanType} onChange={(e) => setFormData({...formData, loanType: e.target.value})}>
                      <option value="Amortizable">Amortizable</option>
                      <option value="Plazo Fijo">Plazo Fijo</option>
                      <option value="Amortizable Joven">Amortizable Joven</option>
                      <option value="Descuento de Cheques">Descuento de Cheques</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-1">Moneda Operación</label>
                    <div className="flex bg-muted/20 p-1.5 rounded-2xl border h-12">
                       <button type="button" className={`flex-1 h-full rounded-xl text-[11px] font-black transition-all ${formData.currency === 'UYU' ? 'bg-white shadow-xl text-primary' : 'opacity-40 hover:opacity-100'}`} onClick={() => setFormData({...formData, currency: 'UYU'})}>UYU ($)</button>
                       <button type="button" className={`flex-1 h-full rounded-xl text-[11px] font-black transition-all ${formData.currency === 'USD' ? 'bg-white shadow-xl text-primary' : 'opacity-40 hover:opacity-100'}`} onClick={() => setFormData({...formData, currency: 'USD'})}>USD (U$S)</button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-1">Importe Solicitado</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                       <Input type="number" className="h-12 pl-11 rounded-2xl font-black bg-muted/20 border-muted text-sm shadow-inner" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-1">Cant. Cuotas</label>
                    <Input type="number" className="h-12 rounded-2xl font-black bg-muted/20 border-muted text-sm text-center shadow-inner" value={formData.termMonths} onChange={(e) => setFormData({...formData, termMonths: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60 ml-1">Tasa Interés %</label>
                    <Input type="number" step="0.5" className="h-12 rounded-2xl font-black bg-muted/20 border-muted text-amber-600 text-sm text-center shadow-inner" value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: Number(e.target.value)})} />
                 </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row items-center gap-6 border-t pt-8 border-dashed">
                 <div className="flex-1 flex flex-wrap items-center gap-6">
                    <div className="space-y-2 w-full md:w-auto">
                       <label className="text-[10px] font-black uppercase opacity-60 ml-1">Inicio de Cobranza (Fecha Entrega)</label>
                       <div className="relative">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                          <Input type="date" className="h-12 pl-11 rounded-2xl font-black bg-muted/20 border-muted text-xs shadow-inner" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                       </div>
                    </div>
                    <div className="flex h-12 items-center px-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-[11px] font-black text-orange-600 uppercase tracking-tighter">
                       <CheckCircle2 className="w-4 h-4 mr-3" /> Promoción: 0% Gtos Administrativos
                    </div>
                 </div>
                 <Button type="submit" disabled={isLoading} className="w-full md:w-96 h-16 rounded-[2rem] text-2xl font-black uppercase tracking-tighter gap-3 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03] active:scale-[0.97] hover:brightness-110">
                    <Save className="w-7 h-7" /> {isLoading ? "PROCESANDO..." : "Crear Préstamo"}
                 </Button>
              </div>
           </CardContent>
        </Card>
      </form>

      {/* POPUP: Ficha Completa del Cliente */}
      <Dialog open={detailsModal.open} onOpenChange={(o) => setDetailsModal({...detailsModal, open: o})}>
        <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-3xl">
          <div className="p-8">
            <DialogHeader>
              <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-4xl font-black italic shadow-2xl shadow-primary/30">
                    {(detailsModal.client?.fullName || detailsModal.client?.nombreCompleto || "?")[0]}
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">
                      {detailsModal.client?.nombreCompleto}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full", detailsModal.client?.status === 'ACTIVE' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground")}>
                         {detailsModal.client?.status === 'ACTIVE' ? 'Cliente Habilitado' : 'Situación de Mora'}
                       </Badge>
                       <span className="text-[10px] font-bold opacity-40 ml-2">ID: {detailsModal.client?.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setDetailsModal({...detailsModal, open: false})}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
               <div className="space-y-5">
                  <div className="p-4 bg-muted/30 rounded-2xl space-y-1.5 border border-muted-foreground/5">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> Documento Oficial</p>
                     <p className="font-black text-foreground text-lg tracking-tight">{detailsModal.client?.documento}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl space-y-1.5 border border-muted-foreground/5">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3"/> Residencia</p>
                     <p className="font-black text-foreground text-sm flex items-center gap-2">
                       {detailsModal.client?.ciudad}, {detailsModal.client?.department}
                     </p>
                     <p className="text-[11px] font-bold opacity-60 leading-tight mt-1">{detailsModal.client?.address || detailsModal.client?.streetAndNum || 'Sin dirección exacta'}</p>
                  </div>
               </div>
               <div className="space-y-5">
                  <div className="p-4 bg-muted/30 rounded-2xl space-y-3 border border-muted-foreground/5">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3"/> Contacto Directo</p>
                     <div className="space-y-1.5">
                       {(detailsModal.client?.telefonos || []).map((tel: string, i: number) => (
                         <p key={i} className="font-black text-foreground text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {tel}
                         </p>
                       ))}
                       {(!detailsModal.client?.telefonos || detailsModal.client.telefonos.length === 0) && (
                         <p className="font-bold text-muted-foreground text-xs italic">📞 No hay teléfonos registrados</p>
                       )}
                     </div>
                     <div className="border-t pt-3 mt-2">
                       <p className="font-bold text-muted-foreground text-[11px] flex items-center gap-2">
                         <Mail className="w-3.5 h-3.5" /> {detailsModal.client?.email || '📧 Sin email registrado'}
                       </p>
                     </div>
                  </div>
                  {detailsModal.client?.workData && (
                    <div className="p-4 border-2 border-amber-500/10 bg-amber-500/5 rounded-2xl space-y-1.5">
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3"/> Referencia Laboral</p>
                       <p className="font-black text-foreground text-sm uppercase">{detailsModal.client.workData.company || 'N/A'}</p>
                       <p className="text-[10px] font-bold opacity-60">{detailsModal.client.workData.position || 'Puesto no especificado'}</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950 text-white rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="w-16 h-16"/></div>
               <div className="flex-1">
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Actividad en Sistema</p>
                  <div className="flex gap-8">
                     <div>
                        <p className="text-xs font-bold opacity-60 uppercase">Registrado desde</p>
                        <p className="text-lg font-black">{detailsModal.client?.createdAt ? new Date(detailsModal.client.createdAt).toLocaleDateString() : '-'}</p>
                     </div>
                     <div>
                        <p className="text-xs font-bold opacity-60 uppercase">Total Préstamos</p>
                        <p className="text-lg font-black text-emerald-400">{detailsModal.client?.loans?.length || 0}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/40 border-t flex-col sm:flex-row gap-4">
             <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-muted-foreground hover:bg-muted" onClick={() => setDetailsModal({ open: false, client: null })}>
                Volver al Formulario
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP: Historial de Préstamos */}
      <Dialog open={historyModal.open} onOpenChange={(o) => setHistoryModal({...historyModal, open: o})}>
        <DialogContent className="max-w-2xl bg-card rounded-[3rem] border-none shadow-3xl">
          <div className="p-8">
            <DialogHeader className="border-b pb-6">
              <DialogTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter">
                <History className="w-7 h-7 text-primary" /> Historial de Créditos: {historyModal.client?.nombreCompleto}
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 max-h-[450px] overflow-y-auto scrollbar-thin pr-2">
               {historyModal.client?.loans && historyModal.client.loans.length > 0 ? (
                 <div className="space-y-3">
                   {historyModal.client.loans.map((loan: any) => (
                     <div key={loan.id} className="p-5 rounded-[2rem] bg-muted/30 border border-muted-foreground/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${loan.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                              {loan.currency === 'UYU' ? '$' : 'U$S'}
                           </div>
                           <div>
                              <p className="text-lg font-black tracking-tight">{formatCurrency(loan.amount, 'es-UY', loan.currency)}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-black opacity-40 uppercase">{loan.termMonths} Cuotas Mensuales</p>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <p className="text-[11px] font-black opacity-40 uppercase">Tasa: {loan.interestRate}%</p>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={loan.status === 'ACTIVE' ? 'outline' : 'secondary'} className={cn(
                            "font-black text-[10px] px-4 py-1.5 rounded-full border-2 uppercase tracking-tighter shadow-sm",
                            loan.status === 'ACTIVE' ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "opacity-50"
                          )}>
                            {loan.status === 'ACTIVE' ? 'VIGENTE' : 'FINALIZADO'}
                          </Badge>
                          <p className="text-[9px] font-bold opacity-30 mt-1 uppercase tracking-widest">{new Date(loan.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-20 text-center">
                    <div className="w-24 h-24 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40 shadow-inner">
                      <CreditCard className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-black text-muted-foreground uppercase tracking-widest">Sin antecedentes financieros</p>
                 </div>
               )}
            </div>
            <DialogFooter className="border-t pt-6">
              <Button className="w-full h-16 rounded-[2rem] font-black uppercase text-base tracking-widest bg-slate-900 shadow-xl" onClick={() => setHistoryModal({ open: false, client: null })}>Entendido, Volver</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL NUEVO CLIENTE */}
      <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh]"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsNewClientModalOpen(false);
          }}
        >
          <div className="p-6 overflow-y-auto flex-1">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 font-black italic uppercase">Nuevo Prestatario</DialogTitle>
            <DialogDescription>Ingrese los datos personales para el alta en el sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button 
                className={cn("flex-1 py-1.5 text-xs font-bold rounded-md uppercase transition-all", newClientForm.type === "PERSONA" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-slate-700")}
                onClick={() => setNewClientForm({...newClientForm, type: "PERSONA", documentType: "CI", apellido: ""})}
              >
                Persona Física
              </button>
              <button 
                className={cn("flex-1 py-1.5 text-xs font-bold rounded-md uppercase transition-all", newClientForm.type === "EMPRESA" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-slate-700")}
                onClick={() => setNewClientForm({...newClientForm, type: "EMPRESA", documentType: "RUT", apellido: ""})}
              >
                Razón Social
              </button>
            </div>

            <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
              {newClientForm.type === "PERSONA" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Nombres *</label>
                      <Input value={newClientForm.nombre} onChange={e => setNewClientForm({...newClientForm, nombre: e.target.value})} placeholder="Ej: Juan Ignacio" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Apellidos *</label>
                      <Input value={newClientForm.apellido} onChange={e => setNewClientForm({...newClientForm, apellido: e.target.value})} placeholder="Ej: Pérez Rodriguez" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Sexo</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={newClientForm.sex}
                        onChange={(e) => setNewClientForm({...newClientForm, sex: e.target.value})}
                      >
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMENINO">Femenino</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Nacimiento</label>
                      <Input type="date" value={newClientForm.birthDate} onChange={e => setNewClientForm({...newClientForm, birthDate: e.target.value})} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nombre de Razón Social / Empresa *</label>
                  <Input value={newClientForm.nombre} onChange={e => setNewClientForm({...newClientForm, nombre: e.target.value})} placeholder="Ej: Sinergia S.A." />
                </div>
              )}

              <div className="grid grid-cols-[100px_1fr] gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Tipo Doc.</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newClientForm.documentType}
                    onChange={(e) => setNewClientForm({...newClientForm, documentType: e.target.value})}
                  >
                    <option value="CI">C.I.</option>
                    <option value="RUT">RUT</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground text-right w-full block border-b pb-1 mb-1 border-transparent">
                    {newClientForm.documentType === 'CI' ? 'Número (Sin Puntos ni Guiones)' : 'Nro. de Documento'} *
                  </label>
                  <div className="relative">
                    <Input 
                      value={newClientForm.documento} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        setNewClientForm({...newClientForm, documento: val});
                        if(formError) setFormError("");
                      }} 
                      placeholder={newClientForm.documentType === 'CI' ? "12345678" : "12 dígitos de RUT"} 
                      className={cn(
                        "pr-10",
                        formError ? "border-rose-500 focus-visible:ring-rose-500/20" : 
                        (newClientForm.documentType === 'CI' && newClientForm.documento.length >= 7 && validateCI(newClientForm.documento)) ? "border-emerald-500 border-2" : 
                        (newClientForm.documentType === 'RUT' && validateRUT(newClientForm.documento)) ? "border-emerald-500 border-2" : ""
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                       {newClientForm.documentType === 'CI' && newClientForm.documento.length >= 7 && (
                         validateCI(newClientForm.documento) ? 
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                         <AlertCircle className="w-4 h-4 text-rose-500" />
                       )}
                       {newClientForm.documentType === 'RUT' && newClientForm.documento.length === 12 && (
                         validateRUT(newClientForm.documento) ? 
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                         <AlertCircle className="w-4 h-4 text-rose-500" />
                       )}
                    </div>
                  </div>
                </div>
              </div>
              {formError && <p className="text-[10px] text-rose-600 font-bold uppercase italic mt-0">{formError}</p>}
            </div>

            <div className="space-y-4 rounded-xl border p-4 bg-muted/20 mt-2">
               <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                 <MapPin className="w-3 h-3" /> Domicilio
               </h4>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase text-muted-foreground">Departamento</label>
                   <select 
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                     value={newClientForm.department}
                     onChange={(e) => {
                       const dept = e.target.value;
                       setNewClientForm({
                         ...newClientForm, 
                         department: dept, 
                         ciudad: URUGUAY_CITIES[dept] && URUGUAY_CITIES[dept].length > 0 ? URUGUAY_CITIES[dept][0] : ""
                       });
                     }}
                   >
                     {Object.keys(URUGUAY_CITIES).map((dept) => (
                       <option key={dept} value={dept}>{dept}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase text-muted-foreground">Ciudad / Localidad</label>
                   <select
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                     value={newClientForm.ciudad}
                     onChange={(e) => setNewClientForm({...newClientForm, ciudad: e.target.value})}
                   >
                     <option value="" disabled>Seleccione una opción</option>
                     {(URUGUAY_CITIES[newClientForm.department] || []).map(city => (
                       <option key={city} value={city}>{city}</option>
                     ))}
                   </select>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Calle y Número de Puerta (Apto.)</label>
                 <Input value={newClientForm.streetAndNum} onChange={e => setNewClientForm({...newClientForm, streetAndNum: e.target.value})} className="text-xs" placeholder="Ej: Av. 18 de Julio 1234 Apto 502" />
               </div>
            </div>
            {/* SECCIÓN DINÁMICA DE TELÉFONOS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground">Teléfonos de Contacto</label>
                <Button variant="ghost" size="sm" className="h-6 text-emerald-600 gap-1 text-[10px]" onClick={() => setNewClientForm({...newClientForm, telefonos: [...newClientForm.telefonos, ""]})}>
                  <Plus className="w-3 h-3" /> Añadir
                </Button>
              </div>
              {newClientForm.telefonos.map((tel, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input 
                    value={tel} 
                    onChange={e => {
                      const newTels = [...newClientForm.telefonos];
                      newTels[idx] = e.target.value;
                      setNewClientForm({...newClientForm, telefonos: newTels});
                    }} 
                    placeholder="09X XXX XXX" 
                  />
                  {newClientForm.telefonos.length > 1 && (
                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => {
                      const newTels = newClientForm.telefonos.filter((_, i) => i !== idx);
                      setNewClientForm({...newClientForm, telefonos: newTels});
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* SECCIÓN DINÁMICA DE EMAILS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground">Correos Electrónicos</label>
                <Button variant="ghost" size="sm" className="h-6 text-blue-600 gap-1 text-[10px]" onClick={() => setNewClientForm({...newClientForm, emails: [...newClientForm.emails, ""]})}>
                  <Plus className="w-3 h-3" /> Añadir
                </Button>
              </div>
              {newClientForm.emails.map((em, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input 
                    value={em} 
                    onChange={e => {
                      const newEmails = [...newClientForm.emails];
                      newEmails[idx] = e.target.value;
                      setNewClientForm({...newClientForm, emails: newEmails});
                    }} 
                    placeholder="correo@ejemplo.com" 
                  />
                  {newClientForm.emails.length > 1 && (
                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => {
                      const newEmails = newClientForm.emails.filter((_, i) => i !== idx);
                      setNewClientForm({...newClientForm, emails: newEmails});
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          </div>
          <DialogFooter className="p-4 sm:p-6 bg-muted/40 border-t mt-auto flex gap-2">
            <Button variant="outline" onClick={() => setIsNewClientModalOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateClient} disabled={isLoading}>{isLoading ? "GUARDANDO..." : "Guardar Cliente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP: Comprobante de Entrega */}
      <Dialog open={isReceiptOpen} onOpenChange={(o) => {
        if (!o) handleCloseReceipt();
      }}>
        <DialogContent className="max-w-md bg-white text-black p-0 overflow-hidden shadow-2xl rounded-none">
          <div className="p-8 pb-4 print:p-0 print:shadow-none" id="printable-receipt">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter">CRE<span className="text-emerald-500">SER</span></h2>
              <p className="text-[10px] font-bold uppercase opacity-60">Comprobante de Entrega de Préstamo (Sistema Francés)</p>
            </div>
            
            <div className="space-y-4 text-sm font-medium border-y border-dashed border-slate-300 py-4 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">Fecha:</span>
                <span className="font-black">{new Date().toLocaleDateString('es-UY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">Nro Préstamo / ID:</span>
                <span className="font-black uppercase">{createdLoanId?.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">Cliente:</span>
                <span className="font-black">{selectedClient?.nombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">Documento:</span>
                <span className="font-black">{selectedClient?.documento}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-[10px] font-bold uppercase">Capital Cedido:</span>
                <span className="font-black text-lg">{formatCurrency(formData.amount, 'es-UY', formData.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-[10px] font-bold uppercase">Tasa de Interés (TEA):</span>
                <span className="font-black">{formData.interestRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-[10px] font-bold uppercase">Plazo Contratado:</span>
                <span className="font-black">{formData.termMonths} Pagos Mensuales</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-1">
                <span className="text-black text-xs font-black uppercase">Cuota Mensual Fija:</span>
                <span className="font-black text-xl text-emerald-600">{formatCurrency(calculations.monthlyPayment, 'es-UY', formData.currency)}</span>
              </div>
            </div>

            <div className="text-center pt-8 pb-4">
               <div className="w-48 border-t-2 border-slate-300 mx-auto mb-2"></div>
               <p className="text-[10px] font-black uppercase text-slate-500">Firma del Titular</p>
               <p className="text-[8px] mt-4 opacity-50 px-4">Este documento es emitido momentáneamente a modo de comprobante de desembolso para control de caja.</p>
            </div>
          </div>
          <DialogFooter className="p-4 bg-slate-100 flex-col sm:flex-row gap-2 print:hidden">
            <Button variant="outline" className="flex-1 font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 h-12" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12" onClick={handleCloseReceipt}>
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
