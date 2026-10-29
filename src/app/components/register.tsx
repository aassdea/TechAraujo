import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { Usuario } from "../types";

interface RegisterProps {
  onRegister: (user: Usuario) => void;
  onSwitchToLogin: () => void;
  users: Usuario[];
}

export function Register({
  onRegister,
  onSwitchToLogin,
  users
}: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    confirmarContraseña: ""
  });

  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.contraseña !== formData.confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (users.find((u) => u.email === formData.email)) {
      setError("Este email ya está registrado");
      return;
    }

    const nuevoUsuario: Usuario = {
      id: `USER-${Date.now()}`,
      nombre: formData.nombre,
      email: formData.email,
      contraseña: formData.contraseña,
      rol: "cliente",
      fechaCreacion: new Date().toISOString()
    };

    onRegister(nuevoUsuario);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">TechRepair</h1>
          <p className="text-sm text-muted-foreground">
            Creá tu cuenta para solicitar y seguir tus reparaciones
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl mb-6">Crear Cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div> 
              <label className="block text-xs text-muted-foreground mb-1.5">Nombre completo</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nombre: e.target.value
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Juan Pérez"
              />
            </div>

            <div> 
              <label className="block text-xs text-muted-foreground mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div> 
              <label className="block text-xs text-muted-foreground mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                value={formData.contraseña}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contraseña: e.target.value
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            <div> 
              <label className="block text-xs text-muted-foreground mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                required
                value={formData.confirmarContraseña}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmarContraseña: e.target.value
                  }))
                }
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2.5 text-sm bg-foreground text-background rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-foreground hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
