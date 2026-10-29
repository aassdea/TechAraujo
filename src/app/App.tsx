import { useState, useEffect, useCallback } from "react";
import { Monitor, DollarSign, FileText, Menu, Sun, Moon, Inbox, Users, LogOut, X, ArrowLeft } from "lucide-react";
import { PCList } from "./components/pc-list";
import { PCDetails } from "./components/pc-details";
import { ComparadorPrecios } from "./components/price-comparator";
import { AddPCModal } from "./components/add-pc-modal";
import { PendingTickets } from "./components/pending-tickets";
import { ClientTicketForm } from "./components/client-ticket-form";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { UserManagement } from "./components/user-management";
import type { PC, SolicitudTicket, Usuario, RolUsuario, Mensaje } from "./types";
import { generarOrdenPDF, nombreArchivoOrden, ordenPDFBase64 } from "./pdf/orden-pdf";
import { api } from "./api";

const tieneLosMismosDatos = <T,>(actual: T, siguiente: T) =>
  JSON.stringify(actual) === JSON.stringify(siguiente);

export function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  const [activeView, setActiveView] = useState<"pcs" | "prices" | "queries" | "tickets" | "users">("pcs");
  const [selectedPCId, setSelectedPCId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [tickets, setTickets] = useState<SolicitudTicket[]>([]);
  const [pcs, setPCs] = useState<PC[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
  const usuarioGuardado = localStorage.getItem("techrepair_user");
  return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
});
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const sincronizarDatos = useCallback(async () => {
    try {
      const [usuarios, ticketsDB, pcsDB] = await Promise.all([
        api.usuarios(),
        api.tickets(),
        api.pcs(),
      ]);

      // No reemplazamos el estado si no cambió: así no se interrumpe el chat
      // ni se desplaza la pantalla cada vez que se consulta al servidor.
      setUsers((prev) => tieneLosMismosDatos(prev, usuarios) ? prev : usuarios);
      setTickets((prev) => tieneLosMismosDatos(prev, ticketsDB) ? prev : ticketsDB);
      setPCs((prev) => tieneLosMismosDatos(prev, pcsDB) ? prev : pcsDB);
    } catch (error) {
      console.error("No se pudo sincronizar la base de datos:", error);
    }
  }, []);

  useEffect(() => {
    void sincronizarDatos();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void sincronizarDatos();
    }, 4_000);

    const sincronizarAlVolver = () => {
      if (document.visibilityState === "visible") void sincronizarDatos();
    };

    window.addEventListener("focus", sincronizarAlVolver);
    document.addEventListener("visibilitychange", sincronizarAlVolver);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sincronizarAlVolver);
      document.removeEventListener("visibilitychange", sincronizarAlVolver);
    };
  }, [sincronizarDatos]);

  const selectedPC = selectedPCId ? pcs.find(pc => pc.id === selectedPCId) : null;

  const updatePC = (id: string, updates: Partial<PC>) => {
    setPCs(prev => prev.map(pc => pc.id === id ? { ...pc, ...updates } : pc));
    api.actualizarPC(id, updates).catch(console.error);
  };

  const addPC = async (newPC: PC) => {
    setPCs(prev => [...prev, newPC]);
    setSelectedPCId(newPC.id);
    try {
      const pcCreada = await api.crearPC(newPC, currentUser?.id);
      await sincronizarDatos();
      setSelectedPCId(pcCreada.id);
    } catch (error) {
      console.error(error);
    }
  };

  const addTicket = async (ticket: SolicitudTicket) => {
    if (!currentUser) return;

    try {
      const ticketCreado = await api.crearTicket(ticket, currentUser.id);
      setTickets(prev => [...prev, { ...ticket, id: ticketCreado.id }]);
      await sincronizarDatos();
    } catch (error) {
      console.error(error);
    }
  };

  const acceptTicket = (ticketId: string, technicianId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, estado: "pendiente", tecnicoAsignadoId: technicianId } : t));
    api.actualizarTicket(ticketId, { estado: "pendiente", tecnicoAsignadoId: technicianId })
      .then(sincronizarDatos)
      .catch(console.error);
  };

  const completeTicket = async (ticketId: string, marca: string, modelo: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const pcCount = pcs.length + 1;
    const newPCId = `PC-${String(pcCount).padStart(3, '0')}`;
    const isPC = ticket.tipoDispositivo === "pc";

    const newPC: PC = {
      id: newPCId,
      cliente: ticket.cliente,
      contacto: `${ticket.telefono} / ${ticket.email}`,
      marca: isPC ? "PC Genérica" : marca,
      modelo: isPC ? "Escritorio" : modelo,
      estado: "recibida",
      componentes: [],
      reparaciones: [],
      precioTotal: "",
      presupuesto: "",
      diagnostico: ticket.problema,
      notas: `Creado desde ticket ${ticket.id} - Tipo: ${ticket.tipoDispositivo === "pc" ? "PC de escritorio" : "Laptop"}`,
      tecnicoAsignadoId: ticket.tecnicoAsignadoId,
      mensajes: [],
      fechaCreacion: new Date().toISOString()
    };

    setPCs(prev => [...prev, newPC]);
    setSelectedPCId(newPC.id);
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, marca: isPC ? "PC Genérica" : marca, modelo: isPC ? "Escritorio" : modelo, estado: "aprobado" as const, idPC: newPCId } : t
    ));

    setActiveView("pcs");

    try {
      const pcCreada = await api.crearPC(newPC, currentUser?.id, ticketId);
      await api.actualizarTicket(ticketId, { estado: "aprobado" });
      await sincronizarDatos();
      setSelectedPCId(pcCreada.id);
    } catch (error) {
      console.error(error);
    }
  };

  const rejectTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, estado: "rechazado" } : t));
    api.actualizarTicket(ticketId, { estado: "rechazado" })
      .then(sincronizarDatos)
      .catch(console.error);
  };

 const handleLogin = (user: Usuario) => {
  setCurrentUser(user);
  localStorage.setItem("techrepair_user", JSON.stringify(user));
};

  const handleLoginCredentials = async (email: string, contraseña: string) => {
  const user = await api.login(email, contraseña);
  setCurrentUser(user);
  localStorage.setItem("techrepair_user", JSON.stringify(user));
};

  const handleGoogleLogin = async (credential: string) => {
    const user = await api.loginGoogle(credential);
    setCurrentUser(user);
    localStorage.setItem("techrepair_user", JSON.stringify(user));
  };

  const handleRegister = async (user: Usuario) => {
    try { const saved = await api.crearUsuario(user); setUsers(prev => [...prev, saved]); setCurrentUser(saved); }
    catch (e) { console.error(e); }
  };

 const handleLogout = () => {
  setCurrentUser(null);
  localStorage.removeItem("techrepair_user");
  setActiveView("pcs");
};

  const updateUserRole = (userId: string, newRole: RolUsuario) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: newRole } : u));
    api.actualizarRol(userId, newRole)
      .then(sincronizarDatos)
      .catch(console.error);
  };

  const addMessageToPC = (idPC: string, message: Mensaje) => {
    setPCs(prev => prev.map(pc => pc.id === idPC ? { ...pc, mensajes: [...pc.mensajes, message] } : pc));
    api.crearMensaje({ equipoId: idPC, usuarioId: message.idRemitente, texto: message.texto })
      .then(sincronizarDatos)
      .catch(console.error);
  };

  const technicians = users.filter(u => u.rol === "tecnico" || u.rol === "administrador");

  if (!currentUser) {
    if (authView === "login") {
      return (
        <Login
          alIniciarSesion={handleLogin}
          cambiarARegistro={() => setAuthView("register")}
          listaUsuarios={users}
          alIniciarSesionConCredenciales={handleLoginCredentials}
          alIniciarSesionConGoogle={handleGoogleLogin}
        />
      );
    } else {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView("login")}
          users={users}
        />
      );
    }
  }

  const nombreTecnico = (pc: PC) =>
    technicians.find((t) => t.id === pc.tecnicoAsignadoId)?.nombre;

  const exportToPDF = (pc: PC) => {
    generarOrdenPDF(pc, nombreTecnico(pc)).save(nombreArchivoOrden(pc));
  };

  // El destinatario NO se manda desde acá: el servidor lo busca en la base de datos
  // (mail con el que el cliente inició sesión / generó el ticket).
  const sendPDFByEmail = async (pc: PC) => {
    await api.enviarOrdenPDF({
      equipoId: pc.id,
      usuarioId: currentUser.id,
      archivo: nombreArchivoOrden(pc),
      pdf: ordenPDFBase64(pc, nombreTecnico(pc)),
    });
  };

  const getTextoEstado = (estado: string) => {
    switch (estado) {
      case "recibida": return "Recibida";
      case "diagnosticando": return "Diagnóstico";
      case "reparando": return "Reparación";
      case "lista": return "Lista";
      case "entregada": return "Entregada";
      default: return estado;
    }
  };

  const ticketBadgeCount = (() => {
    if (currentUser.rol === "administrador") {
      return tickets.filter(t => t.estado === "nuevo").length + tickets.filter(t => t.estado === "pendiente").length;
    } else if (currentUser.rol === "tecnico") {
      return tickets.filter(t => t.tecnicoAsignadoId === currentUser.id && t.estado === "pendiente").length;
    }
    return 0;
  })();

  const navItems = [
    ...(currentUser.rol !== "cliente" ? [
      { id: "pcs" as const, label: "Computadoras", icon: Monitor },
      { id: "prices" as const, label: "Comparador", icon: DollarSign },
      { id: "queries" as const, label: "Consultas", icon: FileText },
    ] : []),
    { id: "tickets" as const, label: "Pedidos", icon: Inbox },
    ...(currentUser.rol === "administrador" ? [
      { id: "users" as const, label: "Usuarios", icon: Users },
    ] : []),
  ];

  return (
    <div className="size-full flex bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-16'} bg-sidebar text-sidebar-foreground flex-col transition-all duration-200 border-r border-sidebar-border flex-shrink-0`}>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="font-medium">TechRepair</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-sidebar-accent rounded transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
          {sidebarOpen && (
            <div className="mt-3 pt-3 border-t border-sidebar-border">
              <p className="text-xs text-muted-foreground truncate">{currentUser.nombre}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.rol}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeView === item.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
              {sidebarOpen && item.id === "tickets" && ticketBadgeCount > 0 && (
                <span className="ml-auto text-xs bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {ticketBadgeCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={`p-3 border-t border-sidebar-border ${sidebarOpen ? 'flex gap-2' : 'flex flex-col gap-2 items-center'}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-sidebar-accent rounded transition-colors"
            title={darkMode ? "Modo claro" : "Modo oscuro"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-sidebar-accent rounded transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-4 pb-4 text-xs text-muted-foreground">
            Sistema de Gestión v1.0
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground flex flex-col z-50 transform transition-transform duration-200 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="font-medium">TechRepair</h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{currentUser.nombre}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.rol}</p>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 hover:bg-sidebar-accent rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                activeView === item.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
              {item.id === "tickets" && ticketBadgeCount > 0 && (
                <span className="ml-auto text-xs bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {ticketBadgeCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-sidebar-accent rounded transition-colors text-sm"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-sidebar-accent rounded transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded transition-colors -ml-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm">TechRepair</span>
          <div className="flex items-center gap-1">
            {ticketBadgeCount > 0 && (
              <button
                onClick={() => setActiveView("tickets")}
                className="relative p-2"
              >
                <Inbox className="w-5 h-5" />
                <span className="absolute top-1 right-1 text-xs bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center">
                  {ticketBadgeCount}
                </span>
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main area */}
        <main className="flex-1 flex overflow-hidden">
          {activeView === "pcs" && (currentUser.rol === "administrador" || currentUser.rol === "tecnico") && (
            <>
              {/* Mobile: show list or detail, not both */}
              <div className={`md:hidden flex-1 flex flex-col overflow-hidden ${selectedPCId ? 'hidden' : 'flex'}`}>
                <PCList
                  pcs={pcs}
                  selectedId={selectedPCId}
                  onSelect={setSelectedPCId}
                  onAdd={() => setShowAddModal(true)}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  currentUser={currentUser}
                />
              </div>

              {selectedPCId && selectedPC && (
                <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
                    <button
                      onClick={() => setSelectedPCId(null)}
                      className="p-1 hover:bg-muted rounded transition-colors -ml-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{selectedPC.id}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedPC.marca} {selectedPC.modelo}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <PCDetails
                      pc={selectedPC}
                      onClose={() => setSelectedPCId(null)}
                      onUpdate={(updates) => updatePC(selectedPC.id, updates)}
                      onExportPDF={exportToPDF}
                      onSendPDFEmail={sendPDFByEmail}
                      currentUser={currentUser}
                      technicians={technicians}
                      onSendMessage={(message) => addMessageToPC(selectedPC.id, message)}
                    />
                  </div>
                </div>
              )}

              {/* Desktop: side-by-side layout */}
              <div className="hidden md:flex flex-1 overflow-hidden">
                <div className="w-72 lg:w-80 bg-card flex-shrink-0">
                  <PCList
                    pcs={pcs}
                    selectedId={selectedPCId}
                    onSelect={setSelectedPCId}
                    onAdd={() => setShowAddModal(true)}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    currentUser={currentUser}
                  />
                </div>

                <div className="flex-1 flex overflow-hidden min-w-0">
                  {selectedPC ? (
                    <>
                      <div className="flex-1 p-6 overflow-y-auto min-w-0">
                        <div className="max-w-3xl">
                          <h1 className="mb-1">{selectedPC.id}</h1>
                          <p className="text-muted-foreground mb-6">
                            {selectedPC.marca} {selectedPC.modelo}
                          </p>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Estado</h3>
                              <div className="text-sm text-foreground">{getTextoEstado(selectedPC.estado)}</div>
                            </div>
                            <div>
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cliente</h3>
                              <div className="text-sm text-foreground">{selectedPC.cliente}</div>
                            </div>
                            <div>
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Contacto</h3>
                              <div className="text-sm text-foreground">{selectedPC.contacto}</div>
                            </div>
                            <div>
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Precio Total</h3>
                              <div className="text-sm text-foreground">
                                {selectedPC.precioTotal ? `$${selectedPC.precioTotal}` : "—"}
                              </div>
                            </div>
                          </div>

                          {selectedPC.componentes.length > 0 && (
                            <div className="mt-8">
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Componentes</h3>
                              <div className="space-y-2">
                                {selectedPC.componentes.map((comp, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border">
                                    <span className="text-sm text-foreground">{comp.nombre}</span>
                                    <span className="text-sm text-muted-foreground">${comp.precio}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedPC.reparaciones.length > 0 && (
                            <div className="mt-8">
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Servicios y reparaciones</h3>
                              <div className="space-y-2">
                                {selectedPC.reparaciones.map((repair, idx) => (
                                  <div key={idx} className="flex items-start gap-2 py-2">
                                    <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${repair.realizada ? 'bg-[#10b981]' : 'bg-border'}`} />
                                    <span className="text-sm text-foreground">{repair.descripcion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedPC.notas && (
                            <div className="mt-8">
                              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Notas</h3>
                              <p className="text-sm text-muted-foreground">{selectedPC.notas}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <PCDetails
                        pc={selectedPC}
                        onClose={() => setSelectedPCId(null)}
                        onUpdate={(updates) => updatePC(selectedPC.id, updates)}
                        onExportPDF={exportToPDF}
                        onSendPDFEmail={sendPDFByEmail}
                        currentUser={currentUser}
                        technicians={technicians}
                        onSendMessage={(message) => addMessageToPC(selectedPC.id, message)}
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Selecciona una PC para ver los detalles
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeView === "prices" && (currentUser.rol === "administrador" || currentUser.rol === "tecnico") && (
            <div className="flex-1 bg-card overflow-hidden">
              <ComparadorPrecios />
            </div>
          )}

          {activeView === "queries" && (currentUser.rol === "administrador" || currentUser.rol === "tecnico") && (
            <div className="flex-1 bg-card p-4 sm:p-6 overflow-y-auto">
              <h1 className="mb-1">Consultas</h1>
              <p className="text-sm text-muted-foreground mb-6">Consulta el historial y estadísticas</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Resumen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-4 bg-muted border border-border rounded-md">
                      <div className="text-2xl font-medium text-foreground mb-1">
                        {currentUser.rol === "administrador"
                          ? pcs.length
                          : pcs.filter(pc => pc.tecnicoAsignadoId === currentUser.id).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Total PCs</div>
                    </div>
                    <div className="p-4 bg-muted border border-border rounded-md">
                      <div className="text-2xl font-medium text-foreground mb-1">
                        {currentUser.rol === "administrador"
                          ? pcs.filter(pc => pc.estado === "reparando" || pc.estado === "diagnosticando").length
                          : pcs.filter(pc => pc.tecnicoAsignadoId === currentUser.id && (pc.estado === "reparando" || pc.estado === "diagnosticando")).length}
                      </div>
                      <div className="text-xs text-muted-foreground">En proceso</div>
                    </div>
                    <div className="p-4 bg-muted border border-border rounded-md">
                      <div className="text-2xl font-medium text-foreground mb-1">
                        {currentUser.rol === "administrador"
                          ? pcs.filter(pc => pc.estado === "lista").length
                          : pcs.filter(pc => pc.tecnicoAsignadoId === currentUser.id && pc.estado === "lista").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Listas</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Historial Reciente</h3>
                  <div className="space-y-2">
                    {(currentUser.rol === "administrador"
                      ? pcs
                      : pcs.filter(pc => pc.tecnicoAsignadoId === currentUser.id)
                    ).slice().reverse().map(pc => (
                      <div key={pc.id} className="p-3 bg-muted border border-border rounded-md">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{pc.id}</div>
                            <div className="text-xs text-muted-foreground truncate">{pc.cliente} — {pc.marca} {pc.modelo}</div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">{getTextoEstado(pc.estado)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "tickets" && (
            <PendingTickets
              tickets={tickets}
              onAccept={acceptTicket}
              onReject={rejectTicket}
              onNewTicket={() => setShowTicketForm(true)}
              currentUser={currentUser}
              pcs={pcs}
              onSendMessage={addMessageToPC}
              onCompleteTicket={completeTicket}
              technicians={technicians}
            />
          )}

          {activeView === "users" && currentUser.rol === "administrador" && (
            <UserManagement
              users={users}
              currentUser={currentUser}
              onUpdateUserRole={updateUserRole}
            />
          )}
        </main>

      </div>

      {showAddModal && (
        <AddPCModal
          onClose={() => setShowAddModal(false)}
          onAdd={addPC}
        />
      )}

      {showTicketForm && (
        <ClientTicketForm
          onClose={() => setShowTicketForm(false)}
          onSubmit={addTicket}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
