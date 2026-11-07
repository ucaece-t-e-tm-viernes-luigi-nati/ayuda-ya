'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { BARRIOS, FRANJAS, RUBROS, franjaRango, rubroNombre, type Servicio } from '@/lib/catalogo'
import { whatsappLink } from '@/lib/site'
import { crearPedido } from '../actions'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

type Inicial = { servicio: string; origen: string; problema: string; barrio: string; direccion: string; nombre: string; celular: string }

export function NuevoPedidoForm({ servicios, inicial, minDia, maxDia }: { servicios: Servicio[]; inicial: Inicial; minDia: string; maxDia: string }) {
  const [state, action] = useActionState(crearPedido, null)
  const [codigo, setCodigo] = useState(inicial.servicio)
  const [franja, setFranja] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const sel = servicios.find((s) => s.codigo === codigo)

  function enviarPorWhatsapp() {
    const f = formRef.current
    if (!f) return
    const v = (k: string) => String(new FormData(f).get(k) ?? '').trim()
    const msg =
      'Hola AyudaYa, quiero pedir un servicio.\n\n' +
      `Servicio: ${sel ? `${sel.nombre} (${rubroNombre(sel.rubro)})` : '—'}\n` +
      `Precio cerrado: ${sel ? fmt(sel.precio) : '—'}\n` +
      `Problema: ${v('problema')}\n` +
      `Barrio: ${v('barrio')}\n` +
      `Dirección: ${v('direccion')}\n` +
      `Cuándo: ${v('dia') || 'lo antes posible'}, ${franja ? franjaRango(franja) : 'cualquier horario'}\n` +
      `Nombre: ${inicial.nombre}\n` +
      `Celular: ${inicial.celular}`
    window.open(whatsappLink(msg), '_blank', 'noopener')
  }

  return (
    <form ref={formRef} action={action} className="ui-form">
      <input type="hidden" name="origen" value={inicial.origen} />
      {inicial.origen !== 'tarifario' && inicial.servicio && (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Servicio sugerido por el asistente · revisalo antes de pedir</p>
      )}
      <div className="field">
        <label htmlFor="servicio">Servicio</label>
        <select id="servicio" name="servicio" required value={codigo} onChange={(e) => setCodigo(e.target.value)} className="ui-input">
          <option value="" disabled>
            Elegí un servicio
          </option>
          {RUBROS.map((r) => (
            <optgroup key={r.id} label={r.nombre}>
              {servicios
                .filter((s) => s.rubro === r.id)
                .map((s) => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.codigo} · {s.nombre} · {fmt(s.precio)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="precio-sel">
        <span>Precio cerrado (sin comisión para vos)</span>
        <b>{sel ? fmt(sel.precio) : '—'}</b>
      </div>
      <div className="field">
        <label htmlFor="problema">¿Qué está pasando?</label>
        <textarea
          id="problema"
          name="problema"
          required
          minLength={10}
          maxLength={1500}
          defaultValue={inicial.problema}
          placeholder="Ej.: pierde agua debajo de la bacha de la cocina desde ayer"
          className="ui-input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="barrio">Barrio</label>
          <select id="barrio" name="barrio" required defaultValue={inicial.barrio} className="ui-input">
            {BARRIOS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <input id="direccion" name="direccion" required maxLength={160} defaultValue={inicial.direccion} className="ui-input" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="dia">Día de la visita</label>
        <input id="dia" name="dia" type="date" required min={minDia} max={maxDia} defaultValue={minDia} className="ui-input" />
      </div>
      <fieldset className="field">
        <legend className="label mb-1.5">Franja horaria</legend>
        <input type="hidden" name="franja" value={franja} />
        <div className="grid grid-cols-3 gap-2">
          {FRANJAS.map((f) => (
            <button key={f.id} type="button" className="opt grid gap-0.5 text-center" aria-pressed={franja === f.id} onClick={() => setFranja(f.id)}>
              <b className="text-sm">{f.rango}</b>
              <span className="text-xs text-muted-foreground">{f.nombre}</span>
            </button>
          ))}
        </div>
        <span className="hint">El profesional llega dentro de la franja que elijas.</span>
      </fieldset>
      <p className="hint">
        Te contactamos al {inicial.celular} a nombre de {inicial.nombre}.{' '}
        <a href="/completar-datos?next=/pedido/nuevo" className="underline">
          Cambiar mis datos
        </a>
      </p>
      {state?.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
      <Enviar disabled={!franja || !codigo} />
      <button type="button" className="btn btn-wa" onClick={enviarPorWhatsapp}>
        Prefiero pedirlo por WhatsApp
      </button>
    </form>
  )
}

function Enviar({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? 'Enviando…' : disabled ? 'Elegí servicio y franja' : 'Confirmar pedido'}
    </button>
  )
}
