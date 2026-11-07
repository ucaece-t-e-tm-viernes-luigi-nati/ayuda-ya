import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, Empty, Metric, PageTitle, StatusBadge, Table, Td } from '@/components/panel/ui'
import { EstadoPedido } from '@/components/site/timeline'
import { MATRICULAS, RUBROS, franjaRango, matriculaNombre, numeroPedido, rubroNombre } from '@/lib/catalogo'
import { q, q1 } from '@/lib/db'
import { formatDate, formatDateTime, formatMoney, periodLabel, pesos } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'
import { registerPayment, resendAccess, setClientStatus, setVerificacion, updateCondiciones } from '../../actions'

export const metadata: Metadata = { title: 'Prestador' }

type Datos = { dni?: string; monotributo?: string; experiencia?: number; dias?: string[]; franjas?: string[]; urgencias?: boolean; vehiculo?: boolean; herramientas?: string; seguro?: string }

export default async function PrestadorDetailPage({ params }: PageProps<'/plataforma/prestadores/[id]'>) {
  await requireSuperadmin()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const c = await q1<{
    id: string
    name: string
    legal_name: string | null
    tax_id: string | null
    phone: string | null
    contact_email: string | null
    rubros: string[]
    zonas: string[]
    matricula_tipo: string | null
    matricula_numero: string | null
    verificacion: string
    verificado_at: Date | null
    status: string
    commission_pct: string
    billing_day: number | null
    trial_ends_at: string | null
    is_demo: boolean
    data: Datos
    plan: string | null
  }>(
    `SELECT c.id, c.name, c.legal_name, c.tax_id, c.phone, c.contact_email, c.rubros, c.zonas, c.matricula_tipo, c.matricula_numero, c.verificacion,
            c.verificado_at, c.status, c.commission_pct::text, c.billing_day, to_char(c.trial_ends_at, 'YYYY-MM-DD') AS trial_ends_at, c.is_demo, c.data, p.name AS plan
       FROM client c LEFT JOIN plan p ON p.id = c.plan_id WHERE c.id = $1`,
    [id],
  )
  if (!c) notFound()
  const [members, payments, pedidos, stats] = await Promise.all([
    q<{ userId: string; name: string; email: string; mustChangePassword: boolean }>(
      `SELECT u.id AS "userId", u.name, u.email, u."mustChangePassword" FROM client_member m JOIN "user" u ON u.id = m.user_id WHERE m.client_id = $1`,
      [id],
    ),
    q<{ id: string; period: string; amount_cents: string; currency: string; status: string; due_date: string; paid_at: Date | null; method: string | null }>(
      `SELECT id, period, amount_cents::text, currency, status, to_char(due_date, 'YYYY-MM-DD') AS due_date, paid_at, method FROM payment WHERE client_id = $1 ORDER BY period DESC`,
      [id],
    ),
    q<{ id: string; numero: number; servicio_nombre: string; estado: string; dia: string; comision_monto: number | null }>(
      `SELECT id, numero, servicio_nombre, estado, to_char(dia, 'YYYY-MM-DD') AS dia, comision_monto FROM pedido WHERE prestador_id = $1 ORDER BY created_at DESC LIMIT 15`,
      [id],
    ),
    q1<{ terminados: number; comisiones: number; promedio: string | null }>(
      `SELECT count(*) FILTER (WHERE estado = 'terminado')::int AS terminados, coalesce(sum(comision_monto), 0)::int AS comisiones,
              (SELECT round(avg(puntaje), 1)::text FROM calificacion WHERE prestador_id = $1) AS promedio
         FROM pedido WHERE prestador_id = $1`,
      [id],
    ),
  ])
  const d = c.data ?? {}
  const impagas = payments.filter((p) => ['pending', 'overdue'].includes(p.status))
  const statusActions = ['active', 'paused', 'cancelled'].filter((s) => s !== c.status)
  const verifActions = ['verificado', 'observado', 'pendiente'].filter((v) => v !== c.verificacion)

  return (
    <>
      <Link href="/plataforma/prestadores" className="text-xs font-semibold text-muted-foreground hover:text-primary">
        ← Prestadores
      </Link>
      <PageTitle
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} /> <StatusBadge status={c.verificacion} /> {c.rubros.map(rubroNombre).join(', ')}
            {c.is_demo && ' · demo'}
          </span>
        }
        actions={statusActions.map((s) => (
          <form key={s} action={setClientStatus.bind(null, c.id, s)}>
            <button className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s === 'active' ? 'border-primary text-primary' : 'border-border'} hover:bg-muted`}>
              {s === 'active' ? 'Activar' : s === 'paused' ? 'Pausar' : 'Dar de baja'}
            </button>
          </form>
        ))}
      />
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Comisión" value={`${Number(c.commission_pct)}%`} hint={c.plan ?? undefined} />
        <Metric label="Trabajos terminados" value={stats?.terminados ?? 0} hint={`Comisiones generadas: ${pesos(stats?.comisiones ?? 0)}`} />
        <Metric label="Calificación" value={stats?.promedio ? `★ ${stats.promedio}` : '—'} />
        <Metric label="Liquidaciones impagas" value={formatMoney(impagas.reduce((a, p) => a + Number(p.amount_cents), 0))} hint={c.billing_day ? `Día de pago: ${c.billing_day}` : undefined} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Datos y verificación">
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
            {(
              [
                ['Responsable', `${c.legal_name ?? '—'} · ${c.contact_email ?? '—'} · ${c.phone ?? '—'}`],
                ['DNI / CUIT', `${d.dni ?? '—'} / ${c.tax_id ?? '—'}`],
                ['Condición fiscal', d.monotributo || '—'],
                ['Matrícula', `${matriculaNombre(c.matricula_tipo)}${c.matricula_numero ? ` · N.º ${c.matricula_numero}` : ''}`],
                ['Zonas', c.zonas.join(', ') || '—'],
                ['Experiencia', d.experiencia != null ? `${d.experiencia} años` : '—'],
                ['Disponibilidad', `${d.dias?.join(', ') ?? '—'} · ${d.franjas?.map(franjaRango).join(', ') ?? '—'}${d.urgencias ? ' · urgencias' : ''}`],
                ['Vehículo / herramientas', `${d.vehiculo ? 'Sí' : 'No'} / ${d.herramientas || '—'}`],
                ['Seguro', d.seguro || '—'],
                ['Verificado', c.verificado_at ? formatDateTime(c.verificado_at) : '—'],
                ['Prueba hasta', c.trial_ends_at ? formatDate(c.trial_ends_at) : '—'],
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {verifActions.map((v) => (
              <form key={v} action={setVerificacion.bind(null, c.id, v)}>
                <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Marcar {v}</button>
              </form>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Solo los prestadores verificados y activos (o en prueba) pueden recibir asignaciones.</p>
        </Card>

        <Card title="Registrar pago de liquidación" description="El pago se registra a mano cuando llega la transferencia. Si no quedan deudas vencidas, la cuenta se reactiva.">
          {impagas.length ? (
            <ActionForm action={registerPayment.bind(null, c.id)} submitLabel="Registrar pago" resetOnSuccess>
              <label className={labelClass}>
                Liquidación
                <select name="payment_id" required className={inputClass}>
                  {impagas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {periodLabel(p.period)} · {formatMoney(p.amount_cents, p.currency)} · vence {formatDate(p.due_date)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Medio
                <select name="method" className={inputClass}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className={labelClass}>
                Notas / comprobante
                <input name="notes" maxLength={300} className={inputClass} />
              </label>
            </ActionForm>
          ) : (
            <Empty>No tiene liquidaciones impagas.</Empty>
          )}
        </Card>

        <Card title="Condiciones, rubros y matrícula">
          <ActionForm action={updateCondiciones.bind(null, c.id)} submitLabel="Guardar condiciones">
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Comisión %
                <input name="commission_pct" inputMode="decimal" required defaultValue={String(Number(c.commission_pct))} className={inputClass} />
              </label>
              <label className={labelClass}>
                Día de pago
                <input name="billing_day" type="number" min={1} max={28} required defaultValue={c.billing_day ?? 10} className={inputClass} />
              </label>
            </div>
            <fieldset className="flex flex-wrap gap-3 text-sm">
              <legend className="mb-1 font-medium">Rubros</legend>
              {RUBROS.map((r) => (
                <label key={r.id} className="flex items-center gap-2">
                  <input type="checkbox" name="rubros" value={r.id} defaultChecked={c.rubros.includes(r.id)} /> {r.nombre}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <label className={labelClass}>
                Tipo de matrícula
                <select name="matricula_tipo" defaultValue={c.matricula_tipo ?? ''} className={inputClass}>
                  {MATRICULAS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Número
                <input name="matricula_numero" defaultValue={c.matricula_numero ?? ''} maxLength={40} className={inputClass} />
              </label>
            </div>
          </ActionForm>
        </Card>

        <Card title="Acceso al panel">
          {members.length ? (
            <ul className="flex flex-col gap-3 text-sm">
              {members.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.email}
                      {m.mustChangePassword && ' · con contraseña temporal'}
                    </p>
                  </div>
                  <form action={resendAccess.bind(null, c.id, m.userId)}>
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Reenviar acceso</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sin usuarios (prestador de demo).</Empty>
          )}
        </Card>

        <Card title="Liquidaciones">
          {payments.length ? (
            <Table head={['Período', 'Monto', 'Vence', 'Estado']}>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td className="capitalize">{periodLabel(p.period)}</Td>
                  <Td>{formatMoney(p.amount_cents, p.currency)}</Td>
                  <Td className="text-xs">{formatDate(p.due_date)}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                    {p.paid_at && <p className="mt-1 text-xs text-muted-foreground">{`${formatDateTime(p.paid_at)} · ${p.method ?? ''}`}</p>}
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Sin liquidaciones emitidas.</Empty>
          )}
        </Card>

        <Card title="Últimos pedidos">
          {pedidos.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {pedidos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <Link href={`/plataforma/pedidos/${p.id}`} className="hover:text-primary">
                    {numeroPedido(p.numero)} · {p.servicio_nombre}
                  </Link>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatDate(p.dia)} {p.comision_monto != null && `· com. ${pesos(p.comision_monto)}`} <EstadoPedido estado={p.estado} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sin pedidos.</Empty>
          )}
        </Card>
      </div>
    </>
  )
}
