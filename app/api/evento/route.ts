import { clientIp, rateLimit, registrarEvento } from '@/lib/eventos'

// Eventos anónimos del sitio público para las métricas del MVP: visita e inicio del asistente.
// (La sugerencia la registra /api/asistente y el pedido enviado, la server action del pedido.)
const PERMITIDOS = new Set(['visita', 'inicio_asistente'])

export async function POST(request: Request) {
  let tipo = ''
  try {
    tipo = String(((await request.json()) as { tipo?: unknown }).tipo ?? '')
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!PERMITIDOS.has(tipo)) return new Response(null, { status: 400 })
  if (rateLimit(`evento:${clientIp(request.headers)}`, 30, 10 * 60 * 1000)) {
    await registrarEvento(tipo as 'visita' | 'inicio_asistente')
  }
  return new Response(null, { status: 204 })
}
