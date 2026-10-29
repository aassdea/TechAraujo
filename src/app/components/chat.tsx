import { useState, useRef, useEffect } from "react";
import { Send, Shield } from "lucide-react";
import type { Mensaje, Usuario } from "../types";

interface ChatProps {
  mensajes: Mensaje[];
  currentUser: Usuario;
  onSendMessage: (text: string) => void;
  otherUserName?: string;
}

export function Chat({
  mensajes,
  currentUser,
  onSendMessage,
  otherUserName,
}: ChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          Chat{" "}
          {otherUserName &&
            `con ${otherUserName}`}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No hay mensajes aún. Inicia la
            conversación.
          </div>
        ) : (
          mensajes.map((message) => {
            const isCurrentUser =
              message.idRemitente ===
              currentUser.id;

            const isAdmin =
              message.rolRemitente ===
              "administrador";

            return (
              <div
                key={message.id}
                className={`flex ${
                  isCurrentUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isCurrentUser
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs opacity-70 mb-1">
                    {
                      message.nombreRemitente
                    }

                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded text-[10px]">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="text-sm">
                    {message.texto}
                  </div>

                  <div className="text-xs opacity-60 mt-1">
                    {new Date(
                      message.fechaHora
                    ).toLocaleTimeString(
                      "es-AR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) =>
              setNewMessage(e.target.value)
            }
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-3 py-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
