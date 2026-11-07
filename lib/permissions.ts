// Matriz de permisos de AyudaYa. ÚNICO lugar donde se define quién puede qué.
// Se chequea SIEMPRE en el servidor (lib/guards.ts), en páginas, server actions y route handlers.
//
// Superficies:
//   - Hogar (público): /, /ingresar, /pedido/*, /mis-pedidos. Cualquier usuario con sesión (role member).
//   - Prestador (cliente B2B, "empresa"): /empresa/*. Usuario con membresía en client_member.
//   - Superadmin (equipo AyudaYa): /plataforma/*. role superadmin + email en SUPERADMIN_EMAILS + email verificado.

export type PlatformRole = 'superadmin' | 'member'
export type PrestadorRole = 'owner' | 'staff'

export type PrestadorPermission =
  | 'dashboard.view' // ver resumen
  | 'pedidos.view' // ver pedidos asignados
  | 'pedidos.manage' // aceptar / rechazar / en curso / terminado / presupuesto adicional
  | 'perfil.edit' // editar zonas, disponibilidad y contacto
  | 'comisiones.view' // ver comisiones y liquidaciones

export const PRESTADOR_PERMISSIONS: Record<PrestadorRole, readonly PrestadorPermission[]> = {
  owner: ['dashboard.view', 'pedidos.view', 'pedidos.manage', 'perfil.edit', 'comisiones.view'],
  staff: ['dashboard.view', 'pedidos.view', 'pedidos.manage'],
}

export function prestadorCan(role: PrestadorRole | null | undefined, permission: PrestadorPermission) {
  return !!role && PRESTADOR_PERMISSIONS[role].includes(permission)
}

/** Estados en los que el panel queda en solo lectura y el prestador no recibe asignaciones nuevas. */
export const READ_ONLY_STATUSES = ['paused', 'cancelled'] as const
/** Estados en los que se le pueden asignar pedidos nuevos (además de estar verificado). */
export const ASSIGNABLE_STATUSES = ['trial', 'active'] as const

export function isReadOnlyStatus(status: string) {
  return (READ_ONLY_STATUSES as readonly string[]).includes(status)
}

/** Superadmin: rol en la base + email en SUPERADMIN_EMAILS + email verificado. Las tres cosas. */
export function isSuperadmin(user: { role: string; email: string; emailVerified: boolean } | null, allowedEmails: string[]) {
  return !!user && user.role === 'superadmin' && user.emailVerified && allowedEmails.includes(user.email.toLowerCase())
}
