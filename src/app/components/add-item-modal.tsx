import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";

interface AddItemModalProps {
  titulo: string;
  etiquetaNombre: string;
  placeholderNombre: string;
  onClose: () => void;
  onSubmit: (nombre: string, precio: string) => void;
}

/**
 * Convierte lo que escribe el usuario en un número "limpio" para guardar:
 *  "1.500,50" -> "1500.50"   "1.500" -> "1500"   "$ 2500" -> "2500"   "" -> ""
 * Devuelve null si no es un número válido.
 */
export function normalizarPrecio(texto: string): string | null {
  let t = texto.replace(/[$\s]/g, "");
  if (t === "") return "";

  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, ""); // 1.500 / 12.345.678 = separador de miles
  }

  return /^\d+(\.\d{1,2})?$/.test(t) ? t : null;
}

export function AddItemModal({
  titulo,
  etiquetaNombre,
  placeholderNombre,
  onClose,
  onSubmit,
}: AddItemModalProps) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError("Escribí un nombre.");
      return;
    }

    const precioLimpio = normalizarPrecio(precio);
    if (precioLimpio === null) {
      setError("El precio no es válido. Ingresá solo números o dejalo vacío.");
      return;
    }

    onSubmit(nombre.trim(), precioLimpio);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-2">
      <div className="bg-card w-full max-w-md mx-4 rounded-lg border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-medium text-foreground">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              {etiquetaNombre} *
            </label>
            <input
              type="text"
              autoFocus
              maxLength={50}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={placeholderNombre}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Precio (opcional)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Dejalo vacío si todavía no tiene precio"
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

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
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
