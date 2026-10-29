import { X } from "lucide-react";
import { useState } from "react";
import type { PC } from "../types";

interface AddPCModalProps {
  onClose: () => void;
  onAdd: (pc: PC) => void;
}

export function AddPCModal({ onClose, onAdd }: AddPCModalProps) {
  const [formData, setFormData] = useState({
    tipoDispositivo: "laptop" as "pc" | "laptop",
    cliente: "",
    contacto: "",
    marca: "",
    modelo: "",
  });

  const esPC = formData.tipoDispositivo === "pc";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nuevaPC: PC = {
      id: `PC-${Date.now().toString().slice(-6)}`,
      cliente: formData.cliente,
      contacto: formData.contacto,
      marca: esPC ? "PC Genérica" : formData.marca,
      modelo: esPC ? "Escritorio" : formData.modelo,

      estado: "recibida",

      componentes: [],

      reparaciones: [],

      precioTotal: "",

      presupuesto: "",

      diagnostico: "",

      notas: esPC ? "PC de escritorio" : "",

      mensajes: [],

      fechaCreacion: new Date().toISOString(),
    };

    onAdd(nuevaPC);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card rounded-t-xl sm:rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-medium text-card-foreground">
            Nueva PC
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Tipo de equipo
            </label>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDispositivo"
                  value="pc"
                  checked={formData.tipoDispositivo === "pc"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      tipoDispositivo: "pc",
                    })
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm text-foreground">
                  PC de escritorio
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDispositivo"
                  value="laptop"
                  checked={
                    formData.tipoDispositivo === "laptop"
                  }
                  onChange={() =>
                    setFormData({
                      ...formData,
                      tipoDispositivo: "laptop",
                    })
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm text-foreground">
                  Laptop
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Cliente
            </label>

            <input
              type="text"
              required
              value={formData.cliente}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cliente: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Contacto
            </label>

            <input
              type="text"
              required
              value={formData.contacto}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contacto: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Teléfono y/o email"
            />
          </div>

          {esPC ? (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Las PC de escritorio se crearán con
                información genérica (PC Genérica /
                Escritorio).
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Marca
                </label>

                <input
                  type="text"
                  required
                  value={formData.marca}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marca: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
                  placeholder="Ej: Dell, HP, Lenovo"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Modelo
                </label>

                <input
                  type="text"
                  required
                  value={formData.modelo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      modelo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
                  placeholder="Modelo del equipo"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
