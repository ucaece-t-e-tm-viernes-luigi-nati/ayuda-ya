import { armarPrompt, avisoSeguridad, extraerJSON, normalizarRespuestaIA, sugerirPorPalabras, type RespuestaAsistente } from '@/lib/asistente'
import { getTarifario } from '@/lib/data/servicios'
import { clientIp, rateLimit, registrarEvento } from '@/lib/eventos'

// Asistente de AyudaYa: sugiere un servicio del tarifario.
// Usa la API de Claude (ANTHROPIC_API_KEY, solo en el servidor). Si no hay clave, se pasó el límite
// o la API falla, responde con la alternativa por palabras clave (sección 10.3).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
const TIMEOUT_MS = 15000

type Body = { descripcion?: unknown; respuestas?: unknown }

function porPalabras(descripcion: string): RespuestaAsistente {
  return {
    fuente: 'reglas',
    preguntas: [],
    servicio: sugerirPorPalabras(descripcion),
    resumen: '',
    por_que: '',
    urgente: !!avisoSeguridad(descripcion),
    seguridad: avisoSeguridad(descripcion),
  }
}

async function preguntarAClaude(prompt: string, signal: AbortSignal) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
  return (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('')
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return Response.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  const descripcion = String(body.descripcion ?? '').trim().slice(0, 1000)
  if (descripcion.length < 6) return Response.json({ error: 'Contanos el problema en una o dos frases.' }, { status: 400 })
  const respuestas = Array.isArray(body.respuestas)
    ? body.respuestas.slice(0, 3).map((r) => ({
        pregunta: String((r as { pregunta?: unknown })?.pregunta ?? '').slice(0, 200),
        respuesta: String((r as { respuesta?: unknown })?.respuesta ?? '').slice(0, 200),
      }))
    : undefined

  const ip = clientIp(request.headers)
  let resultado: RespuestaAsistente = porPalabras(descripcion)

  // 12 consultas a la IA por IP cada 10 minutos (por instancia). Pasado el límite, se usa la alternativa por palabras.
  if (process.env.ANTHROPIC_API_KEY && rateLimit(`asistente:${ip}`, 12, 10 * 60 * 1000)) {
    const servicios = await getTarifario()
    const codigos = new Set(servicios.map((s) => s.codigo))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const text = await preguntarAClaude(armarPrompt(servicios, descripcion, respuestas), controller.signal)
      const ia = normalizarRespuestaIA(extraerJSON(text), codigos, !!respuestas)
      if (ia && (ia.servicio || ia.preguntas.length || ia.resumen)) {
        const seguridad = ia.seguridad || avisoSeguridad(descripcion)
        resultado = { fuente: 'ia', ...ia, seguridad, urgente: ia.urgente || !!seguridad }
      }
    } catch (error) {
      console.error('[asistente] Falló la IA, uso palabras clave.', error instanceof Error ? error.message : error)
    } finally {
      clearTimeout(timer)
    }
  }

  if (resultado.servicio || !resultado.preguntas.length) {
    await registrarEvento('sugerencia', { datos: { servicio: resultado.servicio, fuente: resultado.fuente } })
  }
  return Response.json(resultado)
}
