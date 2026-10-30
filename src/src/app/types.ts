export interface Mensaje {
  id: string;
  idRemitente: string;
  nombreRemitente: string;
  rolRemitente: RolUsuario;
  texto: string;
  fechaHora: string;
}

export interface PC {
  id: string;
  cliente: string;
  contacto: string;
  marca: string;
  modelo: string;

  estado:
    | "recibida"
    | "diagnosticando"
    | "reparando"
    | "lista"
    | "entregada";

  componentes: Array<{
    nombre: string;
    precio: string;
    verificado: boolean;
  }>;

  reparaciones: Array<{
    descripcion: string;
    precio?: string;
    realizada: boolean;
  }>;

  precioTotal: string;
  presupuesto: string;
  diagnostico: string;
  notas: string;

  tecnicoAsignadoId?: string;

  mensajes: Mensaje[];

  fechaCreacion: string;
}

export interface SolicitudTicket {
  id: string;

  cliente: string;
  telefono: string;
  email: string;

  tipoDispositivo: "pc" | "laptop";

  marca: string;
  modelo: string;

  problema: string;

  estado:
    | "nuevo"
    | "pendiente"
    | "aprobado"
    | "rechazado";

  tecnicoAsignadoId?: string;

  idPC?: string;

  fechaCreacion: string;
}

export type RolUsuario =
  | "cliente"
  | "tecnico"
  | "administrador";

export interface Usuario {
  id: string;

  nombre: string;

  email: string;

  telefono?: string;

  contraseña: string;

  rol: RolUsuario;

  fechaCreacion: string;
}
