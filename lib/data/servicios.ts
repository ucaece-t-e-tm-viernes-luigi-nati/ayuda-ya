import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import base from '@/data/tarifario.json'
import type { Servicio } from '../catalogo'
import { q, q1 } from '../db'

export const TARIFARIO_TAG = 'servicios'

const fallback: Servicio[] = base.map((s, i) => ({ ...s, activo: true, orden: i + 1 }))

/** Tarifario público (servicios activos). Cacheado: se invalida con updateTag('servicios') al editarlo. */
export async function getTarifario(): Promise<Servicio[]> {
  'use cache'
  cacheTag(TARIFARIO_TAG)
  cacheLife('hours')
  if (!process.env.DATABASE_URL) return fallback
  try {
    const rows = await q<Servicio>(
      `SELECT codigo, rubro, nombre, descripcion, precio, activo, orden FROM servicio WHERE activo ORDER BY rubro = 'plomeria' DESC, rubro = 'gas' DESC, orden, codigo`,
    )
    return rows.length ? rows : fallback
  } catch (error) {
    console.error('[tarifario] No se pudo leer de la base; uso el tarifario base.', error)
    return fallback
  }
}

/** Todos los servicios (también inactivos), para la plataforma. Sin caché. */
export function listServiciosAdmin() {
  return q<Servicio & { pedidos: number }>(
    `SELECT s.codigo, s.rubro, s.nombre, s.descripcion, s.precio, s.activo, s.orden,
            (SELECT count(*)::int FROM pedido p WHERE p.servicio_codigo = s.codigo) AS pedidos
       FROM servicio s ORDER BY s.rubro = 'plomeria' DESC, s.rubro = 'gas' DESC, s.orden, s.codigo`,
  )
}

/** Servicio activo con su precio vigente (para crear un pedido: el precio SIEMPRE sale de la base). */
export function getServicioActivo(codigo: string) {
  return q1<Servicio>(`SELECT codigo, rubro, nombre, descripcion, precio, activo, orden FROM servicio WHERE codigo = $1 AND activo`, [codigo])
}
