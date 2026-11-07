import type { Metadata } from 'next'
import { Card, Empty, Metric, PageTitle, StatusBadge, Table, Td } from '@/components/panel/ui'
import { q, q1 } from '@/lib/db'
import { formatDate, formatDateTime, formatMoney, periodLabel, pesos } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'

export const metadata: Metadata = { title: 'Comisiones' }

const TZ = 'America/Argentina/Buenos_Aires'

export default async function ComisionesPage() {
  const ctx = await requirePrestador('comisiones.view')
  const [meses, pagos, cond] = await Promise.all([
    q<{ periodo: string; trabajos: number; facturado: number; comision: number }>(
      `SELECT to_char(p.terminado_at AT TIME ZONE '${TZ}', 'YYYY-MM') AS periodo, count(*)::int AS trabajos,
              sum(p.precio_cerrado + coalesce((SELECT sum(monto) FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0))::int AS facturado,
              coalesce(sum(p.comision_monto), 0)::int AS comision
         FROM pedido p WHERE p.prestador_id = $1 AND p.estado = 'terminado'
        GROUP BY 1 ORDER BY 1 DESC LIMIT 12`,
      [ctx.clientId],
    ),
    q<{ id: string; period: string; amount_cents: string; currency: string; status: string; due_date: string; paid_at: Date | null; method: string | null }>(
      `SELECT id, period, amount_cents::text, currency, status, to_char(due_date, 'YYYY-MM-DD') AS due_date, paid_at, method
         FROM payment WHERE client_id = $1 ORDER BY period DESC LIMIT 24`,
      [ctx.clientId],
    ),
    q1<{ commission_pct: string; billing_day: number | null; trial_ends_at: string | null; plan: string | null }>(
      `SELECT c.commission_pct::text, c.billing_day, to_char(c.trial_ends_at, 'YYYY-MM-DD') AS trial_ends_at, p.name AS plan
         FROM client c LEFT JOIN plan p ON p.id = c.plan_id WHERE c.id = $1`,
      [ctx.clientId],
    ),
  ])
  const deuda = pagos.filter((p) => ['pending', 'overdue'].includes(p.status)).reduce((a, p) => a + Number(p.amount_cents), 0)

  return (
    <>
      <PageTitle
        eyebrow="Panel de prestadores"
        title="Comisiones"
        description={`${cond?.plan ?? 'Piloto'}: sin abono mensual, ${Number(cond?.commission_pct ?? 15)}% de comisión sobre cada trabajo terminado. Liquidación mensual, vence el día ${cond?.billing_day ?? 10} de cada mes.`}
      />
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric label="Comisión del mes en curso" value={pesos(meses[0]?.comision ?? 0)} hint="Se liquida a principio del mes que viene" />
        <Metric label="Saldo pendiente de pago" value={formatMoney(deuda)} />
        {cond?.trial_ends_at && <Metric label="Prueba sin comisión hasta" value={formatDate(cond.trial_ends_at)} />}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Resumen por mes" description="Trabajos terminados, lo que cobraste a clientes y la comisión de AyudaYa.">
          {meses.length ? (
            <Table head={['Mes', 'Trabajos', 'Cobrado', 'Comisión']}>
              {meses.map((m) => (
                <tr key={m.periodo}>
                  <Td className="capitalize">{periodLabel(m.periodo)}</Td>
                  <Td>{m.trabajos}</Td>
                  <Td className="num">{pesos(m.facturado)}</Td>
                  <Td className="num">{pesos(m.comision)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Todavía no terminaste trabajos.</Empty>
          )}
        </Card>
        <Card title="Liquidaciones" description="Los pagos los registra el equipo de AyudaYa cuando recibe la transferencia.">
          {pagos.length ? (
            <Table head={['Período', 'Monto', 'Vence', 'Estado']}>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <Td className="capitalize">{periodLabel(p.period)}</Td>
                  <Td>{formatMoney(p.amount_cents, p.currency)}</Td>
                  <Td className="text-xs">{formatDate(p.due_date)}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                    {p.paid_at && <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(p.paid_at)}</p>}
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Sin liquidaciones todavía.</Empty>
          )}
        </Card>
      </div>
    </>
  )
}
