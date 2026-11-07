import 'server-only'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, type SessionUser } from './auth'
import { q, q1 } from './db'
import { superadminEmails } from './env'
import { isReadOnlyStatus, isSuperadmin, prestadorCan, type PrestadorPermission, type PrestadorRole } from './permissions'

/** Superadmin o 404 (no revela que la ruta existe). */
export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || !isSuperadmin(user, superadminEmails())) notFound()
  return user
}

export type Membership = {
  clientId: string
  clientName: string
  status: string
  verificacion: string
  role: PrestadorRole
}

export const getMemberships = cache(async (userId: string) => {
  return q<Membership>(
    `SELECT c.id AS "clientId", c.name AS "clientName", c.status, c.verificacion, m.role
       FROM client_member m JOIN client c ON c.id = m.client_id
      WHERE m.user_id = $1
      ORDER BY m.created_at`,
    [userId],
  )
})

export type PrestadorContext = Membership & { user: SessionUser; readOnly: boolean }

/**
 * Contexto del prestador logueado. El client_id SIEMPRE sale de acá (sesión → membresía),
 * nunca del formulario ni de la URL. Sin sesión o sin membresía → 404.
 */
export const getPrestadorContext = cache(async (): Promise<PrestadorContext> => {
  const user = await getCurrentUser()
  if (!user) notFound()
  const memberships = await getMemberships(user.id)
  if (!memberships.length) notFound()
  const current = memberships[0]
  return { ...current, user, readOnly: isReadOnlyStatus(current.status) }
})

/** Para páginas del panel: exige permiso y que ya haya cambiado la contraseña temporal. */
export async function requirePrestador(permission: PrestadorPermission = 'dashboard.view') {
  const ctx = await getPrestadorContext()
  if (ctx.user.mustChangePassword) redirect('/empresa/cambiar-clave')
  if (!prestadorCan(ctx.role, permission)) notFound()
  return ctx
}

/** Para server actions que escriben: además del permiso, bloquea si la cuenta está pausada o dada de baja. */
export async function requirePrestadorWrite(permission: PrestadorPermission) {
  const ctx = await requirePrestador(permission)
  if (ctx.readOnly) {
    return { ctx, error: 'Tu cuenta está en modo solo lectura (pausada o dada de baja). Escribinos para reactivarla.' }
  }
  return { ctx, error: null as string | null }
}

export type PerfilHogar = { celular: string; barrio: string; direccion: string; indicaciones: string | null }

export async function getPerfilHogar(userId: string) {
  return q1<PerfilHogar>(`SELECT celular, barrio, direccion, indicaciones FROM perfil_hogar WHERE user_id = $1`, [userId])
}

/** Hogar (usuario público) con sesión; si no hay, lo manda a /ingresar y vuelve después. */
export async function requireHogar(next: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(next)}`)
  return user
}
