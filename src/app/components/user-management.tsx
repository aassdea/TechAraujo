import { useState } from "react";
import { Shield, UserCog, User as UserIcon } from "lucide-react";
import type { Usuario, RolUsuario } from "../types";

interface UserManagementProps {
  users: Usuario[];
  currentUser: Usuario;
  onUpdateUserRole: (userId: string, newRole: RolUsuario) => void;
}

export function UserManagement({
  users,
  currentUser,
  onUpdateUserRole
}: UserManagementProps) {
  const [filter, setFilter] = useState<"all" | RolUsuario>("all");

  const filteredUsers =
    filter === "all"
      ? users
      : users.filter((u) => u.rol === filter);

  const getRoleIcon = (rol: RolUsuario) => {
    switch (rol) {
      case "administrador":
        return <Shield className="w-4 h-4" />;
      case "tecnico":
        return <UserCog className="w-4 h-4" />;
      case "cliente":
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (rol: RolUsuario) => {
    const colors = {
      administrador:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      tecnico:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      cliente:
        "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded ${colors[rol]}`}
      >
        {getRoleIcon(rol)}
        {rol.charAt(0).toUpperCase() + rol.slice(1)}
      </span>
    );
  };

  const getRoleDisplayName = (rol: RolUsuario) => {
    return rol.charAt(0).toUpperCase() + rol.slice(1);
  };

  return (
    <div className="flex-1 bg-card p-4 sm:p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="mb-1">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administra roles y permisos de usuarios
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter("all")}>
          Todos ({users.length})
        </button>

        <button onClick={() => setFilter("administrador")}>
          Administradores (
          {users.filter((u) => u.rol === "administrador").length})
        </button>

        <button onClick={() => setFilter("tecnico")}>
          Técnicos (
          {users.filter((u) => u.rol === "tecnico").length})
        </button>

        <button onClick={() => setFilter("cliente")}>
          Clientes (
          {users.filter((u) => u.rol === "cliente").length})
        </button>
      </div>

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay usuarios{" "}
            {filter !== "all" &&
              `con rol "${getRoleDisplayName(filter)}"`}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 bg-muted border border-border rounded-lg"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-foreground">
                      {user.nombre}
                    </h3>

                    {getRoleBadge(user.rol)}

                    {user.id === currentUser.id && (
                      <span className="text-xs text-muted-foreground">
                        (Tú)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">Email:</span>{" "}
                      {user.email}
                    </p>

                    {user.telefono && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">
                          Teléfono:
                        </span>{" "}
                        {user.telefono}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">
                        Registro:
                      </span>{" "}
                      {new Date(
                        user.fechaCreacion
                      ).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>

                {user.id !== currentUser.id && (
                  <div className="sm:ml-4 flex-shrink-0">
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      Cambiar rol
                    </label>

                    <select
                      value={user.rol}
                      onChange={(e) =>
                        onUpdateUserRole(
                          user.id,
                          e.target.value as RolUsuario
                        )
                      }
                    >
                      <option value="cliente">
                        Cliente
                      </option>
                      <option value="tecnico">
                        Técnico
                      </option>
                      <option value="administrador">
                        Administrador
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

