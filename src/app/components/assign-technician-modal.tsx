import { useState } from "react";
import { X, UserCheck } from "lucide-react";
import type { SolicitudTicket, Usuario } from "../types";

interface AssignTechnicianModalProps {
  ticket: SolicitudTicket;
  technicians: Usuario[];
  onClose: () => void;
  onAssign: (ticketId: string, technicianId: string) => void;
}

export function AssignTechnicianModal({
  ticket,
  technicians,
  onClose,
  onAssign
}: AssignTechnicianModalProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTechId) {
      onAssign(ticket.id, selectedTechId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-md mx-4 rounded-lg border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-medium text-foreground">
            Asignar Técnico - {ticket.id}
          </h2>

          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-muted rounded-md space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">
                Cliente:
              </span>{" "}
              <span className="text-sm text-foreground">
                {ticket.cliente}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">
                Tipo:
              </span>{" "}
              <span className="text-sm text-foreground capitalize">
                {ticket.tipoDispositivo}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">
                Problema:
              </span>{" "}
              <span className="text-sm text-foreground">
                {ticket.problema}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Técnico asignado *
            </label>

            <select
              required
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">
                Seleccionar técnico...
              </option>

              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.nombre} - {tech.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Aceptar y Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

