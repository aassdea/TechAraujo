import { Search, ExternalLink } from "lucide-react";
import { useState } from "react";

export function ComparadorPrecios() {
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [resultados, setResultados] = useState<
    Array<{
      nombre: string;
      precio: string;
      tienda: string;
      enlace: string;
    }>
  >([]);

  const manejarBusqueda = () => {
    if (!terminoBusqueda.trim()) return;

    setResultados([
      {
        nombre: terminoBusqueda,
        precio: "$" + (Math.random() * 500 + 100).toFixed(2),
        tienda: "MercadoLibre",
        enlace: `https://www.mercadolibre.com.ar/search?q=${encodeURIComponent(terminoBusqueda)}`
      },
      {
        nombre: terminoBusqueda,
        precio: "$" + (Math.random() * 500 + 100).toFixed(2),
        tienda: "Amazon",
        enlace: `https://www.amazon.com/s?k=${encodeURIComponent(terminoBusqueda)}`
      },
      {
        nombre: terminoBusqueda,
        precio: "$" + (Math.random() * 500 + 100).toFixed(2),
        tienda: "CompraGamer",
        enlace: `https://compragamer.com/index.php?seccion=3&criterio=${encodeURIComponent(terminoBusqueda)}`
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Comparador de Precios</h1>
        <p className="text-sm text-muted-foreground">Busca componentes y compara precios</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manejarBusqueda()}
              placeholder="Buscar componente (ej: SSD 1TB, RAM 16GB...)"
              className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          <button
            onClick={manejarBusqueda}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
        </div>

        {resultados.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Resultados</h3>
            {resultados.map((resultado, indice) => (
              <div key={indice} className="p-4 bg-muted border border-border rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-1">{resultado.tienda}</div>
                    <div className="text-sm text-muted-foreground capitalize">{resultado.nombre}</div>
                  </div>
                  <div className="text-lg font-medium text-foreground">{resultado.precio}</div>
                </div>
                <a
                  href={resultado.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ver en {resultado.tienda}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}

        {resultados.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Busca un componente para comparar precios
          </div>
        )}
      </div>
    </div>
  );
}
