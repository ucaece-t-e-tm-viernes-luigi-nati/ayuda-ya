// Lógica del asistente de AyudaYa (sección 10 del CLAUDE.md del equipo). Funciones puras.
import { rubroNombre, type Servicio } from './catalogo'

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

// 10.3 Alternativa sin IA: primera regla que coincide.
const REGLAS: Array<[RegExp, string]> = [
  [/olor a gas|huele a gas|perdida de gas|fuga de gas|escape de gas/, 'GA-03'],
  [/(cambi|instal|nuevo|coloc)[a-z]* .*(calefon|termotanque)|(calefon|termotanque).*(cambi|instal|nuevo)/, 'GA-04'],
  [/calefactor|estufa|tiro balanceado/, 'GA-02'],
  [/calefon|termotanque|hornalla|horno a gas|\bgas\b|piloto/, 'GA-01'],
  [/disyuntor|termica|salta|corte de luz|sin luz|se corta la luz|se fue la luz/, 'EL-03'],
  [/enchufe|tomacorriente|toma corriente|llave de luz|interruptor|tecla de luz/, 'EL-02'],
  [/ventilador/, 'EL-04'],
  [/\bluz\b|cable|electric|chispa|lampara|foco/, 'EL-01'],
  [/tapad|destap|no traga|no desagota|desagote|desague|cloaca/, 'PL-04'],
  [/canilla|griferia|gotea|monocomando/, 'PL-02'],
  [/inodoro|mochila|deposito|cadena/, 'PL-03'],
  [/agua|perdida|cano|humedad|filtra|gotera|bacha|pileta/, 'PL-01'],
]

export function sugerirPorPalabras(texto: string): string | null {
  const t = norm(texto)
  for (const [re, code] of REGLAS) if (re.test(t)) return code
  return null
}

// 10.4 Avisos de seguridad (no dependen de la IA).
export function avisoSeguridad(texto: string): string {
  const t = norm(texto)
  if (/olor a gas|huele a gas|fuga|escape de gas|perdida de gas/.test(t))
    return 'Cerrá la llave general de gas, abrí puertas y ventanas, no prendas ni apagues luces ni uses fuego, y llamá a la guardia de emergencias de Camuzzi.'
  if (/chispa|humo|quemad|olor a quemado|se quemo/.test(t))
    return 'Bajá la térmica general y no toques cables ni artefactos hasta que llegue el electricista.'
  return ''
}

export type Pregunta = { pregunta: string; opciones: string[] }

export type RespuestaAsistente = {
  fuente: 'ia' | 'reglas'
  preguntas: Pregunta[]
  servicio: string | null
  resumen: string
  por_que: string
  urgente: boolean
  seguridad: string
}

// 10.2 Prompt (se arma con el tarifario actual).
export function armarPrompt(servicios: Servicio[], descripcion: string, respuestas?: Array<{ pregunta: string; respuesta: string }>) {
  const conRespuestas = !!respuestas
  const tarifario = servicios
    .map((s) => `${s.codigo} | ${rubroNombre(s.rubro)} | ${s.nombre} | ${s.descripcion} | $${s.precio.toLocaleString('es-AR')}`)
    .join('\n')
  let p =
    'Sos el asistente de AyudaYa, una plataforma de Mar del Plata que conecta hogares con plomeros, gasistas y electricistas verificados. ' +
    'Tu tarea es ayudar a la persona a elegir el servicio correcto del tarifario. No sos el profesional: no des instrucciones para que la persona repare algo, solo orientación y consejos básicos de seguridad.\n\n' +
    'Tarifario (código | rubro | servicio | descripción | precio cerrado):\n' +
    tarifario +
    '\n\nReglas:\n' +
    '- Respondé en español rioplatense, breve y claro, tratando de vos.\n' +
    (conRespuestas
      ? '- La persona ya respondió tus preguntas: elegí un servicio sí o sí y devolvé preguntas vacío.\n'
      : '- Si la descripción alcanza para elegir con confianza, elegí el servicio y devolvé preguntas vacío. Si falta algo importante para elegir, devolvé de 1 a 3 preguntas cortas, cada una con 2 a 4 opciones de respuesta, y servicio null.\n') +
    '- Si el problema es de un rubro pero no encaja en un servicio específico, elegí la visita de diagnóstico de ese rubro.\n' +
    '- Si no es de plomería, gas ni electricidad, devolvé servicio null y explicá en resumen que por ahora no cubrimos ese rubro.\n' +
    '- Si hay riesgo (olor a gas, chispas, humo, cables quemados, agua cerca de la electricidad), urgente true y un consejo de seguridad de una o dos frases.\n\n' +
    'Respondé solo con este JSON: {"preguntas":[{"pregunta":"...","opciones":["...","..."]}],"servicio":"PL-04","resumen":"una oración, en segunda persona, de lo que entendiste","por_que":"una oración de por qué ese servicio","urgente":false,"seguridad":""}\n\n' +
    'Descripción de la persona: ' +
    descripcion
  if (respuestas?.length) {
    p += '\n\nPreguntas y respuestas:\n' + respuestas.map((r) => `- ${r.pregunta} → ${r.respuesta || 'No sabe'}`).join('\n')
  }
  return p
}

/** Valida y normaliza el JSON que devuelve el modelo. Devuelve null si no sirve. */
export function normalizarRespuestaIA(raw: unknown, codigos: Set<string>, conRespuestas: boolean): Omit<RespuestaAsistente, 'fuente'> | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const preguntas: Pregunta[] = Array.isArray(r.preguntas)
    ? r.preguntas
        .filter((q): q is { pregunta: unknown; opciones: unknown } => !!q && typeof q === 'object' && 'pregunta' in q)
        .map((q) => ({
          pregunta: String(q.pregunta).slice(0, 200),
          opciones: Array.isArray(q.opciones) ? q.opciones.slice(0, 4).map((o) => String(o).slice(0, 80)) : [],
        }))
        .filter((q) => q.pregunta.trim())
        .slice(0, 3)
    : []
  const servicio = typeof r.servicio === 'string' && codigos.has(r.servicio) ? r.servicio : null
  return {
    preguntas: conRespuestas || servicio ? [] : preguntas,
    servicio,
    resumen: String(r.resumen ?? '').slice(0, 400),
    por_que: String(r.por_que ?? '').slice(0, 400),
    urgente: r.urgente === true,
    seguridad: String(r.seguridad ?? '').slice(0, 400),
  }
}

/** Saca el primer objeto JSON de un texto (por si el modelo agrega algo alrededor). */
export function extraerJSON(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}
