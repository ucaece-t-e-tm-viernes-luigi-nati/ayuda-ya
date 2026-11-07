'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Pregunta, RespuestaAsistente } from '@/lib/asistente'
import { rubroNombre, type Servicio } from '@/lib/catalogo'

const EJEMPLOS = ['Gotea la canilla del baño', 'Salta la térmica cuando prendo el horno', 'El calefón no prende', 'Siento olor a gas en la cocina']
const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

type Vista = 'inicio' | 'status' | 'preguntas' | 'resultado'

/** Asistente: herramienta que sugiere un servicio del tarifario. No decide: la persona confirma. */
export function Asistente({ servicios }: { servicios: Servicio[] }) {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('inicio')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState('')
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [respuestas, setRespuestas] = useState<string[]>([])
  const [resultado, setResultado] = useState<RespuestaAsistente | null>(null)
  const run = useRef(0)
  const ctl = useRef<AbortController | null>(null)
  const inicioRegistrado = useRef(false)

  async function analizar(conRespuestas: boolean, resp: string[]) {
    const id = ++run.current
    setVista('status')
    if (!inicioRegistrado.current) {
      inicioRegistrado.current = true
      fetch('/api/evento', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tipo: 'inicio_asistente' }) }).catch(() => null)
    }
    ctl.current = new AbortController()
    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctl.current.signal,
        body: JSON.stringify({
          descripcion: desc,
          respuestas: conRespuestas ? preguntas.map((q, i) => ({ pregunta: q.pregunta, respuesta: resp[i] ?? '' })) : undefined,
        }),
      })
      if (id !== run.current) return
      const data = (await res.json()) as RespuestaAsistente & { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'No pudimos analizar el problema.')
        setVista('inicio')
        return
      }
      if (!conRespuestas && data.preguntas?.length && !data.servicio) {
        setPreguntas(data.preguntas)
        setRespuestas(data.preguntas.map(() => ''))
        setVista('preguntas')
        return
      }
      setResultado(data)
      setVista('resultado')
    } catch {
      if (id !== run.current) return
      setVista('inicio')
    }
  }

  function cancelar() {
    run.current++
    ctl.current?.abort()
    setVista('inicio')
  }

  function pedir(code: string) {
    if (!resultado) return
    let detalle = desc
    preguntas.forEach((q, i) => {
      if (respuestas[i]) detalle += `\n${q.pregunta} ${respuestas[i]}`
    })
    const origen = resultado.fuente === 'ia' ? 'asistente_ia' : 'palabras_clave'
    router.push(`/pedido/nuevo?servicio=${code}&origen=${origen}&detalle=${encodeURIComponent(detalle.slice(0, 900))}`)
  }

  function reiniciar() {
    setDesc('')
    setResultado(null)
    setPreguntas([])
    setRespuestas([])
    setVista('inicio')
  }

  const sugerido = resultado?.servicio ? servicios.find((s) => s.codigo === resultado.servicio) : null

  return (
    <div className="grid min-w-0 gap-3.5 rounded-[14px] border border-border bg-card p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border-[1.5px] border-current px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-primary-ink">
          Asistente con IA
        </span>
        <span className="hint">Te sugiere, no decide</span>
      </div>

      {vista === 'inicio' && (
        <div className="grid gap-3.5">
          <div className="field">
            <label htmlFor="as-input">¿Qué está pasando en tu casa?</label>
            <textarea
              id="as-input"
              className="ui-input"
              value={desc}
              maxLength={1000}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej.: la pileta de la cocina no traga y el agua sube cuando uso el lavarropas"
            />
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Ejemplos">
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setDesc(e)}
                className="rounded-full border border-border bg-background px-3 py-2 text-[13px] font-medium hover:border-foreground"
              >
                {e}
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (desc.trim().length < 6) {
                setError('Contanos el problema en una o dos frases.')
                return
              }
              setError('')
              setPreguntas([])
              setRespuestas([])
              analizar(false, [])
            }}
          >
            Analizar mi problema
          </button>
        </div>
      )}

      {vista === 'status' && (
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span>{preguntas.length ? 'Buscando el servicio indicado…' : 'Analizando tu problema…'}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cancelar}>
            Cancelar
          </button>
        </div>
      )}

      {vista === 'preguntas' && (
        <div className="grid gap-3.5">
          <p className="hint">Para elegir bien el servicio, respondé estas preguntas.</p>
          {preguntas.map((q, i) => (
            <div key={q.pregunta} className="grid gap-2 border-t border-border pt-3">
              <p className="text-[15px] font-semibold">{q.pregunta}</p>
              <div className="flex flex-wrap gap-2">
                {q.opciones.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className="opt"
                    aria-pressed={respuestas[i] === o}
                    onClick={() => setRespuestas((r) => r.map((x, j) => (j === i ? o : x)))}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <input
                className="ui-input"
                placeholder="Otra respuesta"
                aria-label={`Otra respuesta: ${q.pregunta}`}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  if (v) setRespuestas((r) => r.map((x, j) => (j === i ? v : x)))
                }}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn btn-primary" onClick={() => analizar(true, respuestas)}>
              Ver sugerencia
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const vacias = preguntas.map(() => '')
                setRespuestas(vacias)
                analizar(true, vacias)
              }}
            >
              Saltear preguntas
            </button>
          </div>
        </div>
      )}

      {vista === 'resultado' && resultado && (
        <div className="grid gap-3.5">
          {resultado.seguridad && (
            <div className="alerta" role="alert">
              <b>Antes que nada</b>
              {resultado.seguridad}
            </div>
          )}
          {sugerido ? (
            <div className="grid gap-2.5 rounded-xl border-[1.5px] border-foreground p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="eyebrow">Te sugerimos · {sugerido.codigo}</span>
                <span className="num text-[22px]">{fmt(sugerido.precio)}</span>
              </div>
              <h3 className="text-lg font-semibold">
                {sugerido.nombre} ({rubroNombre(sugerido.rubro)})
              </h3>
              {resultado.resumen && <p className="text-[15px] text-muted-foreground">{resultado.resumen}</p>}
              {resultado.por_que && <p className="text-[15px] text-muted-foreground">{resultado.por_que}</p>}
              {resultado.fuente === 'reglas' && (
                <p className="text-[15px] text-muted-foreground">Lo elegimos por las palabras de tu descripción. Revisá que sea lo que necesitás antes de pedirlo.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-2.5 rounded-xl border-[1.5px] border-foreground p-4">
              <h3 className="text-lg font-semibold">{resultado.resumen ? 'No encontramos un servicio exacto' : 'No pudimos identificar el servicio'}</h3>
              <p className="text-[15px] text-muted-foreground">
                {resultado.resumen || 'Elegí el servicio en el tarifario o pedí una visita de diagnóstico del rubro que corresponda.'}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2.5">
            {sugerido && (
              <button type="button" className="btn btn-primary" onClick={() => pedir(sugerido.codigo)}>
                Pedir este servicio
              </button>
            )}
            <a className="btn btn-ghost" href="#servicios">
              Elegir otro servicio
            </a>
            <button type="button" className="btn btn-ghost" onClick={reiniciar}>
              Empezar de nuevo
            </button>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {resultado.fuente === 'ia' ? 'Sugerencia del asistente con IA · revisala antes de pedir' : 'Sugerencia automática por palabras clave · revisala antes de pedir'}
          </p>
        </div>
      )}
    </div>
  )
}
