import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, PageTitle } from '@/components/panel/ui'
import { EstadoPedido, Timeline } from '@/components/site/timeline'
import { franjaRango, numeroPedido, rubroNombre } from '@/lib/catalogo'
import { getPedidoDePrestador, listPresupuestos } from '@/lib/data/pedidos'
import { formatDate, formatDateTime, pesos } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'
import { aceptarPedido, iniciarPedido, proponerPresupuesto, rechazarPedido, terminarPedido } from '../../actions'

export const metadata: Metadata = { title: 'Pedido' }

export default async function PedidoPrestadorPage({ params }: PageProps<'/empresa/pedidos/[id]'>) {
  const ctx = await requirePrestador('pedidos.view')
  const { id } = await params
  const p = await getPedidoDePrestador(id, ctx.clientId)
  if (!p) notFound()
  const presupuestos = await listPresupuestos(p.id)
  const aceptado = !!p.aceptado_at
  const pct = Number(p.comision_pct ?? 15)
  const total = p.precio_cerrado + p.adicional_aprobado
  const puede = !ctx.readOnly
  const btn = 'inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold'

  return (
    <>
      <Link href="/empresa/pedidos" className="text-xs font-semibold text-muted-foreground hover:text-primary">
        ← Pedidos
      </Link>
      <PageTitle title={`${numeroPedido(p.numero)} · ${p.servicio_nombre}`} description={<EstadoPedido estado={p.estado} />} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <Card title="Trabajo">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
              {(
                [
                  ['Servicio', `${p.servicio_codigo} · ${p.servicio_nombre} (${rubroNombre(p.rubro)})`],
                  ['Cuándo', `${formatDate(p.dia)}, ${franjaRango(p.franja)}`],
                  ['Barrio', p.barrio],
                  ['Dirección', aceptado ? `${p.direccion}${p.indicaciones ? ` (${p.indicaciones})` : ''}` : 'Se muestra cuando aceptás el pedido'],
                  ['Cliente', aceptado ? `${p.contacto_nombre} · ${p.contacto_celular}` : 'Se muestra cuando aceptás el pedido'],
                  ['Precio cerrado', pesos(p.precio_cerrado)],
                  ['Adicionales aprobados', pesos(p.adicional_aprobado)],
                  ['Total a cobrar al cliente', pesos(total)],
                  ['Comisión AyudaYa', p.comision_monto != null ? pesos(p.comision_monto) : `${pct}% ≈ ${pesos((total * pct) / 100)}`],
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
              <p className="font-semibold">Problema contado por el cliente</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{p.problema}</p>
            </div>
          </Card>

          {(presupuestos.length > 0 || (puede && aceptado && ['asignado', 'en_curso'].includes(p.estado))) && (
            <Card title="Presupuesto adicional" description="Si hace falta más trabajo o materiales, proponelo acá. El cliente lo aprueba antes de que lo hagas.">
              {presupuestos.length > 0 && (
                <ul className="mb-4 flex flex-col gap-2 text-sm">
                  {presupuestos.map((a) => (
                    <li key={a.id} className="rounded-xl border border-border p-3">
                      <div className="flex justify-between gap-3">
                        <span className="num">{pesos(a.monto)}</span>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{a.estado}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-line">{a.detalle}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {puede && aceptado && ['asignado', 'en_curso'].includes(p.estado) && (
                <ActionForm action={proponerPresupuesto.bind(null, p.id)} submitLabel="Enviar al cliente" resetOnSuccess>
                  <label className={`${labelClass} max-w-[200px]`}>
                    Monto ($)
                    <input name="monto" inputMode="numeric" required className={inputClass} placeholder="20000" />
                  </label>
                  <label className={labelClass}>
                    Detalle
                    <textarea name="detalle" required minLength={10} maxLength={800} rows={3} className={inputClass} placeholder="Ej.: cambio de sifón completo (material incluido)" />
                  </label>
                </ActionForm>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {puede && p.estado === 'asignado' && !aceptado && (
            <Card title="¿Tomás este pedido?" description="Al aceptarlo ves la dirección y el celular del cliente.">
              <form action={aceptarPedido.bind(null, p.id)}>
                <button className={`${btn} bg-primary text-primary-foreground`}>Aceptar pedido</button>
              </form>
              <div className="mt-5 border-t border-border pt-4">
                <ActionForm action={rechazarPedido.bind(null, p.id)} submitLabel="No puedo tomarlo" submitClassName={`${btn} border border-border hover:bg-muted`}>
                  <label className={labelClass}>
                    Motivo
                    <input name="motivo" required maxLength={300} className={inputClass} placeholder="Ej.: no tengo turno ese día" />
                  </label>
                </ActionForm>
              </div>
            </Card>
          )}
          {puede && p.estado === 'asignado' && aceptado && (
            <Card title="Cuando llegues">
              <form action={iniciarPedido.bind(null, p.id)}>
                <button className={`${btn} bg-primary text-primary-foreground`}>Marcar en curso</button>
              </form>
            </Card>
          )}
          {puede && p.estado === 'en_curso' && (
            <Card title="Al terminar" description="El cliente recibe un aviso para calificarte.">
              <form action={terminarPedido.bind(null, p.id)}>
                <button className={`${btn} bg-primary text-primary-foreground`}>Marcar terminado</button>
              </form>
            </Card>
          )}
          <Card title="Seguimiento">
            <Timeline p={p} />
            {p.puntaje && (
              <p className="mt-4 text-sm">
                Calificación: <span className="text-primary">{'★'.repeat(p.puntaje)}</span>
                {p.comentario && <span className="block text-muted-foreground">“{p.comentario}”</span>}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
