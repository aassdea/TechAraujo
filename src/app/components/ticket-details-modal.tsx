import { useState } from "react";
import { X, Save } from "lucide-react";
import type { SolicitudTicket } from "../types";

interface TicketDetailsModalProps {
  ticket: SolicitudTicket;
  onClose: () => void;
  onUpdate: (ticketId: string, marca: string, modelo: string) => void;
}

export function TicketDetailsModal({ ticket, onClose, onUpdate }: TicketDetailsModalProps) {
  const [marca, setBrand] = useState(ticket.marca || "");
  const [modelo, setModel] = useState(ticket.modelo || "");

  const isPC = ticket.tipoDispositivo === "pc";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isPC) {
      
      onUpdate(ticket.id, "", "");
    } else {
      
      if (marca.trim() && modelo.trim()) {
        onUpdate(ticket.id, marca.trim(), modelo.trim());
      } else {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-lg mx-4 rounded-lg border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-medium text-foreground">Completar información - {ticket.id}</h2>
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
              <span className="text-xs text-muted-foreground">Cliente: </span>
              <span className="text-sm text-foreground">{ticket.cliente}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tipo: </span>
              <span className="text-sm text-foreground capitalize">{ticket.tipoDispositivo}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Problema: </span>
              <span className="text-sm text-foreground">{ticket.problema}</span>
            </div>
          </div>

          {isPC ? (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Las PC de escritorio no requieren marca/modelo específico. Se creará con información genérica.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  value={marca}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Dell, HP, Lenovo..."
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={modelo}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Inspiron 15, Pavilion..."
                />
              </div>
            </>
          )}

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
              <Save className="w-3.5 h-3.5" />
              {isPC ? "Crear PC en Computadoras" : "Completar y crear en Computadoras"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
