import { Search, Plus } from "lucide-react";
import type { PC, Usuario } from "../types";

interface PCListProps {
  pcs: PC[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentUser: Usuario;
}

export function PCList({
  pcs,
  selectedId,
  onSelect,
  onAdd,
  searchTerm,
  onSearchChange,
  currentUser,
}: PCListProps) {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "recibida":
        return "bg-[#9ca3af]";
      case "diagnosticando":
        return "bg-[#60a5fa]";
      case "reparando":
        return "bg-[#f59e0b]";
      case "lista":
        return "bg-[#10b981]";
      case "entregada":
        return "bg-[#6b7280]";
      default:
        return "bg-[#9ca3af]";
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case "recibida":
        return "Recibida";
      case "diagnosticando":
        return "Diagnóstico";
      case "reparando":
        return "Reparación";
      case "lista":
        return "Lista";
      case "entregada":
        return "Entregada";
      default:
        return estado;
    }
  };

  const isAdmin = currentUser.rol === "administrador";
  const isTechnician = currentUser.rol === "tecnico";

  const visiblePCs = isAdmin
    ? pcs
    : isTechnician
    ? pcs.filter(
        (pc) => pc.tecnicoAsignadoId === currentUser.id
      )
    : pcs;

  const filteredPCs = visiblePCs.filter(
    (pc) =>
      pc.cliente
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      pc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="text"
              placeholder="Buscar PC o cliente..."
              value={searchTerm}
              onChange={(e) =>
                onSearchChange(e.target.value)
              }
              className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
            />
          </div>

          {isAdmin && (
            <button
              onClick={onAdd}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              title="Agregar PC"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {filteredPCs.length}{" "}
          {filteredPCs.length === 1
            ? "computadora"
            : "computadoras"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPCs.map((pc) => (
          <button
            key={pc.id}
            onClick={() => onSelect(pc.id)}
            className={`w-full px-4 py-3 border-b border-border text-left hover:bg-muted transition-colors ${
              selectedId === pc.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-medium text-foreground">
                {pc.id}
              </span>

              <span
                className={`px-2 py-0.5 rounded text-xs text-white ${getStatusColor(
                  pc.estado
                )}`}
              >
                {getStatusText(pc.estado)}
              </span>
            </div>

            <div className="text-sm text-muted-foreground mb-1">
              {pc.cliente}
            </div>

            <div className="text-xs text-muted-foreground">
              {pc.marca} {pc.modelo}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
