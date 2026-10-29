import { useState } from "react";
import { X, Send } from "lucide-react";
import type { SolicitudTicket, Usuario } from "../types";

interface ClientTicketFormProps {
  onClose: () => void;
  onSubmit: (ticket: SolicitudTicket) => void;
  currentUser: Usuario;
}

export function ClientTicketForm({ onClose, onSubmit, currentUser }: ClientTicketFormProps) {
  const [formData, setFormData] = useState({
    tipoDispositivo: "pc" as "pc" | "laptop",
    telefono: currentUser.telefono || "",
    problema: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket: SolicitudTicket = {
      id: `TICKET-${Date.now()}`,
      cliente: currentUser.nombre,
      telefono: formData.telefono,
      email: currentUser.email,
      tipoDispositivo: formData.tipoDispositivo,
      marca: "",
      modelo: "",
      problema: formData.problema,
      estado: "nuevo",
      fechaCreacion: new Date().toISOString()
    };

    onSubmit(newTicket);
    onClose();
  };

 return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-xl rounded-lg border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-medium text-foreground">Solicitar Reparación</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Tipo de equipo *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDispositivo"
                  value="pc"
                  checked={formData.tipoDispositivo === "pc"}
                  onChange={() => setFormData(prev => ({ ...prev, tipoDispositivo: "pc" }))}
                  className="w-4 h-4"
                />
                <span className="text-sm text-foreground">PC de escritorio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDispositivo"
                  value="laptop"
                  checked={formData.tipoDispositivo === "laptop"}
                  onChange={() => setFormData(prev => ({ ...prev, tipoDispositivo: "laptop" }))}
                  className="w-4 h-4"
                />
                <span className="text-sm text-foreground">Laptop</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Número de teléfono *
            </label>
            <input
              type="tel"
              required
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="+54 11 1234-5678"
            />
            <p className="mt-1 text-xs text-muted-foreground">Para que podamos contactarte sobre tu reparación</p>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Descripción del problema *
            </label>
            <textarea
              required
              value={formData.problema}
              onChange={(e) => setFormData(prev => ({ ...prev, problema: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={4}
              placeholder="Describe el problema que tiene tu computadora..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
