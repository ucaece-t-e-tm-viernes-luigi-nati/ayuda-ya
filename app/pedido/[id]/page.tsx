import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/forms'
import { PageShell } from '@/components/site/page-shell'
import { EstadoPedido, Timeline } from '@/components/site/timeline'
import { franjaRango, matriculaNombre, numeroPedido, rubroNombre } from '@/lib/catalogo'
import { getPedidoDeHogar, listPresupuestos } from '@/lib/data/pedidos'
import { q1 } from '@/lib/db'
import { formatDate, formatDateTime, pesos } from '@/lib/dates'
import { requireHogar } from '@/lib/guards'
import { whatsappLink } from '@/lib/site'
import { calificarPedido, cancelarPedido, responderPresupuesto } from '../actions'
import { Estrellas } from './estrellas'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false, follow: false } }
export const instant = false

export default async function PedidoPage({ params, searchParams }: PageProps<'/pedido/[id]'>) {
  const { id } = await params
  const sp = await searchParams
  const user = await requireHogar(`/pedido/${id}`)
  const p = await getPedidoDeHogar(id, user.id)
  if (!p) notFound()
  const [presupuestos, rating] = await Promise.all([
    listPresupuestos(p.id),
    p.prestador_id
      ? q1<{ promedio: string | null; cantidad: number }>(`SELECT round(avg(puntaje), 1)::text AS promedio, count(*)::int AS cantidad FROM calificacion WHERE prestador_id = $1`, [p.prestador_id])
      : null,
  ])
  const total = p.precio_cerrado + p.adicional_aprobado
  const nro = numeroPedido(p.numero)

  return (
    <PageShell>
      <div className="wrap py-10">
        <Link href="/mis-pedidos" className="hint underline">
          ← Mis pedidos
        </Link>
        {sp.nuevo === '1' && (
          <div role="status" className="mt-4 rounded-xl bg-ok-soft px-4 py-3 text-sm font-semibold text-ok">
            ¡Recibimos tu pedido! Te avisamos por mail cuando le asignemos un profesional (en horario laboral, en menos de 2 horas).
          </div>
        )}
        <div className="sec-head mt-4">
          <p className="eyebrow">Pedido {nro}</p>
          <h1 className="h2">{p.servicio_nombre}</h1>
          <EstadoPedido estado={p.estado} />
        </div>

        <div className="grid items-start gap-8 md:grid-cols-[1.1fr_.9fr]">
          <div className="grid gap-6">
            <section className="orden">
              <span className="stamp">Precio cerrado</span>
              <div className="orden-row">
                <span>Servicio</span>
                <span>
                  {p.servicio_codigo} · {rubroNombre(p.rubro)}
                </span>
              </div>
              <div className="orden-row">
                <span>Cuándo</span>
                <span>
                  {formatDate(p.dia)}, {franjaRango(p.franja)}
                </span>
              </div>
              <div className="orden-row">
                <span>Dónde</span>
                <span>
                  {p.direccion} · {p.barrio}
                </span>
              </div>
              <div className="orden-row">
                <span>Profesional</span>
                <span>
                  {p.prestador_nombre ? (
                    <>
                      {p.prestador_nombre}
                      <br />
                      <small className="font-normal text-muted-foreground">
                        {matriculaNombre(p.matricula_tipo)}
                        {p.matricula_numero ? ` · N.º ${p.matricula_numero}` : ''}
                        {rating?.promedio ? ` · ★ ${rating.promedio} (${rating.cantidad})` : ''}
                      </small>
                    </>
                  ) : (
                    'Lo estamos asignando'
                  )}
                </span>
              </div>
              {p.adicional_aprobado > 0 && (
                <div className="orden-row">
                  <span>Adicionales aprobados</span>
                  <span>{pesos(p.adicional_aprobado)}</span>
                </div>
              )}
              <div className="flex items-end justify-between gap-3 pt-4">
                <span className="eyebrow">Total a pagar</span>
                <span className="num text-[28px]">{pesos(total)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Sin comisión para vos. Pagás al terminar.</p>
            </section>

            <section className="ui-form">
              <h2 className="h3">Lo que nos contaste</h2>
              <p className="whitespace-pre-line text-[15px] text-muted-foreground">{p.problema}</p>
            </section>

            {presupuestos.length > 0 && (
              <section className="ui-form">
                <h2 className="h3">Presupuestos adicionales</h2>
                <p className="hint">Nada extra se hace sin tu aprobación. Lo que apruebes se suma al precio cerrado.</p>
                <ul className="grid gap-3">
                  {presupuestos.map((a) => (
                    <li key={a.id} className="grid gap-2 rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="num text-lg">{pesos(a.monto)}</span>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {a.estado === 'pendiente' ? 'Esperando tu respuesta' : a.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm">{a.detalle}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                      {a.estado === 'pendiente' && ['asignado', 'en_curso'].includes(p.estado) && (
                        <div className="flex flex-wrap gap-2">
                          <form action={responderPresupuesto.bind(null, p.id, a.id, true)}>
                            <button className="btn btn-primary btn-sm">Aprobar {pesos(a.monto)}</button>
                          </form>
                          <form action={responderPresupuesto.bind(null, p.id, a.id, false)}>
                            <button className="btn btn-ghost btn-sm">Rechazar</button>
                          </form>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {p.estado === 'terminado' && (
              <section className="ui-form">
                <h2 className="h3">Calificá el trabajo</h2>
                {p.puntaje ? (
                  <>
                    <p className="text-2xl text-primary" aria-label={`${p.puntaje} de 5 estrellas`}>
                      {'★'.repeat(p.puntaje)}
                      <span className="text-border">{'★'.repeat(5 - p.puntaje)}</span>
                    </p>
                    {p.comentario && <p className="text-sm text-muted-foreground">“{p.comentario}”</p>}
                    <p className="hint">¡Gracias! Tu calificación ayuda a otros vecinos.</p>
                  </>
                ) : (
                  <ActionForm action={calificarPedido.bind(null, p.id)} submitLabel="Enviar calificación" className="grid gap-4" submitClassName="btn btn-primary">
                    <Estrellas />
                    <div className="field">
                      <label htmlFor="comentario">Comentario (opcional)</label>
                      <textarea id="comentario" name="comentario" maxLength={600} className="ui-input" placeholder="¿Llegó a horario? ¿Quedó bien?" />
                    </div>
                  </ActionForm>
                )}
              </section>
            )}
          </div>

          <aside className="grid gap-6">
            <section className="ui-form">
              <h2 className="h3">Seguimiento</h2>
              <Timeline p={p} />
              {p.estado === 'cancelado' && p.motivo_cancelacion && <p className="hint">Motivo: {p.motivo_cancelacion}</p>}
            </section>
            {['nuevo', 'asignado'].includes(p.estado) && (
              <section className="ui-form">
                <h2 className="h3">¿Ya no lo necesitás?</h2>
                <ActionForm action={cancelarPedido.bind(null, p.id)} submitLabel="Cancelar pedido" confirm="¿Seguro que querés cancelar el pedido?" className="grid gap-3" submitClassName="btn btn-ghost">
                  <input name="motivo" maxLength={300} placeholder="Motivo (opcional)" className="ui-input" aria-label="Motivo de la cancelación" />
                </ActionForm>
              </section>
            )}
            <a href={whatsappLink(`Hola AyudaYa, te escribo por el pedido ${nro} (${p.servicio_nombre}).`)} target="_blank" rel="noopener" className="btn btn-wa">
              Consultar por WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
