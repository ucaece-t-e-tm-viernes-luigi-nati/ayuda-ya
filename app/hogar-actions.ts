'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { FormState } from '@/components/forms'
import { auth, getCurrentUser } from '@/lib/auth'
import { BARRIOS } from '@/lib/catalogo'
import { q, q1 } from '@/lib/db'
import { isSuperadminEmail } from '@/lib/env'
import { isValidEmail, normalizeEmail } from '@/lib/users'

const GENERIC = 'Correo o contraseña incorrectos.'
const str = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? '').trim().slice(0, max)

function safeNext(value: FormDataEntryValue | null) {
  const v = String(value ?? '')
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/empresa') && !v.startsWith('/plataforma') ? v : '/mis-pedidos'
}

type Perfil = { celular: string; barrio: string; direccion: string; indicaciones: string | null }

function validarPerfil(fd: FormData): { error: string } | { perfil: Perfil } {
  const celular = str(fd, 'celular', 40).replace(/[^\d+]/g, '')
  const barrio = str(fd, 'barrio', 60)
  const direccion = str(fd, 'direccion', 160)
  if (celular.replace(/\D/g, '').length < 8) return { error: 'Revisá el número de celular (con característica, ej. 223 555-1234).' }
  if (!(BARRIOS as readonly string[]).includes(barrio)) return { error: 'Elegí tu barrio.' }
  if (direccion.length < 4) return { error: 'Indicá la dirección (calle y número).' }
  if (fd.get('acepta') !== 'on') return { error: 'Para seguir tenés que aceptar que compartamos tu dirección y celular con el profesional asignado.' }
  return { perfil: { celular, barrio, direccion, indicaciones: str(fd, 'indicaciones', 200) || null } }
}

async function guardarPerfil(userId: string, p: Perfil) {
  await q(
    `INSERT INTO perfil_hogar (user_id, celular, barrio, direccion, indicaciones) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET celular = $2, barrio = $3, direccion = $4, indicaciones = $5, updated_at = now()`,
    [userId, p.celular, p.barrio, p.direccion, p.indicaciones],
  )
}

/** Registro del hogar: cuenta (better-auth) + datos de contacto y dirección. */
export async function registrarHogar(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, 'nombre', 80)
  const email = normalizeEmail(fd.get('email'))
  const password = String(fd.get('password') ?? '')
  if (name.length < 2) return { error: 'Decinos tu nombre y apellido.' }
  if (!isValidEmail(email)) return { error: 'Ingresá un correo válido.' }
  if (password.length < 8) return { error: 'La contraseña tiene que tener al menos 8 caracteres.' }
  const v = validarPerfil(fd)
  if ('error' in v) return { error: v.error }
  if (isSuperadminEmail(email)) return { error: 'No pudimos crear la cuenta. ¿Ya existe ese correo?' }

  let userId: string
  try {
    const res = await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() })
    userId = res.user.id
  } catch {
    return { error: 'No pudimos crear la cuenta. ¿Ya existe ese correo? Probá ingresar.' }
  }
  await guardarPerfil(userId, v.perfil)
  redirect(safeNext(fd.get('next')))
}

/** Ingreso del hogar. Rechaza (con mensaje genérico) cuentas de prestadores y del equipo: tienen su propio login. */
export async function ingresarHogar(_: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(fd.get('email'))
  const password = String(fd.get('password') ?? '')
  if (!email || !password) return { error: GENERIC }
  const user = await q1<{ id: string; interno: boolean }>(
    `SELECT u.id, (u.role = 'superadmin' OR EXISTS (SELECT 1 FROM client_member m WHERE m.user_id = u.id)) AS interno
       FROM "user" u WHERE lower(u.email) = $1`,
    [email],
  )
  if (!user || user.interno || isSuperadminEmail(email)) return { error: GENERIC }
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
  } catch {
    return { error: GENERIC }
  }
  redirect(safeNext(fd.get('next')))
}

/** Completar o actualizar los datos del hogar (para cuentas sin perfil). */
export async function guardarDatosHogar(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/ingresar?next=/completar-datos')
  const v = validarPerfil(fd)
  if ('error' in v) return { error: v.error }
  const nombre = str(fd, 'nombre', 80)
  if (nombre.length >= 2 && nombre !== user.name) await q(`UPDATE "user" SET name = $2, "updatedAt" = now() WHERE id = $1`, [user.id, nombre])
  await guardarPerfil(user.id, v.perfil)
  redirect(safeNext(fd.get('next')))
}
