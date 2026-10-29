import React, { useState } from "react";
import { LogIn } from "lucide-react"; 
import type { Usuario } from "../types"; 
import { GoogleSignIn, googleSignInEnabled } from "./google-sign-in";

interface PropiedadesLogin {
  alIniciarSesion: (usuario: Usuario) => void;
  cambiarARegistro: () => void;
  listaUsuarios: Usuario[];
  alIniciarSesionConCredenciales?: (email: string, contraseña: string) => Promise<void>;
  alIniciarSesionConGoogle?: (credential: string) => Promise<void>;
}

export function Login({ alIniciarSesion, cambiarARegistro, listaUsuarios, alIniciarSesionConCredenciales, alIniciarSesionConGoogle }: PropiedadesLogin) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const manejarEnvio = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setMensajeError("");
    try {
      if (alIniciarSesionConCredenciales) {
        await alIniciarSesionConCredenciales(correo, contrasena);
        return;
      }
      const usuarioEncontrado = listaUsuarios.find((usuario) => usuario.email === correo && usuario.contraseña === contrasena);
      if (usuarioEncontrado) alIniciarSesion(usuarioEncontrado);
      else setMensajeError("Email o contraseña incorrectos");
    } catch {
      setMensajeError("Email o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">TechRepair</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestión de Reparaciones
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl mb-6">Iniciar Sesión</h2>

          {googleSignInEnabled && alIniciarSesionConGoogle && (
            <>
              <GoogleSignIn onCredential={alIniciarSesionConGoogle} />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>

                <div className="relative flex justify-center">
                  <span className="px-2 bg-card text-xs text-muted-foreground">
                    o inicia sesión con email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Email
              </label>

              <input
                type="email"
                required
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Contraseña
              </label>

              <input
                type="password"
                required
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {mensajeError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {mensajeError}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2.5 text-sm bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button
                onClick={cambiarARegistro}
                className="text-foreground hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
