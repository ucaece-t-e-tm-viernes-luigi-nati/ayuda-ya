import 'server-only'
import { q } from './db'

export type TipoEvento = 'visita' | 'inicio_asistente' | 'sugerencia' | 'pedido_enviado'

/** Registra un evento para las métricas del MVP. Nunca lanza. */
export async function registrarEvento(tipo: TipoEvento, opts: { userId?: string | null; pedidoId?: string | null; datos?: Record<string, unknown> } = {}) {
  if (!process.env.DATABASE_URL) return
  try {
    await q(`INSERT INTO evento (tipo, user_id, pedido_id, datos) VALUES ($1, $2, $3, $4)`, [
      tipo,
      opts.userId ?? null,
      opts.pedidoId ?? null,
      opts.datos ? JSON.stringify(opts.datos) : null,
    ])
  } catch (error) {
    console.error('[evento] No se pudo registrar', tipo, error)
  }
}

// Límite simple por IP en memoria (por instancia del servidor). En Vercel cada instancia tiene su propio
// contador y se reinicia en cada cold start: alcanza para frenar abusos obvios en el MVP, no es un límite global.
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k)
    }
    return true
  }
  bucket.count++
  return bucket.count <= max
}

export function clientIp(headers: Headers) {
  return (headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || headers.get('x-real-ip') || 'local'
}
