import { useState } from "react";
import { Check, X, Clock, Plus, MessageSquare, Edit } from "lucide-react";
import { Chat } from "./chat";
import { TicketDetailsModal } from "./ticket-details-modal";
import { AssignTechnicianModal } from "./assign-technician-modal";
import type { SolicitudTicket, Usuario, PC, Mensaje } from "../types";

interface PendingTicketsProps {
  tickets: SolicitudTicket[];
  onAccept: (ticketId: string, technicianId: string) => void;
  onReject: (ticketId: string) => void;
  onNewTicket: () => void;
  currentUser: Usuario;
  pcs: PC[];
  onSendMessage: (idPC: string, message: Mensaje) => void;
  onCompleteTicket: (ticketId: string, marca: string, modelo: string) => void;
  technicians: Usuario[];
}

export function PendingTickets({ tickets, onAccept, onReject, onNewTicket, currentUser, pcs, onSendMessage, onCompleteTicket, technicians }: PendingTicketsProps) {
  const isTech = currentUser.rol === "tecnico";
  const [filter, setFilter] = useState<"all" | "nuevo" | "pendiente" | "aprobado" | "rechazado">(isTech ? "pendiente" : "nuevo");
  const [selectedTicketForChat, setSelectedTicketForChat] = useState<string | null>(null);
  const [selectedTicketForEdit, setSelectedTicketForEdit] = useState<string | null>(null);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<string | null>(null);

  const iscliente = currentUser.rol === "cliente";
  const isAdmin = currentUser.rol === "administrador";
  const isTechnician = currentUser.rol === "tecnico";
  const isTechnicianOrAdmin = currentUser.rol === "tecnico" || currentUser.rol === "administrador";

  
  let visibleTickets = tickets;

  if (iscliente) {
    
    visibleTickets = tickets.filter(t => t.email === currentUser.email || t.cliente === currentUser.nombre);
  } else if (isTechnician) {
    
    visibleTickets = tickets.filter(t => t.tecnicoAsignadoId === currentUser.id);
  }

  const filteredTickets = iscliente
    ? visibleTickets
    : (filter === "all" ? visibleTickets : visibleTickets.filter(t => t.estado === filter));

  const selectedTicket = selectedTicketForChat
    ? tickets.find(t => t.id === selectedTicketForChat)
    : null;

  const ticketToEdit = selectedTicketForEdit
    ? tickets.find(t => t.id === selectedTicketForEdit)
    : null;

  const ticketToAssign = selectedTicketForAssign
    ? tickets.find(t => t.id === selectedTicketForAssign)
    : null;

  const selectedPC = selectedTicket?.idPC
    ? pcs.find(pc => pc.id === selectedTicket.idPC)
    : null;

  const handleSendMessage = (text: string) => {
    if (!selectedPC) return;

    const message: Mensaje = {
      id: `MSG-${Date.now()}`,
      idRemitente: currentUser.id,
      nombreRemitente: currentUser.nombre,
      rolRemitente: currentUser.rol,
      texto: text,
      fechaHora: new Date().toISOString()
    };
    onSendMessage(selectedPC.id, message);
  };

  if (iscliente && selectedTicketForChat && selectedTicket && selectedPC) {
    const assignedTech = selectedPC.tecnicoAsignadoId
      ? pcs.find(pc => pc.id === selectedPC.id)?.tecnicoAsignadoId
      : null;

    return (
      <div className="flex-1 bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1">Chat - {selectedTicket.id}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedTicket.marca} {selectedTicket.modelo}
              </p>
            </div>
            <button
              onClick={() => setSelectedTicketForChat(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Volver
            </button>
          </div>
        </div>
        <div className="flex-1">
          <Chat
            mensajes={selectedPC.mensajes}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            otherUserName={assignedTech ? "Técnico" : undefined}
          />
        </div>
      </div>
    );
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "nuevo":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
            Nuevo
          </span>
        );
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded">
            <Check className="w-3 h-3" />
            Aprobado
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-500/10 text-red-600 dark:text-red-400 rounded">
            <X className="w-3 h-3" />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-card overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="mb-1">{iscliente ? "Mis Solicitudes" : "Pedidos Pendientes"}</h1>
            <p className="text-sm text-muted-foreground">
              {iscliente ? "Seguimiento de tus solicitudes" : "Solicitudes de reparación de clientes"}
            </p>
          </div>
          <button
            onClick={onNewTicket}
            className="flex-shrink-0 px-3 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Solicitud</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {isTechnicianOrAdmin && (
          <div className="flex flex-wrap gap-2 mb-6">
            {isAdmin && (
              <button
                onClick={() => setFilter("nuevo")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filter === "nuevo"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Nuevos ({visibleTickets.filter(t => t.estado === "nuevo").length})
              </button>
            )}
            <button
              onClick={() => setFilter("pendiente")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === "pendiente"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Pendientes ({visibleTickets.filter(t => t.estado === "pendiente").length})
            </button>
            <button
              onClick={() => setFilter("rechazado")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === "rechazado"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Rechazados ({visibleTickets.filter(t => t.estado === "rechazado").length})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos ({visibleTickets.length})
            </button>
          </div>
        )}

        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {iscliente ? "No tienes solicitudes aún" : `No hay solicitudes ${filter !== "all" ? filter : ""}`}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 bg-muted border border-border rounded-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{ticket.id}</span>
                      {getStatusBadge(ticket.estado)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.fechaCreacion).toLocaleString('es-AR')}
                    </p>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0">
                    {isAdmin && ticket.estado === "nuevo" && (
                      <>
                        <button
                          onClick={() => setSelectedTicketForAssign(ticket.id)}
                          className="p-1.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 rounded transition-colors"
                          title="Aceptar y asignar técnico"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(ticket.id)}
                          className="p-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isTechnicianOrAdmin && ticket.estado === "pendiente" && (
                      <button
                        onClick={() => setSelectedTicketForEdit(ticket.id)}
                        className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                        title="Completar información"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Tipo</dt>
                    <dd className="text-sm text-foreground capitalize">
                      {ticket.tipoDispositivo === "pc" ? "PC de escritorio" : "Laptop"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">cliente</dt>
                    <dd className="text-sm text-foreground truncate">{ticket.cliente}</dd>
                  </div>
                  {ticket.telefono && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Teléfono</dt>
                      <dd className="text-sm text-foreground">{ticket.telefono}</dd>
                    </div>
                  )}
                  {isTechnicianOrAdmin && (
                    <div className={ticket.telefono ? "" : "col-span-2"}>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="text-sm text-foreground truncate">{ticket.email}</dd>
                    </div>
                  )}
                  
                  {ticket.tecnicoAsignadoId && (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Técnico asignado</dt>
                      <dd className="text-sm text-foreground">
                        {technicians.find(t => t.id === ticket.tecnicoAsignadoId)?.nombre || "No encontrado"}
                      </dd>
                    </div>
                  )}
                  {ticket.marca && ticket.modelo && (
                    <>
                      <div>
                        <dt className="text-xs text-muted-foreground">Marca</dt>
                        <dd className="text-sm text-foreground">{ticket.marca}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Modelo</dt>
                        <dd className="text-sm text-foreground">{ticket.modelo}</dd>
                      </div>
                    </>
                  )}
                </dl>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Problema reportado</p>
                  <p className="text-sm text-foreground bg-background p-3 rounded border border-border break-words">
                    {ticket.problema}
                  </p>
                </div>

                {iscliente && ticket.estado === "aprobado" && ticket.idPC && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setSelectedTicketForChat(ticket.id)}
                      className="w-full px-3 py-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat con Técnico
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {ticketToEdit && (
        <TicketDetailsModal
          ticket={ticketToEdit}
          onClose={() => setSelectedTicketForEdit(null)}
          onUpdate={onCompleteTicket}
        />
      )}

      {ticketToAssign && (
        <AssignTechnicianModal
          ticket={ticketToAssign}
          technicians={technicians}
          onClose={() => setSelectedTicketForAssign(null)}
          onAssign={onAccept}
        />
      )}
    </div>
  );
}
