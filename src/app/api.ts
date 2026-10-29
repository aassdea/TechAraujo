import type { Mensaje, PC, SolicitudTicket, Usuario } from "./types";

export const API_URL = import.meta.env.VITE_API_URL || "http://192.168.0.176/techaraujo/backend/api.php";

async function request<T>(resource: string, options: RequestInit = {}): Promise<T> {
  // Algunas llamadas incluyen parámetros, por ejemplo: "tickets&id=12".
  // Antes se codificaba toda esa cadena como el valor de `resource`, por lo que
  // PHP recibía `resource=tickets&id=12` en vez de `resource=tickets` e `id=12`.
  const [resourceName, ...queryParts] = resource.split("&");
  const url = new URL(API_URL, window.location.origin);
  url.searchParams.set("resource", resourceName);

  const query = new URLSearchParams(queryParts.join("&"));
  query.forEach((value, key) => url.searchParams.set(key, value));

  const response = await fetch(url.toString(), {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const responseText = await response.text();
  let data: { error?: string } | T = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText) as T;
    } catch {
      throw new Error(`La API respondió un formato inválido (HTTP ${response.status}). Verificá que Apache y PHP estén iniciados.`);
    }
  }

  if (!responseText && !response.ok) {
    throw new Error(`La API no respondió datos (HTTP ${response.status}). Verificá que Apache y MySQL estén iniciados en la PC servidor.`);
  }

  if (!response.ok) throw new Error(data.error || "Error de API");
  return data as T;
}

export interface ResultadoPrecio {
  nombre: string;
  tienda: string;
  precio: number | null;
  precioTexto: string;
  enlace: string;
  imagen: string;
  envio: string;
}

export const api = {
  health: () => request<{ok:boolean}>("health"),
  login: (email:string, contraseña:string) => request<Usuario>("login", {method:"POST", body:JSON.stringify({email, contraseña})}),
  loginGoogle: (credential:string) => request<Usuario>("login-google", {method:"POST", body:JSON.stringify({credential})}),
  usuarios: () => request<Usuario[]>("usuarios"),
  crearUsuario: (usuario:Usuario) => request<Usuario>("usuarios", {method:"POST", body:JSON.stringify(usuario)}),
  actualizarRol: (id:string, rol:Usuario["rol"]) => request<Usuario>(`usuarios&id=${id}`, {method:"PATCH", body:JSON.stringify({rol})}),
  tickets: () => request<SolicitudTicket[]>("tickets"),
  crearTicket: (ticket:SolicitudTicket, clienteId:string) => request<{id:string}>("tickets", {method:"POST", body:JSON.stringify({...ticket, clienteId})}),
  actualizarTicket: (id:string, data:Partial<SolicitudTicket>) => request<{ok:boolean}>(`tickets&id=${id}`, {method:"PATCH", body:JSON.stringify(data)}),
  pcs: () => request<PC[]>("pcs"),
  crearPC: (pc:PC, clienteId?:string, ticketId?:string) => request<{id:string}>("pcs", {method:"POST", body:JSON.stringify({...pc, clienteId, ticketId})}),
  actualizarPC: (id:string, data:Partial<PC>) => request<{ok:boolean}>(`pcs&id=${id}`, {method:"PATCH", body:JSON.stringify(data)}),
  enviarOrdenPDF: (data:{equipoId:string; usuarioId:string; archivo:string; pdf:string}) => request<{ok:boolean; enviadoA:string}>("enviar-pdf", {method:"POST", body:JSON.stringify(data)}),
  compararPrecios: (consulta:string, usuarioId:string) => request<{resultados:ResultadoPrecio[]; cache?:boolean}>(`comparar-precios&q=${encodeURIComponent(consulta)}&usuarioId=${encodeURIComponent(usuarioId)}`),
  mensajes: (chatId:string) => request<Mensaje[]>(`mensajes&chat_id=${chatId}`),
  crearMensaje: (data:Record<string,unknown>) => request<{id:string}>("mensajes", {method:"POST", body:JSON.stringify(data)}),
};
