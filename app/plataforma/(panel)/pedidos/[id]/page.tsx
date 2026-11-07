import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, Empty, PageTitle } from '@/components/panel/ui'
import { EstadoPedido, Timeline } from '@/components/site/timeline'
import { ORIGEN_LABEL, franjaRango, matriculaNombre, numeroPedido, rubroNombre } from '@/lib/catalogo'
import { getPedidoAdmin, listPresupuestos } from '@/lib/data/pedidos'
import { q } from '@/lib/db'
import { formatDate, formatDateTime, pesos } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'
import { ASSIGNABLE_STATUSES } from '@/lib/permissions'
import { asignarPedido, cancelarPedidoAdmin } from '../../actions'

export const metadata: Metadata = { title: 'Pedido' }

export default async function PedidoAdminPage({ params }: PageProps<'/plataforma/pedidos/[id]'>) {
  await requireSuperadmin()
  const { id } = await params
  const p = await getPedidoAdmin(id)
  if (!p) notFound()
  const [presupuestos, candidatos] = await Promise.all([
    listPresupuestos(p.id),
    p.estado === 'nuevo'
      ? q<{ id: string; name: string; zona: boolean; activos: number; promedio: string | null; matricula_tipo: string | null }>(
          `SELECT c.id, c.name, ($2 = ANY(c.zonas)) AS zona, c.matricula_tipo,
                  (SELECT count(*)::int FROM pedido x WHERE x.prestador_id = c.id AND x.estado IN ('asignado','en_curso')) AS activos,
                  (SELECT round(avg(puntaje), 1)::text FROM calificacion k WHERE k.prestador_id = c.id) AS promedio
             FROM client c
            WHERE c.verificacion = 'verificado' AND c.status = ANY($3) AND $1 = ANY(c.rubros)
            ORDER BY ($2 = ANY(c.zonas)) DESC, activos, c.name`,
          [p.rubro, p.barrio, [...ASSIGNABLE_STATUSES]],
        )
      : Promise.resolve([]),
  ])
  const enZona = candidatos.filter((c) => c.zona)

  return (
    <>
      <Link href="/plataforma/pedidos" className="text-xs font-semibold text-muted-foreground hover:text-primary">
        ← Pedidos
      </Link>
      <PageTitle title={`${numeroPedido(p.numero)} · ${p.servicio_nombre}`} description={<EstadoPedido estado={p.estado} />} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <Card title="Detalle">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[170px_minmax(0,1fr)]">
              {(
                [
                  ['Servicio', `${p.servicio_codigo} · ${rubroNombre(p.rubro)}`],
                  ['Precio cerrado', pesos(p.precio_cerrado)],
                  ['Adicionales aprobados', pesos(p.adicional_aprobado)],
                  ['Comisión', p.comision_monto != null ? pesos(p.comision_monto) : p.comision_pct ? `${Number(p.comision_pct)}%` : '—'],
                  ['Cuándo', `${formatDate(p.dia)}, ${franjaRango(p.franja)}`],
                  ['Dirección', `${p.direccion} · ${p.barrio}${p.indicaciones ? ` (${p.indicaciones})` : ''}`],
                  ['Cliente', `${p.contacto_nombre} · ${p.contacto_celular}`],
                  ['Origen', ORIGEN_LABEL[p.origen] ?? p.origen],
                  ['Prestador', p.prestador_nombre ? `${p.prestador_nombre}${p.aceptado_at ? ' (aceptó)' : ' (sin confirmar)'}` : '—'],
                  ['Calificación', p.puntaje ? `${'★'.repeat(p.puntaje)}${p.comentario ? ` · “${p.comentario}”` : ''}` : '—'],
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
              <p className="font-semibold">Problema</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{p.problema}</p>
            </div>
          </Card>
          {presupuestos.length > 0 && (
            <Card title="Presupuestos adicionales">
              <ul className="flex flex-col gap-2 text-sm">
                {presupuestos.map((a) => (
                  <li key={a.id} className="rounded-xl border border-border p-3">
                    <span className="num">{pesos(a.monto)}</span> · <span className="text-xs font-semibold uppercase">{a.estado}</span>
                    <p className="mt-1">{a.detalle}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-5">
          {p.estado === 'nuevo' && (
            <Card title="Asignar prestador" description={`Verificados, activos, de ${rubroNombre(p.rubro)}. Primero los que trabajan en ${p.barrio}.`}>
              {candidatos.length ? (
                <ActionForm action={asignarPedido.bind(null, p.id)} submitLabel="Asignar y avisar" pendingLabel="Asignando…">
                  <fieldset className="flex flex-col gap-2 text-sm">
                    <legend className="sr-only">Prestador</legend>
                    {candidatos.map((c) => (
                      <label key={c.id} className="flex items-start gap-2 rounded-xl border border-border p-3 has-[:checked]:border-primary">
                        <input type="radio" name="prestador_id" value={c.id} required defaultChecked={c.id === (enZona[0] ?? candidatos[0]).id} className="mt-1" />
                        <span>
                          <span className="font-semibold">{c.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {c.zona ? `Trabaja en ${p.barrio}` : 'Fuera de su zona'} · {c.activos} activos · {c.promedio ? `★ ${c.promedio}` : 'sin calificaciones'} ·{' '}
                            {matriculaNombre(c.matricula_tipo)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  {enZona.length < candidatos.length && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="forzar_zona" /> Permitir asignar fuera de su zona
                    </label>
                  )}
                </ActionForm>
              ) : (
                <Empty>No hay prestadores verificados y activos de este rubro. Invitá más desde Invitaciones.</Empty>
              )}
            </Card>
          )}
          <Card title="Seguimiento">
            <Timeline p={p} />
            {p.motivo_cancelacion && <p className="mt-3 text-xs text-muted-foreground">Motivo de cancelación ({p.cancelado_por}): {p.motivo_cancelacion}</p>}
          </Card>
          {['nuevo', 'asignado', 'en_curso'].includes(p.estado) && (
            <Card title="Cancelar pedido">
              <ActionForm action={cancelarPedidoAdmin.bind(null, p.id)} submitLabel="Cancelar" confirm="¿Cancelar este pedido?" submitClassName="inline-flex w-fit rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                <label className={labelClass}>
                  Motivo
                  <input name="motivo" required maxLength={300} className={inputClass} />
                </label>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
