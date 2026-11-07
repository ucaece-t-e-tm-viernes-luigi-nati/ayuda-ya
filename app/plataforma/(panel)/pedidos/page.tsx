import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Empty, PageTitle, Table, Td } from '@/components/panel/ui'
import { EstadoPedido } from '@/components/site/timeline'
import { ESTADOS_PEDIDO, ESTADO_PEDIDO_LABEL, franjaRango, numeroPedido } from '@/lib/catalogo'
import { listPedidosAdmin } from '@/lib/data/pedidos'
import { formatDate, formatDateTime, pesos } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function PedidosAdminPage({ searchParams }: PageProps<'/plataforma/pedidos'>) {
  await requireSuperadmin()
  const sp = await searchParams
  const estado = typeof sp.estado === 'string' && (ESTADOS_PEDIDO as readonly string[]).includes(sp.estado) ? sp.estado : null
  const pedidos = await listPedidosAdmin(estado)
  const filtro = (e: string | null, label: string) => (
    <Link
      key={label}
      href={e ? `/plataforma/pedidos?estado=${e}` : '/plataforma/pedidos'}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${estado === e ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'}`}
    >
      {label}
    </Link>
  )
  return (
    <>
      <PageTitle eyebrow="Plataforma" title="Pedidos" description="Los nuevos esperan asignación manual. Entrá a cada uno para asignar un prestador del rubro y la zona." />
      <div className="mb-4 flex flex-wrap gap-2">
        {filtro(null, 'Todos')}
        {ESTADOS_PEDIDO.map((e) => filtro(e, ESTADO_PEDIDO_LABEL[e]))}
      </div>
      <Card>
        {pedidos.length ? (
          <Table head={['Pedido', 'Cuándo', 'Barrio', 'Precio', 'Prestador', 'Estado']}>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link href={`/plataforma/pedidos/${p.id}`} className="font-semibold hover:text-primary">
                    {numeroPedido(p.numero)} · {p.servicio_nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">Creado {formatDateTime(p.created_at)}</p>
                </Td>
                <Td className="text-xs">
                  {formatDate(p.dia)}, {franjaRango(p.franja)}
                </Td>
                <Td>{p.barrio}</Td>
                <Td className="num">{pesos(p.precio_cerrado)}</Td>
                <Td>{p.prestador_nombre ?? '—'}</Td>
                <Td>
                  <EstadoPedido estado={p.estado} />
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>No hay pedidos{estado ? ' en ese estado' : ''}.</Empty>
        )}
      </Card>
    </>
  )
}
