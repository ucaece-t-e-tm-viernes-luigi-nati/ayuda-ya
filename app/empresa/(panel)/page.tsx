import Link from 'next/link'
import { Card, Empty, Metric, PageTitle } from '@/components/panel/ui'
import { EstadoPedido } from '@/components/site/timeline'
import { franjaRango, numeroPedido } from '@/lib/catalogo'
import { listPedidosDePrestador } from '@/lib/data/pedidos'
import { q1 } from '@/lib/db'
import { dayKeyAR, formatDate, pesos } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'

export default async function PrestadorDashboard() {
  const ctx = await requirePrestador('dashboard.view')
  const mes = dayKeyAR().slice(0, 7)
  const [pedidos, stats] = await Promise.all([
    listPedidosDePrestador(ctx.clientId),
    q1<{ terminados_mes: number; facturado_mes: number; comision_mes: number; promedio: string | null; calificaciones: number }>(
      `SELECT
         (SELECT count(*)::int FROM pedido WHERE prestador_id = $1 AND estado = 'terminado' AND to_char(terminado_at AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM') = $2) AS terminados_mes,
         (SELECT coalesce(sum(p.precio_cerrado + coalesce((SELECT sum(monto) FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0)), 0)::int
            FROM pedido p WHERE p.prestador_id = $1 AND p.estado = 'terminado' AND to_char(p.terminado_at AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM') = $2) AS facturado_mes,
         (SELECT coalesce(sum(comision_monto), 0)::int FROM pedido WHERE prestador_id = $1 AND estado = 'terminado' AND to_char(terminado_at AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM') = $2) AS comision_mes,
         (SELECT round(avg(puntaje), 1)::text FROM calificacion WHERE prestador_id = $1) AS promedio,
         (SELECT count(*)::int FROM calificacion WHERE prestador_id = $1) AS calificaciones`,
      [ctx.clientId, mes],
    ),
  ])
  const porAceptar = pedidos.filter((p) => p.estado === 'asignado')
  const activos = pedidos.filter((p) => ['asignado', 'en_curso'].includes(p.estado))

  return (
    <>
      <PageTitle eyebrow="Panel de prestadores" title={`Hola, ${ctx.user.name.split(' ')[0]}`} description={`Así viene ${ctx.clientName} en AyudaYa.`} />
      <section aria-label="Métricas" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Pedidos activos" value={activos.length} hint="Asignados o en curso" />
        <Metric label="Terminados este mes" value={stats?.terminados_mes ?? 0} hint={`Cobrado a clientes: ${pesos(stats?.facturado_mes ?? 0)}`} />
        <Metric label="Comisión del mes" value={pesos(stats?.comision_mes ?? 0)} hint="Se liquida a principio del mes que viene" />
        <Metric label="Calificación promedio" value={stats?.promedio ? `★ ${stats.promedio}` : '—'} hint={`${stats?.calificaciones ?? 0} calificaciones`} />
      </section>
      <Card title="Pedidos activos" description="Aceptá los nuevos lo antes posible: el cliente espera la confirmación.">
        {activos.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {activos.map((p) => (
              <li key={p.id}>
                <Link href={`/empresa/pedidos/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-primary">
                  <div>
                    <p className="font-semibold">
                      {numeroPedido(p.numero)} · {p.servicio_nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.dia)}, {franjaRango(p.franja)} · {p.barrio}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num">{pesos(p.precio_cerrado)}</span>
                    <EstadoPedido estado={p.estado} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No tenés pedidos activos. Te avisamos por mail cuando te asignemos uno.</Empty>
        )}
        {porAceptar.length > 0 && <p className="mt-3 text-xs font-semibold text-primary-ink">Tenés {porAceptar.length} pedido(s) asignado(s) para revisar.</p>}
      </Card>
    </>
  )
}
