"use client";

import { useState, useMemo, Suspense } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  History as HistoryIcon,
  PlusCircle,
  Terminal,
  Save
} from "lucide-react";
import { VirtualTable } from "@/components/ui/virtual-table";
import { LoanDrawer } from "@/components/loans/loan-drawer";
import { ClientDetailDrawer } from "@/components/clients/client-detail-drawer";
import { EmployerSelector } from "@/components/employers/employer-selector";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useSearch } from "@/store/search-context";
import { useAuth } from "@/store/auth-context";
import { validateCI, formatCI, validateRUT, formatRUT } from "@/lib/ci-validator";
import { cn, formatCurrency, normalizeSearch } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getClients, createClient, updateClient, deleteClient } from "@/app/actions/client-actions";
import { getClientMemo } from "@/app/actions/memo-actions";

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

function ClientsContent() {
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [localSearch, setLocalSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [clientMemo, setClientMemo] = useState<any>(null);
  const [isSyncingMemo, setIsSyncingMemo] = useState(false);

  // Estados para paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estado Formulario Nuevo/Edición
  const [formData, setFormData] = useState({
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
    },
    employerId: "",
    employerName: "",
    remarkCategory: ""
  });

  const [isWorkDataModalOpen, setIsWorkDataModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const viewParam = searchParams.get('view');
  const router = useRouter();

  // EFECTO PARA CARGAR CLIENTES DESDE DB CON PAGINACIÓN Y BÚSQUEDA
  const loadClients = async (pageNum = 1, search = "") => {
    setIsLoading(true);
    const result = await getClients(pageNum, search, clientId || undefined);
    setClients(result.clients);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
    setPage(result.page);
    setIsLoading(false);
  };

  // EFECTO PARA SINCRONIZAR ESTADO INICIAL DESDE URL
  useEffect(() => {
    const urlSearch = searchParams.get('q');
    const urlPage = searchParams.get('page');
    
    if (urlSearch) setLocalSearch(urlSearch);
    if (urlPage) setPage(parseInt(urlPage) || 1);
  }, []); // Solo al montar

  // Debounce para búsqueda y actualización de URL
  useEffect(() => {
    const query = (localSearch || searchQuery).trim();
    
    // Minimum 2 chars to initiate a search; if empty, reset to default view
    if (query !== "" && query.length < 2) return;

    const timer = setTimeout(() => {
      loadClients(page, query);
      
      // Actualizar URL sin recargar para persistir estado
      const params = new URLSearchParams(window.location.search);
      if (query) params.set('q', query); else params.delete('q');
      params.set('page', page.toString());
      if (clientId) params.set('clientId', clientId);
      
      window.history.replaceState(null, '', `?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, page, clientId]);


  // Recarga cuando cambia la página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadClients(newPage, localSearch || searchQuery);
    }
  };

  useEffect(() => {
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        if (viewParam === 'full') {
           openDetails(client);
        } else {
           setSelectedClient(client);
           setIsDetailsDrawerOpen(true);
        }
      }
    }
  }, [clientId, clients, viewParam]);

  const orderedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  }, [clients]);

  // HELPER: Verificar completitud del perfil
  const getProfileCompleteness = (client: any) => {
    if (!client) return { score: 0, missing: [] };
    const missing: string[] = [];
    let score = 100;

    if (!client.telefonos || client.telefonos.length === 0 || (client.telefonos.length === 1 && !client.telefonos[0])) {
      missing.push("Teléfono");
      score -= 20;
    }
    if (!client.email) {
      missing.push("Email");
      score -= 15;
    }
    if (!client.ciudad || client.ciudad === "NULL") {
      missing.push("Ciudad");
      score -= 15;
    }
    if (!client.department || client.department === "NULL") {
      missing.push("Departamento");
      score -= 15;
    }
    if (!client.streetAndNum || client.streetAndNum === "NULL") {
      missing.push("Dirección");
      score -= 20;
    }
    if (!client.birthDate) {
      missing.push("Fecha Naci.");
      score -= 15;
    }

    return { score: Math.max(0, score), missing };
  };

  const filteredClients = orderedClients; // El filtrado ocurre en el servidor via loadClients debounced

  const openDetails = async (client: any) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
    setClientMemo(null); // Reset memo state before fetch

    // Fetch/Sync memo on open (Stage A Auto-sync)
    if (client.id) {
      setIsSyncingMemo(true);
      const memo = await getClientMemo(client.id);
      setClientMemo(memo);
      setIsSyncingMemo(false);
    }
  };

  // Manejadores de Acciones
  const handleAddClient = async () => {
    const cleanDoc = formData.documento.replace(/\D/g, "");

    // Validación Dinámica
    if (formData.type === "PERSONA" && formData.documentType === "CI") {
      if (!validateCI(cleanDoc)) {
        setFormError("Cédula de Identidad inválida. Verifique el dígito verificador.");
        return;
      }
    } else if (formData.documentType === "RUT") {
      if (!validateRUT(cleanDoc)) {
        setFormError("RUT no válido. Debe contener 12 dígitos y formato correcto.");
        return;
      }
    }

    const formattedDoc = formData.documentType === "CI" ? formatCI(cleanDoc) : formatRUT(cleanDoc);

    const response = await createClient({
      type: formData.type,
      documentType: formData.documentType,
      sex: formData.sex,
      birthDate: formData.birthDate,
      department: formData.department,
      ciudad: formData.ciudad,
      streetAndNum: formData.streetAndNum,
      nombre: formData.nombre,
      apellido: formData.apellido,
      documento: formattedDoc,
      telefonos: formData.telefonos.filter(t => t.trim() !== ""),
      emails: formData.emails.filter(e => e.trim() !== ""),
      workData: formData.workData,
      employerId: formData.employerId === "" ? null : formData.employerId,
      branchId: null // El branchId se conectará del backend luego
    });

    if (!response.success) {
      setFormError(response.error || "Ocurrió un error desconocido.");
      return;
    }

    setIsAddModalOpen(false);
    resetForm();
    loadClients(1, ""); // Recarga la primera página sin búsqueda
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    const res = await deleteClient(selectedClient.id);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setLogs([{ action: "DELETE", client: selectedClient.nombreCompleto, user: user?.name || "Sistema", date: new Date().toLocaleString() }, ...logs]);
    setIsDeleteModalOpen(false);
    setSelectedClient(null);
    loadClients();
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    const cleanDoc = formData.documento.replace(/\D/g, "");

    if (formData.type === "PERSONA" && formData.documentType === "CI") {
      if (!validateCI(cleanDoc)) {
        setFormError("Cédula de Identidad inválida. Verifique el dígito verificador.");
        return;
      }
    } else if (formData.documentType === "RUT") {
      if (!validateRUT(cleanDoc)) {
        setFormError("RUT no válido. Debe contener 12 dígitos.");
        return;
      }
    }

    const formattedDoc = formData.documentType === "CI" ? formatCI(cleanDoc) : formatRUT(cleanDoc);

    const res = await updateClient(selectedClient.id, {
      type: formData.type,
      documentType: formData.documentType,
      sex: formData.sex,
      birthDate: formData.birthDate,
      department: formData.department,
      ciudad: formData.ciudad,
      streetAndNum: formData.streetAndNum,
      nombre: formData.nombre,
      apellido: formData.apellido,
      documento: formattedDoc,
      telefonos: formData.telefonos.filter(t => t.trim() !== ""),
      emails: formData.emails.filter(e => e.trim() !== ""),
      workData: formData.workData,
      employerId: formData.employerId === "" ? null : formData.employerId,
      branchId: null, // El backend mantendrá el branch actual o usará null
      status: selectedClient.status,
      remarkCategory: formData.remarkCategory === "" ? null : formData.remarkCategory
    });

    if (!res.success) {
      alert(res.error);
      return;
    }

    setLogs([{ action: "UPDATE", client: `${formData.nombre} ${formData.apellido}`, user: user?.name || "Sistema", date: new Date().toLocaleString() }, ...logs]);
    setIsEditModalOpen(false);
    resetForm();
    loadClients();
  };

  const resetForm = () => {
    setFormData({
      type: "PERSONA",
      documentType: "CI",
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
      employerId: "",
      employerName: "",
      workData: { company: "", position: "", salary: "", phone: "", startDate: "" },
      remarkCategory: ""
    });
    setFormError("");
  };

  const openEdit = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setFormData({
      type: client.type || "PERSONA",
      documentType: client.documentType || "CI",
      sex: client.sex || "MASCULINO",
      birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : "",
      nombre: client.nombre,
      apellido: client.apellido || "",
      documento: client.documento.replace(/\D/g, ""),
      telefonos: client.telefonos?.length ? client.telefonos : [client.telefono || ""],
      emails: client.emails?.length ? client.emails : [client.email || ""],
      ciudad: client.ciudad || "",
      department: client.department || "Montevideo",
      streetAndNum: client.streetAndNum || "",
      employerId: client.employerId || "",
      employerName: client.employer?.employerName || client.workplaceName || "",
      workData: client.workData || { company: client.workplaceName || "", position: client.jobTitle || "", salary: "", phone: client.workData?.phone || "", startDate: "" },
      remarkCategory: client.remarkCategory || ""
    });
    setIsEditModalOpen(true);
  };

  const openDelete = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const stats = useMemo(() => {
    // Para simplificar, usamos los totales de la base de datos que ya tenemos para el total principal
    return [
      { label: "Total Prestatarios", value: totalItems, icon: UserPlus, bg: "bg-emerald-600", description: "Base total de clientes registrados en el sistema." },
      { label: "Clientes Activos", value: "-", icon: CheckCircle2, bg: "bg-emerald-600", description: "Clientes con perfil habilitado para operar." },
      { label: "Con Créditos", value: "-", icon: CreditCard, bg: "bg-emerald-600", description: "Clientes con al menos un préstamo histórico o vigente." },
      { label: "En Mora", value: "-", icon: AlertCircle, bg: "bg-emerald-600", description: "Clientes que presentan atrasos en sus pagos." },
    ];
  }, [totalItems]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative pl-4 border-l-4 border-emerald-500/30 py-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-foreground">
            Cartera de <span className="text-emerald-500">Clientes</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black text-emerald-500/60 uppercase tracking-[0.3em] mt-1">
            Gestión Integral • <span className="text-emerald-400">{totalItems}</span> Perfiles Registrados
          </p>
        </div>
        <Button className="h-14 gap-3 bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 font-black uppercase text-[11px] rounded-2xl px-10 border-none ring-offset-background transition-all w-full sm:w-auto tracking-[0.2em] active:scale-95 group" onClick={() => {
          resetForm();
          setIsAddModalOpen(true);
        }}>
          <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className={cn(
              "border-2 border-emerald-500/10 shadow-2xl transition-all duration-500 group overflow-hidden relative bg-slate-900/40 backdrop-blur-md hover:border-emerald-500/30 hover:-translate-y-2 cursor-pointer",
              stat.label === "En Mora" ? "border-rose-500/10 hover:border-rose-500/30" : ""
            )}
          >
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 transition-transform group-hover:scale-150 rounded-full blur-3xl",
                stat.label === "En Mora" ? "bg-rose-500" : "bg-emerald-500"
            )} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60 group-hover:text-emerald-400 transition-colors">{stat.label}</CardTitle>
              <div className={cn(
                  "p-2.5 rounded-xl transition-all group-hover:rotate-12",
                  stat.label === "En Mora" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
              )}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black tracking-tighter text-foreground group-hover:scale-110 transition-transform origin-left">
                {stat.value}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant="outline" className={cn(
                    "text-[8px] font-black border-none px-2.5 h-6 uppercase tracking-widest",
                    stat.label === "En Mora" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  Sistema Live
                </Badge>
                <div className="group/tooltip relative">
                  <AlertCircle className="w-4 h-4 text-slate-600 hover:text-emerald-500 cursor-help transition-colors" />
                  <div className="absolute bottom-8 right-0 w-56 p-4 bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/20 rounded-2xl shadow-2xl scale-0 group-hover/tooltip:scale-100 transition-all origin-bottom-right z-[100]">
                    <p className="text-[10px] text-emerald-100 font-bold leading-relaxed uppercase tracking-tighter italic">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-emerald-500/10 bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-500/10 bg-slate-900/40 p-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-12 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-foreground italic">
                Base Centralizada de <span className="text-emerald-500">Prestatarios</span>
              </CardTitle>
              <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mt-1">Organización inteligente • Motor Local de Búsqueda</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                placeholder="BUSCAR POR CÉDULA, NOMBRE O EMPRESA..."
                className="w-full sm:w-80 pl-12 pr-4 h-12 bg-slate-950/60 border-2 border-slate-800 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 text-emerald-400 placeholder:text-slate-600 shadow-inner rounded-2xl transition-all outline-none text-[11px] font-black uppercase tracking-widest"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-slate-900/20 flex items-center gap-3 border-b border-emerald-500/5">
            <Badge className="bg-emerald-950/40 text-emerald-500 border-2 border-emerald-500/10 shadow-lg font-black rounded-xl py-1.5 px-4 text-[10px] tracking-widest uppercase italic">
              Página {page} de {totalPages} • {totalItems} Registros
            </Badge>
            {clientId && (
              <Badge
                className="gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 border-2 border-amber-500/20 shadow-lg font-black rounded-xl cursor-pointer hover:bg-amber-500/20 transition-all uppercase text-[9px] tracking-widest"
                onClick={() => router.push('/dashboard/clients')}
              >
                FILTRO ACTIVO <X className="w-3 h-3" />
              </Badge>
            )}
          </div>


          <div className="max-h-[650px] overflow-auto scrollbar-thin">
            <div className="p-0">
              <VirtualTable
                data={filteredClients}
                className="h-[600px] border-none"
                rowHeight={70}
                onRowClick={(client) => {
                  setSelectedClient(client);
                  setIsDetailsDrawerOpen(true);
                }}
                columns={[
                  {
                    header: "Cliente",
                    width: "300px",
                    cell: (client) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                          {(client.nombreCompleto || client.fullName || "?")[0]}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                              {client.nombreCompleto}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {client.isLegacy && (
                              <Badge variant="outline" className="h-4 px-1 pf-0.5 text-[7px] font-black border-rose-200 text-rose-600 bg-rose-50/50 uppercase leading-none">
                                SISTEMA VIEJO
                              </Badge>
                            )}
                            {client.remarkCategory && (
                               <Badge className={cn(
                                "h-4 px-1 text-[7px] font-black uppercase leading-none",
                                client.remarkCategory === 'Fallecido' ? "bg-slate-900 text-white" : 
                                client.remarkCategory === 'Clearing' ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                              )}>
                                {client.remarkCategory}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-2 h-2 text-rose-500" /> {client.ciudad}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: "Documento",
                    width: "150px",
                    cell: (client) => (
                      <Badge variant="secondary" className="font-mono text-[11px] font-black tracking-tighter bg-muted/50">
                        {client.documento}
                      </Badge>
                    )
                  },
                  {
                    header: "Actividad",
                    width: "180px",
                    cell: (client) => (
                      <div className="flex flex-col gap-1 w-full pr-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black opacity-50 uppercase">Créditos</span>
                          <span className="text-[10px] font-black text-primary">{client.loans?.length || 0}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min((client.loans?.length || 0) * 20, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  },
                  {
                    header: "Contacto",
                    cell: (client) => (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                          <Phone className="w-3 h-3 text-emerald-500" /> {client.telefonos?.[0] || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-medium text-muted-foreground/60">
                          <Mail className="w-3 h-3" /> {client.email || 'N/A'}
                        </div>
                      </div>
                    )
                  },
                  {
                    header: "Acciones",
                    width: "250px",
                    cell: (client) => (
                      <div className="flex items-center justify-end gap-2 w-full">
                        <LoanDrawer
                          clientId={client.id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 gap-2 text-primary hover:bg-primary/5 font-black text-[9px] uppercase border border-primary/10 rounded-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> Nuevo Crédito
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={(e) => openEdit(client, e)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl" onClick={(e) => openDelete(client, e)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground font-bold uppercase">
              MOSTRANDO {clients.length} DE {totalItems} RESULTADOS
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="h-8 px-4 font-black text-[10px] uppercase"
              >
                Anterior
              </Button>
              <div className="flex items-center px-3 bg-muted rounded-lg text-[10px] font-black">
                {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 px-4 font-black text-[10px] uppercase"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClientDetailDrawer 
        client={selectedClient}
        isOpen={isDetailsDrawerOpen}
        onOpenChange={(open) => {
          setIsDetailsDrawerOpen(open);
          if (!open && clientId) {
            router.push('/dashboard/clients');
          }
        }}
      />

      {/* MODAL NUEVO CLIENTE */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh] border-none rounded-3xl shadow-2xl"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsAddModalOpen(false);
          }}
        >
          <div className="bg-slate-950 flex-1 overflow-y-auto">
            <DialogHeader className="p-6 bg-slate-900 border-b border-emerald-500/20">
              <DialogTitle className="text-emerald-500 font-black italic uppercase flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <UserPlus className="w-5 h-5" />
                </div>
                Nuevo Cliente
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mt-1 pl-12">
                Registro de perfil • Sistema Local
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-900 rounded-2xl border border-emerald-500/10">
                <button
                  className={cn("flex-1 py-2 text-[10px] font-black rounded-xl uppercase transition-all tracking-widest", formData.type === "PERSONA" ? "bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white" : "text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5")}
                  onClick={() => setFormData({ ...formData, type: "PERSONA", documentType: "CI" })}
                >
                  Persona Física
                </button>
                <button
                  className={cn("flex-1 py-2 text-[10px] font-black rounded-xl uppercase transition-all tracking-widest", formData.type === "EMPRESA" ? "bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white" : "text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5")}
                  onClick={() => setFormData({ ...formData, type: "EMPRESA", documentType: "RUT", apellido: "" })}
                >
                  Razón Social
                </button>
              </div>

              {/* DEDICATED SECTION: ESTADO / ALERTAS (ADMINISTRATIVE CONDITION) - TOP PLACEMENT */}
              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-900 border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Condición Administrativa / Alertas
                  </h4>
                  {formData.remarkCategory && (
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md",
                      formData.remarkCategory === 'Fallecido' ? "bg-slate-700 text-white font-black uppercase" : 
                      formData.remarkCategory === 'Clearing' ? "bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)] font-black uppercase" : "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black uppercase"
                    )}>
                      {formData.remarkCategory.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <select
                    className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-tight border-2 border-slate-800 bg-slate-950 text-emerald-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none px-4 cursor-pointer"
                    value={formData.remarkCategory}
                    onChange={(e) => setFormData({ ...formData, remarkCategory: e.target.value })}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">[ESTADO NORMAL / SIN ALERTAS]</option>
                    <option value="Clearing" className="bg-slate-900 text-rose-500">CLEARING (INCUMPLIMIENTO)</option>
                    <option value="PF" className="bg-slate-900 text-amber-500">PF (PROBLEMA FINANCIERO)</option>
                    <option value="Fallecido" className="bg-slate-900 text-slate-300">FALLECIDO</option>
                  </select>
                  <p className="text-[9px] text-emerald-500/40 font-bold italic mt-2 leading-tight px-1 uppercase tracking-tighter">
                    Defina el estado administrativo crítico para este perfil.
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-emerald-500/10 mb-4">
                  <span className="text-[10px] font-black uppercase text-emerald-500/60 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> SUCURSAL DE ALTA:
                  </span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-tight">{user?.branch || 'Central (Administración)'}</span>
                </div>

                {formData.type === "PERSONA" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nombres *</label>
                        <Input 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                          value={formData.nombre} 
                          onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                          placeholder="Ej: Juan Ignacio" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Apellidos *</label>
                        <Input 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                          value={formData.apellido} 
                          onChange={e => setFormData({ ...formData, apellido: e.target.value })} 
                          placeholder="Ej: Pérez Rodriguez" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Sexo</label>
                        <select
                          className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold px-3 text-emerald-500 outline-none flex items-center transition-all"
                          value={formData.sex}
                          onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        >
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMENINO">Femenino</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nacimiento</label>
                        <Input 
                          type="date" 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 [color-scheme:dark] transition-all"
                          value={formData.birthDate} 
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nombre / Razón Social *</label>
                    <Input 
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                      value={formData.nombre} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                      placeholder="Ej: Sinergia S.A." 
                    />
                  </div>
                )}

                <div className="grid grid-cols-[100px_1fr] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Tipo Doc.</label>
                    <select
                      className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold px-3 text-emerald-500 outline-none transition-all"
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    >
                      <option value="CI">C.I.</option>
                      <option value="RUT">RUT</option>
                      <option value="PASAPORTE">PASAPORTE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1 text-right w-full block border-b pb-1 mb-1 border-transparent">
                      {formData.documentType === 'CI' ? 'Número de Documento' : 'RUT'} *
                    </label>
                    <div className="relative">
                      <Input
                        className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 tracking-widest transition-all"
                        value={formData.documento}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          setFormData({ ...formData, documento: val });
                          if (formError) setFormError("");
                        }}
                        placeholder={formData.documentType === 'CI' ? "12345678" : "12 dígitos de RUT"}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {formData.documentType === 'CI' && formData.documento.length >= 7 && (
                          validateCI(formData.documento) ?
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                        {formData.documentType === 'RUT' && formData.documento.length === 12 && (
                          validateRUT(formData.documento) ?
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {formError && <p className="text-[10px] text-rose-600 font-black uppercase italic mt-1 px-1">{formError}</p>}

                {formData.type === "PERSONA" && (
                  <div className="pt-4 border-t border-emerald-500/10 mt-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="h-11 gap-3 px-5 rounded-2xl border-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/5" 
                      onClick={() => setIsWorkDataModalOpen(true)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Gestionar Datos Laborales
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MapPin className="w-3.5 h-3.5" /> Domicilio
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Departamento</label>
                    <select
                      className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-[11px] font-black px-3 text-emerald-500 outline-none transition-all"
                      value={formData.department}
                      onChange={(e) => {
                        const dept = e.target.value;
                        setFormData({
                          ...formData,
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
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Ciudad / Localidad</label>
                    <select
                      className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-[11px] font-black px-3 text-emerald-500 outline-none transition-all"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      {(URUGUAY_CITIES[formData.department] || []).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Calle y Número de Puerta (Apto.)</label>
                  <Input 
                    className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 transition-all uppercase"
                    value={formData.streetAndNum} 
                    onChange={e => setFormData({ ...formData, streetAndNum: e.target.value })} 
                    placeholder="Ej: Av. 18 de Julio 1234 Apto 502" 
                  />
                </div>
              </div>
              
              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Teléfonos de Contacto</label>
                  <Button variant="ghost" size="sm" className="h-8 text-emerald-500 gap-1.5 text-[10px] font-black border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all uppercase tracking-widest" onClick={() => setFormData({ ...formData, telefonos: [...formData.telefonos, ""] })}>
                    <Plus className="w-3.5 h-3.5" /> Añadir
                  </Button>
                </div>
                {formData.telefonos.map((tel, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 tracking-widest transition-all"
                      value={tel}
                      onChange={e => {
                        const newTels = [...formData.telefonos];
                        newTels[idx] = e.target.value;
                        setFormData({ ...formData, telefonos: newTels });
                      }}
                      placeholder="09X XXX XXX"
                    />
                    {formData.telefonos.length > 1 && (
                      <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all" onClick={() => {
                        const newTels = formData.telefonos.filter((_, i) => i !== idx);
                        setFormData({ ...formData, telefonos: newTels });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Correos Electrónicos</label>
                  <Button variant="ghost" size="sm" className="h-8 text-emerald-500 gap-1.5 text-[10px] font-black border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all uppercase tracking-widest" onClick={() => setFormData({ ...formData, emails: [...formData.emails, ""] })}>
                    <Plus className="w-3.5 h-3.5" /> Añadir
                  </Button>
                </div>
                {formData.emails.map((em, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 transition-all"
                      value={em}
                      onChange={e => {
                        const newEmails = [...formData.emails];
                        newEmails[idx] = e.target.value;
                        setFormData({ ...formData, emails: newEmails });
                      }}
                      placeholder="correo@ejemplo.com"
                    />
                    {formData.emails.length > 1 && (
                      <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all" onClick={() => {
                        const newEmails = formData.emails.filter((_, i) => i !== idx);
                        setFormData({ ...formData, emails: newEmails });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-900 border-t border-emerald-500/10 mt-auto flex gap-3">
            <Button 
                variant="ghost" 
                className="flex-1 rounded-2xl font-black uppercase text-[10px] h-12 text-slate-400 hover:bg-slate-800 transition-all tracking-[0.2em]"
                onClick={() => setIsAddModalOpen(false)}
            >
                Cancelar
            </Button>
            <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] h-12 gap-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 tracking-[0.2em]" 
                onClick={handleAddClient}
            >
                <PlusCircle className="w-4 h-4" />
                Guardar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALLES DEL CLIENTE (Popup al hacer clic) */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-black italic shadow-lg shadow-emerald-200">
                  {selectedClient?.nombre?.charAt(0) || selectedClient?.nombreCompleto?.charAt(0)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    {selectedClient?.nombreCompleto || `${selectedClient?.nombre} ${selectedClient?.apellido}`}
                  </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn(
                        "text-[9px] font-bold uppercase",
                        selectedClient?.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-muted text-muted-foreground"
                      )}>
                        {selectedClient?.status === 'ACTIVE' ? 'Cliente Activo' : 'Cliente Inactivo'}
                      </Badge>
                      {selectedClient?.remarkCategory && (
                        <Badge className={cn(
                          "text-[9px] font-black uppercase",
                          selectedClient.remarkCategory === 'Fallecido' ? "bg-slate-900 text-white" : 
                          selectedClient.remarkCategory === 'Clearing' ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                        )}>
                          {selectedClient.remarkCategory}
                        </Badge>
                      )}
                      {getProfileCompleteness(selectedClient).score < 100 && (
                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                          Perfil Incompleto ({getProfileCompleteness(selectedClient).score}%)
                        </Badge>
                      )}
                    </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* BANNER DE DATOS FALTANTES */}
          {getProfileCompleteness(selectedClient).missing.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase leading-none">Atención: Faltan Datos</p>
                  <p className="text-[11px] font-medium text-amber-700 mt-1">
                    Campos pendientes: <span className="font-bold">{getProfileCompleteness(selectedClient).missing.join(", ")}</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-sm"
                onClick={(e) => {
                  setIsDetailsModalOpen(false);
                  openEdit(selectedClient, e as any);
                }}
              >
                Completar Ahora
              </Button>
            </div>
          )}

          {/* DEDICATED SECTION: ESTADO / ALERTAS (READ-ONLY) */}
          <div className="mx-6 mt-4 p-4 bg-slate-900 border-2 border-emerald-500/10 rounded-2xl shadow-xl shadow-emerald-500/5">
            <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5" /> Condición Administrativa / Alertas
            </h4>
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-4 py-2 rounded-xl font-black text-[11px] uppercase shadow-lg border-2",
                selectedClient?.remarkCategory === 'Fallecido' ? "bg-slate-700 text-white border-slate-600" : 
                selectedClient?.remarkCategory === 'Clearing' ? "bg-rose-600/20 text-rose-500 border-rose-500/30 shadow-rose-500/10" : 
                selectedClient?.remarkCategory ? "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-amber-500/10" : "bg-emerald-950/40 text-emerald-500 border-emerald-500/10"
              )}>
                {selectedClient?.remarkCategory ? selectedClient.remarkCategory.toUpperCase() : "ESTADO NORMAL / SIN ALERTAS RELEVANTES"}
              </div>
              {selectedClient?.remarkCategory && (
                 <p className="text-[10px] text-slate-400 font-bold italic leading-tight max-w-[200px]">
                    Alerta crítica: Este perfil posee una restricción administrativa activa.
                 </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6 px-6">
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Documento</p>
                <p className="font-bold text-foreground text-sm">{selectedClient?.documento}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ciudad</p>
                {selectedClient?.ciudad && selectedClient.ciudad !== "NULL" ? (
                  <p className="font-bold text-foreground text-sm flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-rose-500" /> {selectedClient.ciudad}
                  </p>
                ) : (
                  <p className="text-[11px] font-black text-amber-600 uppercase flex items-center gap-2 italic">
                    <MapPin className="w-3 h-3 opacity-30" /> Pendiente
                  </p>
                )}
              </div>
              <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dirección</p>
                {selectedClient?.streetAndNum && selectedClient.streetAndNum !== "NULL" ? (
                  <p className="font-bold text-foreground text-sm flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-emerald-500" /> {selectedClient.streetAndNum}
                  </p>
                ) : (
                  <p className="text-[11px] font-black text-amber-600 uppercase flex items-center gap-2 italic">
                    <MapPin className="w-3 h-3 opacity-30" /> S/N Pendiente
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contacto</p>
                <div className="space-y-1">
                  {selectedClient?.telefonos && selectedClient.telefonos.some((t: string) => t && t !== "NULL") ? (
                    selectedClient.telefonos.filter((t: string) => t && t !== "NULL").map((tel: string, i: number) => (
                      <p key={i} className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Phone className="w-3 h-3 text-emerald-500" /> {tel}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] font-black text-amber-600 uppercase flex items-center gap-2 italic">
                      <Phone className="w-3 h-3 opacity-30" /> Tel. Pendiente
                    </p>
                  )}
                </div>
                <div className="space-y-1 border-t border-border dark:border-slate-700 pt-1 mt-1">
                  {selectedClient?.email && selectedClient.email !== "NULL" ? (
                    <p className="font-medium text-muted-foreground text-[11px] flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {selectedClient.email}
                    </p>
                  ) : (
                    <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2 italic">
                      <Mail className="w-3 h-3 opacity-30" /> Email Pendiente
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-1">Créditos del Cliente</p>
                <div className="grid grid-cols-2 gap-2 text-center pb-2">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Sistema Nuevo</p>
                    <p className="text-xl font-black text-emerald-600">
                      {selectedClient?.loans?.filter((l: any) => !l.is_legacy).length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Históricos</p>
                    <p className="text-xl font-black text-blue-600">
                      {selectedClient?.loans?.filter((l: any) => l.is_legacy).length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE NOTAS / MEMO (Legacy Sync) */}
          <div className="mx-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 relative overflow-hidden group/memo">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Notas del Sistema Anterior (Memo)
              </h4>
              {isSyncingMemo && (
                <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
              )}
            </div>

            <div className="relative z-10">
              {clientMemo?.memo ? (
                <div className="text-[12px] text-slate-700 font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-blue-50 shadow-sm whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin">
                  {clientMemo.memo}
                </div>
              ) : isSyncingMemo ? (
                <div className="h-16 flex items-center justify-center bg-white/30 rounded-xl border border-dashed border-blue-200">
                  <p className="text-[10px] font-black text-blue-600/50 uppercase italic tracking-tighter">Sincronizando notas históricas...</p>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center bg-white/20 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase italic tracking-tighter">No hay notas registradas para este cliente.</p>
                </div>
              )}
            </div>

            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-600/5 rounded-full blur-2xl group-hover/memo:scale-150 transition-transform duration-700" />
          </div>

          <div className="space-y-3 px-6 mt-6">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Accesos Directos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href={`/dashboard/loans?clientId=${selectedClient?.id}`} className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-blue-100 hover:bg-blue-900/20 dark:bg-blue-900/30 hover:text-blue-700 group">
                  <CreditCard className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> Ver Préstamos
                </Button>
              </Link>
              <Link href={`/dashboard/payments?clientId=${selectedClient?.id}`} className="flex-1">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-emerald-700/30 hover:bg-emerald-950/20 dark:bg-emerald-950/30 hover:text-emerald-700 group">
                  <HistoryIcon className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" /> Historial Pagos
                </Button>
              </Link>
            </div>

            {/* LEGACY LOANS LIST */}
            {selectedClient?.loans?.some((l: any) => l.is_legacy) && (
              <div className="mt-6 border-t border-border dark:border-slate-700 pt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-3 flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-blue-500" /> Operaciones Históricas (Legacy)
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {selectedClient.loans.filter((l: any) => l.is_legacy).map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center bg-muted/30 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Ref. Operación: #{l.legacy_operacion}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase">
                          Aprobado: {new Date(l.startDate || new Date()).toLocaleDateString('es-UY')}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-black text-emerald-600 block text-sm">
                          {formatCurrency(l.amount || 0, 'es-UY', l.currency || 'UYU')}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-black bg-blue-100 text-blue-700 border-none px-2 py-0 uppercase">
                          Sistema Anterior
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-8 p-6 bg-muted/40 border-t flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-blue-600 border-blue-100 hover:bg-blue-900/20 dark:bg-blue-900/30"
              onClick={(e) => {
                setIsDetailsModalOpen(false);
                openEdit(selectedClient, e as any);
              }}
            >
              <Edit className="w-4 h-4" /> Modificar Datos
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-rose-600 border-rose-100 hover:bg-rose-900/20 dark:bg-rose-900/30"
              onClick={(e) => {
                setIsDetailsModalOpen(false);
                openDelete(selectedClient, e as any);
              }}
            >
              <Trash2 className="w-4 h-4" /> Eliminar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-sm border-t-4 border-t-rose-600 p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertCircle className="w-8 h-8" />
              <DialogTitle className="font-black italic uppercase text-lg">Confirmar Borrado</DialogTitle>
            </div>
            <DialogDescription className="text-slate-900 font-medium text-sm">
              ¿Está seguro que desea eliminar a <span className="font-black underline">{selectedClient?.nombreCompleto}</span>?
            </DialogDescription>
            <p className="text-[10px] text-muted-foreground uppercase mt-2">
              Esta acción quedará registrada en el sistema.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 h-10" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 h-10 font-black gap-2" onClick={handleDeleteClient}>
              <Trash2 className="w-4 h-4" /> Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh] border-none rounded-3xl shadow-2xl"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsEditModalOpen(false);
          }}
        >
          <div className="bg-slate-950 flex-1 overflow-y-auto">
            <DialogHeader className="p-6 bg-slate-900 border-b border-emerald-500/20">
              <DialogTitle className="text-emerald-500 font-black italic uppercase flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <UserPlus className="w-5 h-5" />
                </div>
                Modificar Cliente
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mt-1 pl-12">
                Edición de perfil • Sistema Local
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-900 rounded-2xl border border-emerald-500/10">
                <button
                  className={cn("flex-1 py-2 text-[10px] font-black rounded-xl uppercase transition-all tracking-widest", formData.type === "PERSONA" ? "bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white" : "text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5")}
                  onClick={() => setFormData({ ...formData, type: "PERSONA", documentType: "CI" })}
                >
                  Persona Física
                </button>
                <button
                  className={cn("flex-1 py-2 text-[10px] font-black rounded-xl uppercase transition-all tracking-widest", formData.type === "EMPRESA" ? "bg-emerald-600 shadow-lg shadow-emerald-600/20 text-white" : "text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5")}
                  onClick={() => setFormData({ ...formData, type: "EMPRESA", documentType: "RUT" })}
                >
                  Razón Social
                </button>
              </div>

              {/* DEDICATED SECTION: ESTADO / ALERTAS (ADMINISTRATIVE CONDITION) - TOP PLACEMENT */}
              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-900 border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Condición Administrativa / Alertas
                  </h4>
                  {formData.remarkCategory && (
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md",
                      formData.remarkCategory === 'Fallecido' ? "bg-slate-700 text-white font-black uppercase" : 
                      formData.remarkCategory === 'Clearing' ? "bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)] font-black uppercase" : "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black uppercase"
                    )}>
                      {formData.remarkCategory.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <select
                    className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-tight border-2 border-slate-800 bg-slate-950 text-emerald-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none px-4 cursor-pointer"
                    value={formData.remarkCategory}
                    onChange={(e) => setFormData({ ...formData, remarkCategory: e.target.value })}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">[ESTADO NORMAL / SIN ALERTAS]</option>
                    <option value="Clearing" className="bg-slate-900 text-rose-500">CLEARING (INCUMPLIMIENTO)</option>
                    <option value="PF" className="bg-slate-900 text-amber-500">PF (PROBLEMA FINANCIERO)</option>
                    <option value="Fallecido" className="bg-slate-900 text-slate-300">FALLECIDO</option>
                  </select>
                  <p className="text-[9px] text-emerald-500/40 font-bold italic mt-2 leading-tight px-1 uppercase tracking-tighter">
                    Defina el estado administrativo crítico para este perfil.
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-emerald-500/10 mb-4">
                  <span className="text-[10px] font-black uppercase text-emerald-500/60 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> SUCURSAL DE ORIGEN:
                  </span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-tight">{user?.branch || 'Central (Administración)'}</span>
                </div>
                {formData.type === "PERSONA" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nombres *</label>
                        <Input 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all"
                          value={formData.nombre} 
                          onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Apellidos *</label>
                        <Input 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all"
                          value={formData.apellido} 
                          onChange={e => setFormData({ ...formData, apellido: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Sexo</label>
                        <select className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold px-3 text-emerald-500 outline-none flex items-center transition-all"
                          value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })}>
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMENINO">Femenino</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nacimiento</label>
                        <Input 
                          type="date" 
                          className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 [color-scheme:dark] transition-all"
                          value={formData.birthDate || ""} 
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Nombre / Razón Social *</label>
                    <Input 
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all"
                      value={formData.nombre} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    />
                  </div>
                )}

                <div className="grid grid-cols-[100px_1fr] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Tipo Doc.</label>
                    <select className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold px-3 text-emerald-500 outline-none transition-all"
                      value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}>
                      <option value="CI">C.I.</option>
                      <option value="RUT">RUT</option>
                      <option value="PASAPORTE">PASAPORTE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1 text-right w-full block border-b pb-1 mb-1 border-transparent">
                      {formData.documentType === 'CI' ? 'Número de Documento' : 'RUT'} *
                    </label>
                    <Input
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 tracking-widest transition-all"
                      value={formData.documento}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, documento: val });
                        if (formError) setFormError("");
                      }}
                    />
                  </div>
                </div>
                {formError && <p className="text-[10px] text-rose-600 font-black uppercase italic mt-1 px-1">{formError}</p>}

                <div className="pt-4 border-t border-emerald-500/10 mt-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-11 gap-3 px-5 rounded-2xl border-2 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/5" 
                    onClick={() => setIsWorkDataModalOpen(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Gestionar Datos Laborales
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MapPin className="w-3.5 h-3.5" /> Domicilio Registrado
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Departamento</label>
                    <select className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-[11px] font-black px-3 text-emerald-500 outline-none transition-all"
                      value={formData.department} onChange={(e) => {
                        const dept = e.target.value;
                        setFormData({
                          ...formData,
                          department: dept,
                          ciudad: URUGUAY_CITIES[dept] && URUGUAY_CITIES[dept].length > 0 ? URUGUAY_CITIES[dept][0] : ""
                        });
                      }}>
                      {Object.keys(URUGUAY_CITIES).map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Ciudad / Localidad</label>
                    <select
                      className="w-full h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-[11px] font-black px-3 text-emerald-500 outline-none transition-all"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      {(URUGUAY_CITIES[formData.department] || []).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Calle y Número de Puerta</label>
                  <Input 
                    className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 transition-all uppercase"
                    value={formData.streetAndNum} 
                    onChange={e => setFormData({ ...formData, streetAndNum: e.target.value })} 
                  />
                </div>
              </div>
              
              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Teléfonos de Contacto</label>
                  <Button variant="ghost" size="sm" className="h-8 text-emerald-500 gap-1.5 text-[10px] font-black border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all uppercase tracking-widest" onClick={() => setFormData({ ...formData, telefonos: [...formData.telefonos, ""] })}>
                    <Plus className="w-3.5 h-3.5" /> Añadir
                  </Button>
                </div>
                {formData.telefonos.map((tel, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 tracking-widest transition-all"
                      value={tel}
                      onChange={e => {
                        const newTels = [...formData.telefonos];
                        newTels[idx] = e.target.value;
                        setFormData({ ...formData, telefonos: newTels });
                      }}
                      placeholder="Teléfono"
                    />
                    {formData.telefonos.length > 1 && (
                      <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all" onClick={() => setFormData({ ...formData, telefonos: formData.telefonos.filter((_, i) => i !== idx) })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl border-2 p-5 bg-slate-950 border-emerald-500/5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Correos Electrónicos</label>
                  <Button variant="ghost" size="sm" className="h-8 text-emerald-500 gap-1.5 text-[10px] font-black border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all uppercase tracking-widest" onClick={() => setFormData({ ...formData, emails: [...formData.emails, ""] })}>
                    <Plus className="w-3.5 h-3.5" /> Añadir
                  </Button>
                </div>
                {formData.emails.map((em, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="h-11 bg-slate-900 border-2 border-slate-800 rounded-xl text-xs font-bold text-emerald-500 transition-all"
                      value={em}
                      onChange={e => {
                        const newEmails = [...formData.emails];
                        newEmails[idx] = e.target.value;
                        setFormData({ ...formData, emails: newEmails });
                      }}
                      placeholder="Email"
                    />
                    {formData.emails.length > 1 && (
                      <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all" onClick={() => setFormData({ ...formData, emails: formData.emails.filter((_, i) => i !== idx) })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-900 border-t border-emerald-500/10 mt-auto flex gap-3">
            <Button 
                variant="ghost" 
                className="flex-1 rounded-2xl font-black uppercase text-[10px] h-12 text-slate-400 hover:bg-slate-800 transition-all tracking-[0.2em]"
                onClick={() => setIsEditModalOpen(false)}
            >
                Cancelar
            </Button>
            <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] h-12 gap-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 tracking-[0.2em]"
                onClick={handleEditClient}
            >
                <Save className="w-4 h-4" />
                Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUB-MODAL DATOS LABORALES */}
      <Dialog open={isWorkDataModalOpen} onOpenChange={setIsWorkDataModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <div className="bg-slate-950">
            <DialogHeader className="p-6 bg-slate-900 border-b border-emerald-500/20">
              <DialogTitle className="text-emerald-500 font-black italic uppercase flex items-center gap-3 tracking-tight">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <UserPlus className="w-5 h-5 text-emerald-500" />
                </div>
                Datos Laborales
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mt-1 pl-12">
                Información laboral del individuo • Sistema Local
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 p-8 bg-slate-950">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Empresa / Lugar de Trabajo (Vínculo)</label>
                <EmployerSelector 
                  value={formData.employerId}
                  onChange={(id, name) => setFormData({
                    ...formData,
                    employerId: id,
                    employerName: name,
                    workData: { ...formData.workData, company: name }
                  })}
                  placeholder={formData.employerName || "BUSCAR LUGAR DE TRABAJO..."}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Cargo / Tarea que realiza</label>
                <Input
                  className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  value={formData.workData.position}
                  onChange={e => setFormData({ ...formData, workData: { ...formData.workData, position: e.target.value } })}
                  placeholder="Ej: Empleado de Comercio"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Salario Líquido</label>
                  <Input
                    type="number"
                    className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                    value={formData.workData.salary}
                    onChange={e => setFormData({ ...formData, workData: { ...formData.workData, salary: e.target.value } })}
                    placeholder="UYU"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Antigüedad</label>
                  <Input
                    type="date"
                    className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all [color-scheme:dark]"
                    value={formData.workData.startDate}
                    onChange={e => setFormData({ ...formData, workData: { ...formData.workData, startDate: e.target.value } })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest ml-1">Teléfono Laboral</label>
                <Input
                  className="h-12 bg-slate-900 border-2 border-slate-800 rounded-2xl text-[11px] font-black uppercase text-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  value={formData.workData.phone}
                  onChange={e => setFormData({ ...formData, workData: { ...formData.workData, phone: e.target.value } })}
                  placeholder="Teléfono fijo o recursos humanos"
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-900 border-t border-emerald-500/10">
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-2xl font-black uppercase text-[10px] text-emerald-500 border-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all shadow-lg shadow-emerald-500/5" 
                onClick={() => setIsWorkDataModalOpen(false)}
              >
                VOLVER Y CONFIRMAR DATOS
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-16 p-8 border-t-2 border-emerald-500/10 bg-slate-950/40 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-colors" />
        <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
          <Terminal className="w-5 h-5 text-emerald-500" /> Historial de Sesión en Tiempo Real
        </h3>
        <div className="space-y-3">
          {logs.map((log: any, i: number) => (
            <div key={i} className="text-[10px] bg-slate-900/60 backdrop-blur-md border-2 border-slate-800 p-4 rounded-2xl border-l-4 border-l-emerald-500 font-mono text-emerald-500/70 flex flex-col sm:flex-row justify-between gap-2 hover:border-emerald-500/20 hover:scale-[1.01] transition-all shadow-xl">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black text-[9px]">{log.action}</span>
                <span className="font-black uppercase tracking-tight text-emerald-400">CLIENTE: {log.client}</span>
              </div>
              <div className="flex items-center gap-4 opacity-60">
                <span className="font-black">OPERADOR: {log.user}</span>
                <span className="font-black text-emerald-600/60 tracking-widest">{log.date}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl opacity-30">
                  <Terminal className="w-8 h-8 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Escaneando actividad de sesión...</p>
              </div>
          )}
        </div>
      </div>
    </div >
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <ClientsContent />
    </Suspense>
  );
}
