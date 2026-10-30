import { Search, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { api, type ResultadoPrecio } from "../api";

interface ComparadorPreciosProps {
  usuarioId: string;
}

export function ComparadorPrecios({ usuarioId }: ComparadorPreciosProps) {
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [buscado, setBuscado] = useState("");
  const [resultados, setResultados] = useState<ResultadoPrecio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [desdeCache, setDesdeCache] = useState(false);

  const manejarBusqueda = async () => {
    const consulta = terminoBusqueda.trim();
    if (!consulta || cargando) return;

    setCargando(true);
    setError("");
    try {
      const respuesta = await api.compararPrecios(consulta, usuarioId);
      setResultados(respuesta.resultados);
      setDesdeCache(Boolean(respuesta.cache));
      setBuscado(consulta);
    } catch (e) {
      setResultados([]);
      setBuscado("");
      setError(e instanceof Error ? e.message : "No se pudo realizar la búsqueda.");
    } finally {
      setCargando(false);
    }
  };

  const consultaCodificada = encodeURIComponent(terminoBusqueda.trim());
  const tiendasDirectas = [
    { nombre: "MercadoLibre", enlace: `https://listado.mercadolibre.com.ar/${consultaCodificada}` },
    { nombre: "CompraGamer", enlace: `https://compragamer.com/index.php?seccion=3&criterio=${consultaCodificada}` },
  ];

  const hayPrecios = resultados.some((r) => r.precio !== null);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex-shrink-0">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Comparador de Precios</h1>
        <p className="text-sm text-muted-foreground">
          Busca componentes y compara precios reales de Google Shopping
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={terminoBusqueda}
              maxLength={100}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manejarBusqueda()}
              placeholder="Buscar componente (ej: SSD 1TB, RAM 16GB...)"
              className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          <button
            onClick={manejarBusqueda}
            disabled={cargando || !terminoBusqueda.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            Buscar
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {resultados.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Resultados para "{buscado}"
              </h3>
              {desdeCache && (
                <span className="text-xs text-muted-foreground">Resultado guardado (menos de 1 hora)</span>
              )}
            </div>

            {resultados.map((resultado, indice) => (
              <div key={indice} className="p-4 bg-muted border border-border rounded-md flex gap-4">
                {resultado.imagen && (
                  <img
                    src={resultado.imagen}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain rounded bg-white flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{resultado.tienda || "Tienda"}</div>
                      <div className="text-sm text-muted-foreground">{resultado.nombre}</div>
                      {resultado.envio && (
                        <div className="text-xs text-muted-foreground mt-1">{resultado.envio}</div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-medium text-foreground">
                        {resultado.precioTexto || (resultado.precio !== null ? `$${resultado.precio}` : "Sin precio")}
                      </div>
                      {hayPrecios && indice === 0 && resultado.precio !== null && (
                        <div className="text-xs text-green-600 dark:text-green-400">Más barato</div>
                      )}
                    </div>
                  </div>

                  {resultado.enlace && (
                    <a
                      href={resultado.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ver producto
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando && !error && buscado && resultados.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No se encontraron resultados para "{buscado}". Probá con otras palabras.
          </div>
        )}

        {!buscado && !error && !cargando && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Busca un componente para comparar precios
          </div>
        )}

        {terminoBusqueda.trim() && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">También podés abrir la búsqueda directamente en:</p>
            <div className="flex flex-wrap gap-3">
              {tiendasDirectas.map((tienda) => (
                <a
                  key={tienda.nombre}
                  href={tienda.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-foreground hover:underline"
                >
                  {tienda.nombre}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
