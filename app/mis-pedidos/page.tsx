import type { Metadata } from 'next'
import Link from 'next/link'
import { signOutAction } from '@/app/auth-actions'
import { PageShell } from '@/components/site/page-shell'
import { EstadoPedido } from '@/components/site/timeline'
import { franjaRango, numeroPedido } from '@/lib/catalogo'
import { listPedidosDeHogar } from '@/lib/data/pedidos'
import { formatDate, pesos } from '@/lib/dates'
import { requireHogar } from '@/lib/guards'

export const metadata: Metadata = { title: 'Mis pedidos', robots: { index: false, follow: false } }
export const instant = false

export default async function MisPedidosPage() {
  const user = await requireHogar('/mis-pedidos')
  const pedidos = await listPedidosDeHogar(user.id)

  return (
    <PageShell>
      <div className="wrap max-w-[760px] py-12">
        <div className="sec-head">
          <p className="eyebrow">Hola, {user.name.split(' ')[0]}</p>
          <h1 className="h2">Mis pedidos</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/pedido/nuevo" className="btn btn-primary btn-sm">
              Pedir un servicio
            </Link>
            <Link href="/completar-datos" className="btn btn-ghost btn-sm">
              Mis datos
            </Link>
            <form action={signOutAction.bind(null, '/')}>
              <button className="btn btn-ghost btn-sm">Salir</button>
            </form>
          </div>
        </div>
        {pedidos.length ? (
          <ul className="grid gap-3">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/pedido/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border bg-card p-4 hover:border-foreground">
                  <div>
                    <p className="font-semibold">{p.servicio_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {numeroPedido(p.numero)} · {formatDate(p.dia)}, {franjaRango(p.franja)} · {p.barrio}
                      {p.prestador_nombre ? ` · ${p.prestador_nombre}` : ''}
                    </p>
                    {p.pendientes > 0 && <p className="mt-1 text-xs font-semibold text-primary-ink">Tenés un presupuesto adicional para responder</p>}
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
          <p className="lead">
            Todavía no hiciste pedidos.{' '}
            <Link href="/#asistente" className="underline">
              Contanos qué pasa
            </Link>{' '}
            o elegí un servicio del{' '}
            <Link href="/#servicios" className="underline">
              tarifario
            </Link>
            .
          </p>
        )}
      </div>
    </PageShell>
  )
}
