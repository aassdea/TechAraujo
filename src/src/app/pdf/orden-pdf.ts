import { jsPDF } from "jspdf";
import type { PC } from "../types";

/**
 * Genera el PDF de la "Orden de Reparación".
 * Se usa tanto para descargar como para enviar por mail, así el cliente
 * recibe exactamente el mismo documento que se descarga.
 *
 * Solo usa fuentes estándar de jsPDF (Helvetica): no soporta símbolos como "✓",
 * por eso las casillas se dibujan con líneas.
 */

const COLOR = {
  marca: [15, 23, 42] as const,      // azul muy oscuro (cabecera)
  acento: [37, 99, 235] as const,    // azul de títulos
  texto: [31, 41, 55] as const,
  suave: [107, 114, 128] as const,
  linea: [229, 231, 235] as const,
  fondo: [243, 244, 246] as const,
  ok: [22, 163, 74] as const,
};

const MARGEN = 15;
const ANCHO = 210;
const ALTO = 297;
const ANCHO_UTIL = ANCHO - MARGEN * 2;
const LIMITE_Y = ALTO - 22; // deja lugar para el pie de página

const ESTADOS: Record<string, string> = {
  recibida: "Recibida",
  diagnosticando: "En diagnóstico",
  reparando: "En reparación",
  lista: "Lista para retirar",
  entregada: "Entregada",
};

const formatoMoneda = (valor: string | number) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return `$ ${valor}`;
  return `$ ${numero.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const textoPrecio = (valor?: string | number) =>
  Number(valor) > 0 ? formatoMoneda(valor as string | number) : "-";

const formatoFecha = (fecha: string) => {
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString("es-AR");
};

export function nombreArchivoOrden(pc: PC) {
  const cliente = (pc.cliente || "cliente").trim().replace(/[^\p{L}\p{N}]+/gu, "_");
  return `Orden_${pc.id}_${cliente}.pdf`;
}

export function generarOrdenPDF(pc: PC, tecnico?: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const fijarTexto = (color: readonly [number, number, number], size: number, bold = false) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
  };

  const dibujarCabecera = () => {
    doc.setFillColor(...COLOR.marca);
    doc.rect(0, 0, ANCHO, 32, "F");

    fijarTexto([255, 255, 255], 20, true);
    doc.text("TechRepair", MARGEN, 15);
    fijarTexto([203, 213, 225], 10);
    doc.text("Servicio técnico de computadoras", MARGEN, 22);

    fijarTexto([255, 255, 255], 14, true);
    doc.text("ORDEN DE REPARACIÓN", ANCHO - MARGEN, 15, { align: "right" });
    fijarTexto([203, 213, 225], 10);
    doc.text(`N° ${pc.id}  ·  ${formatoFecha(pc.fechaCreacion)}`, ANCHO - MARGEN, 22, { align: "right" });
    y = 42;
  };

  const nuevaPaginaSiHaceFalta = (alto: number) => {
    if (y + alto > LIMITE_Y) {
      doc.addPage();
      dibujarCabecera();
    }
  };

  const titulo = (texto: string) => {
    nuevaPaginaSiHaceFalta(14);
    fijarTexto(COLOR.acento, 11, true);
    doc.text(texto.toUpperCase(), MARGEN, y);
    doc.setDrawColor(...COLOR.acento);
    doc.setLineWidth(0.5);
    doc.line(MARGEN, y + 2, MARGEN + ANCHO_UTIL, y + 2);
    y += 9;
  };

  /** Dos columnas "Etiqueta: valor" */
  const campo = (x: number, etiqueta: string, valor: string, ancho: number) => {
    fijarTexto(COLOR.suave, 8);
    doc.text(etiqueta.toUpperCase(), x, y);
    fijarTexto(COLOR.texto, 11, true);
    const lineas = doc.splitTextToSize(valor || "-", ancho) as string[];
    doc.text(lineas, x, y + 5);
    return lineas.length * 5;
  };

  dibujarCabecera();

  // ── Datos del cliente y del equipo ─────────────────────────────────────────
  titulo("Cliente");
  const mitad = ANCHO_UTIL / 2;
  let alto = Math.max(
    campo(MARGEN, "Nombre", pc.cliente, mitad - 5),
    campo(MARGEN + mitad, "Contacto", pc.contacto, mitad - 5),
  );
  y += alto + 9;

  titulo("Equipo");
  alto = Math.max(
    campo(MARGEN, "Marca y modelo", `${pc.marca} ${pc.modelo}`.trim(), mitad - 5),
    campo(MARGEN + mitad, "Estado", ESTADOS[pc.estado] ?? pc.estado, mitad - 5),
  );
  y += alto + 8;

  alto = campo(MARGEN, "Técnico a cargo", tecnico?.trim() || "Sin asignar", ANCHO_UTIL);
  y += alto + 9;

  if (pc.diagnostico?.trim()) {
    nuevaPaginaSiHaceFalta(28); // que el título no quede solo al final de la página
    titulo("Diagnóstico");
    fijarTexto(COLOR.texto, 10);
    const lineas = doc.splitTextToSize(pc.diagnostico, ANCHO_UTIL) as string[];
    lineas.forEach((linea) => {
      nuevaPaginaSiHaceFalta(6);
      doc.text(linea, MARGEN, y);
      y += 5;
    });
    y += 6;
  }

  // ── Tablas: componentes y servicios/reparaciones ───────────────────────────
  const dibujarCasilla = (hecho: boolean) => {
    doc.setDrawColor(...COLOR.suave);
    doc.setLineWidth(0.3);
    doc.rect(MARGEN + 5, y - 3.2, 3.6, 3.6);
    if (hecho) {
      doc.setDrawColor(...COLOR.ok);
      doc.setLineWidth(0.7);
      doc.line(MARGEN + 5.7, y - 1.3, MARGEN + 6.7, y - 0.2);
      doc.line(MARGEN + 6.7, y - 0.2, MARGEN + 8.2, y - 2.8);
    }
  };

  const tabla = (
    tituloSeccion: string,
    colCasilla: string,
    colNombre: string,
    filas: Array<{ nombre: string; precio?: string; hecho: boolean }>,
  ) => {
    titulo(tituloSeccion);
    const colPrecio = MARGEN + ANCHO_UTIL;

    const encabezado = () => {
      doc.setFillColor(...COLOR.fondo);
      doc.rect(MARGEN, y - 4.5, ANCHO_UTIL, 7, "F");
      fijarTexto(COLOR.suave, 8, true);
      doc.text(colCasilla, MARGEN + 2, y);
      doc.text(colNombre, MARGEN + 26, y);
      doc.text("PRECIO", colPrecio - 2, y, { align: "right" });
      y += 7;
    };
    encabezado();

    filas.forEach((fila) => {
      const nombre = doc.splitTextToSize(fila.nombre || "-", 110) as string[];
      const altoFila = Math.max(7, nombre.length * 5 + 2);
      if (y + altoFila > LIMITE_Y) {
        doc.addPage();
        dibujarCabecera();
        encabezado();
      }

      dibujarCasilla(fila.hecho);

      fijarTexto(COLOR.texto, 10);
      doc.text(nombre, MARGEN + 26, y);
      doc.text(textoPrecio(fila.precio), colPrecio - 2, y, { align: "right" });

      y += altoFila - 2;
      doc.setDrawColor(...COLOR.linea);
      doc.setLineWidth(0.2);
      doc.line(MARGEN, y, MARGEN + ANCHO_UTIL, y);
      y += 5;
    });
    y += 3;
  };

  if (pc.componentes.length > 0) {
    tabla(
      "Componentes",
      "INSTALADO",
      "COMPONENTE",
      pc.componentes.map((c) => ({ nombre: c.nombre, precio: c.precio, hecho: c.verificado })),
    );
  }

  if (pc.reparaciones.length > 0) {
    tabla(
      "Servicios y reparaciones",
      "REALIZADO",
      "SERVICIO / REPARACIÓN",
      pc.reparaciones.map((r) => ({ nombre: r.descripcion, precio: r.precio, hecho: r.realizada })),
    );
  }

  // ── Total ───────────────────────────────────────────────────────────────────
  if (pc.precioTotal && Number(pc.precioTotal) > 0) {
    nuevaPaginaSiHaceFalta(18);
    doc.setFillColor(...COLOR.marca);
    doc.roundedRect(MARGEN + ANCHO_UTIL - 80, y, 80, 12, 2, 2, "F");
    fijarTexto([203, 213, 225], 9, true);
    doc.text("TOTAL", MARGEN + ANCHO_UTIL - 76, y + 7.6);
    fijarTexto([255, 255, 255], 13, true);
    doc.text(formatoMoneda(pc.precioTotal), MARGEN + ANCHO_UTIL - 4, y + 8, { align: "right" });
    y += 20;
  }

  // ── Notas ───────────────────────────────────────────────────────────────────
  if (pc.notas?.trim()) {
    nuevaPaginaSiHaceFalta(28);
    titulo("Notas");
    fijarTexto(COLOR.texto, 10);
    (doc.splitTextToSize(pc.notas, ANCHO_UTIL) as string[]).forEach((linea) => {
      nuevaPaginaSiHaceFalta(6);
      doc.text(linea, MARGEN, y);
      y += 5;
    });
  }

  // ── Pie de página con numeración ────────────────────────────────────────────
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLOR.linea);
    doc.setLineWidth(0.3);
    doc.line(MARGEN, ALTO - 15, ANCHO - MARGEN, ALTO - 15);
    fijarTexto(COLOR.suave, 8);
    doc.text(`Orden N° ${pc.id}  ·  Generado el ${new Date().toLocaleDateString("es-AR")}`, MARGEN, ALTO - 10);
    doc.text(`Página ${i} de ${paginas}`, ANCHO - MARGEN, ALTO - 10, { align: "right" });
  }

  return doc;
}

/** PDF en base64 (sin el prefijo "data:..."), listo para enviar a la API. */
export function ordenPDFBase64(pc: PC, tecnico?: string): string {
  const dataUri = generarOrdenPDF(pc, tecnico).output("datauristring");
  return dataUri.substring(dataUri.indexOf("base64,") + 7);
}
