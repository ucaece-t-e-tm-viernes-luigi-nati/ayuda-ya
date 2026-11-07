import type { Metadata } from 'next'
import { Card, Empty, Metric, PageTitle } from '@/components/panel/ui'
import { numeroPedido } from '@/lib/catalogo'
import { q } from '@/lib/db'
import { formatDate } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'

export const metadata: Metadata = { title: 'Calificaciones' }

export default async function CalificacionesPage() {
  const ctx = await requirePrestador('dashboard.view')
  const rows = await q<{ pedido_id: string; numero: number; servicio_nombre: string; puntaje: number; comentario: string | null; created_at: Date }>(
    `SELECT k.pedido_id, p.numero, p.servicio_nombre, k.puntaje, k.comentario, k.created_at
       FROM calificacion k JOIN pedido p ON p.id = k.pedido_id WHERE k.prestador_id = $1 ORDER BY k.created_at DESC LIMIT 200`,
    [ctx.clientId],
  )
  const promedio = rows.length ? (rows.reduce((a, r) => a + r.puntaje, 0) / rows.length).toFixed(1) : null
  return (
    <>
      <PageTitle eyebrow="Panel de prestadores" title="Tus calificaciones" description="Las ven los clientes cuando te asignamos un pedido." />
      <section className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <Metric label="Promedio" value={promedio ? `★ ${promedio}` : '—'} />
        <Metric label="Calificaciones" value={rows.length} />
      </section>
      <Card>
        {rows.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <li key={r.pedido_id} className="py-3">
                <p className="text-sm font-semibold">
                  <span className="text-primary">{'★'.repeat(r.puntaje)}</span>
                  <span className="text-border">{'★'.repeat(5 - r.puntaje)}</span> · {numeroPedido(r.numero)} · {r.servicio_nombre}
                </p>
                {r.comentario && <p className="mt-1 text-sm text-muted-foreground">“{r.comentario}”</p>}
                <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Todavía no tenés calificaciones.</Empty>
        )}
      </Card>
    </>
  )
}
