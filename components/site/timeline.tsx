import { formatDateTime } from '@/lib/dates'

type P = {
  estado: string
  created_at: Date
  asignado_at: Date | null
  aceptado_at: Date | null
  en_curso_at: Date | null
  terminado_at: Date | null
  cancelado_at: Date | null
}

/** Línea de tiempo del pedido: nuevo → asignado → en curso → terminado (o cancelado). */
export function Timeline({ p }: { p: P }) {
  const pasos = [
    { id: 'nuevo', label: 'Pedido recibido', at: p.created_at },
    { id: 'asignado', label: p.aceptado_at ? 'Profesional asignado y confirmado' : 'Profesional asignado', at: p.asignado_at },
    { id: 'en_curso', label: 'Trabajo en curso', at: p.en_curso_at },
    { id: 'terminado', label: 'Terminado', at: p.terminado_at },
  ]
  if (p.estado === 'cancelado') {
    const hechos = pasos.filter((s) => s.at)
    hechos.push({ id: 'cancelado', label: 'Cancelado', at: p.cancelado_at })
    return <Lista pasos={hechos.map((s) => ({ ...s, hecho: true, actual: s.id === 'cancelado' }))} />
  }
  const orden = ['nuevo', 'asignado', 'en_curso', 'terminado']
  const idx = orden.indexOf(p.estado)
  return <Lista pasos={pasos.map((s, i) => ({ ...s, hecho: i <= idx, actual: i === idx }))} />
}

function Lista({ pasos }: { pasos: Array<{ id: string; label: string; at: Date | null; hecho: boolean; actual: boolean }> }) {
  return (
    <ol className="grid gap-0" aria-label="Estado del pedido">
      {pasos.map((s, i) => (
        <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0" aria-current={s.actual ? 'step' : undefined}>
          {i < pasos.length - 1 && <span className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5 ${s.hecho ? 'bg-primary' : 'bg-border'}`} aria-hidden="true" />}
          <span
            className={`mt-0.5 size-5 shrink-0 rounded-full border-2 ${s.id === 'cancelado' ? 'border-destructive bg-destructive' : s.hecho ? 'border-primary bg-primary' : 'border-border bg-card'}`}
            aria-hidden="true"
          />
          <div>
            <p className={`text-[15px] ${s.actual ? 'font-bold' : s.hecho ? 'font-semibold' : 'text-muted-foreground'}`}>{s.label}</p>
            {s.at && <p className="text-xs text-muted-foreground">{formatDateTime(s.at)}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

const ESTILOS: Record<string, string> = {
  nuevo: 'bg-[#e9f1ff] text-[#2d5aa8]',
  asignado: 'bg-[#fff1e0] text-[#9a4a0a]',
  en_curso: 'bg-[#fff4d9] text-[#8a6212]',
  terminado: 'bg-ok-soft text-ok',
  cancelado: 'bg-muted text-muted-foreground',
}
const LABEL: Record<string, string> = { nuevo: 'Nuevo', asignado: 'Asignado', en_curso: 'En curso', terminado: 'Terminado', cancelado: 'Cancelado' }

export function EstadoPedido({ estado }: { estado: string }) {
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${ESTILOS[estado] ?? 'bg-muted'}`}>{LABEL[estado] ?? estado}</span>
}
