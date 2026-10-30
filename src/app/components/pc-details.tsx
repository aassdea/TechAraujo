import { useState } from "react";
import { X, Download, MessageSquare, Check, Mail, Loader2 } from "lucide-react";
import { Chat } from "./chat";
import { AddItemModal } from "./add-item-modal";
import type { PC, Usuario, Mensaje } from "../types";

interface PCDetailsProps {
  pc: PC;
  onClose: () => void;
  onUpdate: (updates: Partial<PC>) => void;
  onExportPDF: (pc: PC) => void;
  onSendPDFEmail: (pc: PC) => Promise<void>;
  currentUser: Usuario;
  technicians: Usuario[];
  onSendMessage: (message: Mensaje) => void;
}

export function PCDetails({
  pc,
  onClose,
  onUpdate,
  onExportPDF,
  onSendPDFEmail,
  currentUser,
  technicians,
  onSendMessage,
}: PCDetailsProps) {
  const [showChat, setShowChat] = useState(false);
  const [itemModal, setItemModal] = useState<"componente" | "servicio" | null>(null);
  const [envioMail, setEnvioMail] = useState<{
    estado: "idle" | "enviando" | "ok" | "error";
    mensaje: string;
  }>({ estado: "idle", mensaje: "" });

  const estados: Array<{
    value: PC["estado"];
    label: string;
  }> = [
    { value: "recibida", label: "Recibida" },
    { value: "diagnosticando", label: "Diagnóstico" },
    { value: "reparando", label: "Reparación" },
    { value: "lista", label: "Lista" },
    { value: "entregada", label: "Entregada" },
  ];

  const isAdmin = currentUser.rol === "administrador";
  const isTechnician = currentUser.rol === "tecnico";

  const puedeEnviarMail = isAdmin || isTechnician;

  const enviarPorMail = async () => {
    if (envioMail.estado === "enviando") return;
    setEnvioMail({ estado: "enviando", mensaje: "" });
    try {
      await onSendPDFEmail(pc);
      setEnvioMail({ estado: "ok", mensaje: "PDF enviado al mail del cliente." });
    } catch (error) {
      setEnvioMail({
        estado: "error",
        mensaje: error instanceof Error ? error.message : "No se pudo enviar el mail.",
      });
    }
    window.setTimeout(() => setEnvioMail({ estado: "idle", mensaje: "" }), 6000);
  };

  const isAssignedTechnician =
    pc.tecnicoAsignadoId === currentUser.id;

  const canAccessChat =
    isAdmin || isAssignedTechnician;

  const assignedTechnician = pc.tecnicoAsignadoId
    ? technicians.find(
        (t) => t.id === pc.tecnicoAsignadoId
      )
    : null;

  const handleSendMessage = (texto: string) => {
    const mensaje: Mensaje = {
      id: `MSG-${Date.now()}`,
      idRemitente: currentUser.id,
      nombreRemitente: currentUser.nombre,
      rolRemitente: currentUser.rol,
      texto,
      fechaHora: new Date().toISOString(),
    };

    onSendMessage(mensaje);
  };

  const toggleComponent = (index: number) => {
    const updated = [...pc.componentes];

    updated[index] = {
      ...updated[index],
      verificado: !updated[index].verificado,
    };

    onUpdate({
      componentes: updated,
    });
  };

  const toggleRepair = (index: number) => {
    const updated = [...pc.reparaciones];

    updated[index] = {
      ...updated[index],
      realizada: !updated[index].realizada,
    };

    onUpdate({
      reparaciones: updated,
    });
  };

  const guardarItem = (nombre: string, precio: string) => {
    if (itemModal === "componente") {
      onUpdate({
        componentes: [...pc.componentes, { nombre, precio, verificado: false }],
      });
    } else if (itemModal === "servicio") {
      onUpdate({
        reparaciones: [...pc.reparaciones, { descripcion: nombre, precio, realizada: false }],
      });
    }
    setItemModal(null);
  };

  if (showChat && canAccessChat) {
    return (
      <div className="w-full md:w-[400px] md:flex-shrink-0 h-full border-l border-border flex flex-col bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-medium text-card-foreground">
            Chat - {pc.id}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Ver detalles
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <Chat
            mensajes={pc.mensajes}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            otherUserName={pc.cliente}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[400px] md:flex-shrink-0 h-full border-l border-border flex flex-col bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-medium text-card-foreground">
          {pc.id}
        </h2>

        <div className="flex items-center gap-2">
          {canAccessChat && (
            <button
              onClick={() => setShowChat(true)}
              className="p-2 hover:bg-accent rounded transition-colors relative"
              title="Chat con cliente"
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground" />

              {pc.mensajes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>
          )}

          {puedeEnviarMail && (
            <button
              onClick={enviarPorMail}
              disabled={envioMail.estado === "enviando"}
              className="p-2 hover:bg-accent rounded transition-colors disabled:opacity-50"
              title="Enviar PDF por mail al cliente"
            >
              {envioMail.estado === "enviando" ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Mail className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}

          <button
            onClick={() => onExportPDF(pc)}
            className="p-2 hover:bg-accent rounded transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {envioMail.mensaje && (
        <div
          role="status"
          className={`px-4 py-2 text-sm ${
            envioMail.estado === "ok"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {envioMail.mensaje}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Cliente
          </h3>

          <div className="space-y-2">
            <input
              type="text"
              value={pc.cliente}
              onChange={(e) =>
                onUpdate({
                  cliente: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Nombre del cliente"
            />

            <input
              type="text"
              value={pc.contacto}
              onChange={(e) =>
                onUpdate({
                  contacto: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Teléfono/Email"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Equipo
          </h3>

          <div className="space-y-2">
            <input
              type="text"
              value={pc.marca}
              onChange={(e) =>
                onUpdate({
                  marca: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Marca"
            />

            <input
              type="text"
              value={pc.modelo}
              onChange={(e) =>
                onUpdate({
                  modelo: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
              placeholder="Modelo"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Estado
          </h3>

          <select
            value={pc.estado}
            onChange={(e) =>
              onUpdate({
                estado: e.target.value as PC["estado"],
              })
            }
            className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
          >
            {estados.map((s) => (
              <option
                key={s.value}
                value={s.value}
              >
                {s.label}
              </option>
            ))}
          </select>
        </section>

        {isAdmin && (
          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Técnico Asignado
            </h3>

            <select
              value={pc.tecnicoAsignadoId || ""}
              onChange={(e) =>
                onUpdate({
                  tecnicoAsignadoId:
                    e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
            >
              <option value="">
                Sin asignar
              </option>

              {technicians.map((tech) => (
                <option
                  key={tech.id}
                  value={tech.id}
                >
                  {tech.nombre}
                </option>
              ))}
            </select>

            {assignedTechnician && (
              <p className="text-xs text-muted-foreground mt-1">
                {assignedTechnician.email}
              </p>
            )}
          </section>
        )}

        {isTechnician &&
          !isAdmin &&
          assignedTechnician && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Técnico Asignado
              </h3>

              <div className="text-sm text-foreground">
                {assignedTechnician.nombre}
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {assignedTechnician.email}
              </p>
            </section>
          )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Componentes
            </h3>

            <button
              onClick={() => setItemModal("componente")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + Agregar
            </button>
          </div>

          <div className="space-y-2">
            {pc.componentes.map(
              (comp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <button
                    onClick={() =>
                      toggleComponent(idx)
                    }
                    className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                      comp.verificado
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {comp.verificado && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">
                      {comp.nombre}
                    </div>

                    {comp.precio && (
                      <div className="text-xs text-muted-foreground">
                        ${comp.precio}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Servicios y reparaciones
            </h3>

            <button
              onClick={() => setItemModal("servicio")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + Agregar
            </button>
          </div>

          <div className="space-y-2">
            {pc.reparaciones.map(
              (repair, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <button
                    onClick={() =>
                      toggleRepair(idx)
                    }
                    className={`mt-0.5 w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                      repair.realizada
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {repair.realizada && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">
                      {repair.descripcion}
                    </div>

                    {repair.precio && (
                      <div className="text-xs text-muted-foreground">
                        ${repair.precio}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Precio Total
          </h3>

          <input
            type="text"
            value={pc.precioTotal}
            onChange={(e) =>
              onUpdate({
                precioTotal: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
            placeholder="$0.00"
          />
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Presupuesto
          </h3>

          <input
            type="text"
            value={pc.presupuesto}
            onChange={(e) =>
              onUpdate({
                presupuesto: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm text-foreground"
            placeholder="$0.00"
          />
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Diagnóstico
          </h3>

          <textarea
            value={pc.diagnostico}
            onChange={(e) =>
              onUpdate({
                diagnostico: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm resize-none text-foreground"
            rows={4}
            placeholder="Diagnóstico del equipo..."
          />
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Notas
          </h3>

          <textarea
            value={pc.notas}
            onChange={(e) =>
              onUpdate({
                notas: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm resize-none text-foreground"
            rows={4}
            placeholder="Notas adicionales..."
          />
        </section>
      </div>

      {itemModal && (
        <AddItemModal
          titulo={itemModal === "componente" ? "Agregar componente" : "Agregar servicio o reparación"}
          etiquetaNombre={itemModal === "componente" ? "Nombre del componente" : "Servicio o reparación"}
          placeholderNombre={
            itemModal === "componente" ? "SSD 480GB, fuente 500W..." : "Limpieza interna, cambio de pantalla..."
          }
          onClose={() => setItemModal(null)}
          onSubmit={guardarItem}
        />
      )}
    </div>
  );
}
