import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Empty, PageTitle, Table, Td } from '@/components/panel/ui'
import { EstadoPedido } from '@/components/site/timeline'
import { franjaRango, numeroPedido } from '@/lib/catalogo'
import { listPedidosDePrestador } from '@/lib/data/pedidos'
import { formatDate, pesos } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function PedidosPrestadorPage() {
  const ctx = await requirePrestador('pedidos.view')
  const pedidos = await listPedidosDePrestador(ctx.clientId)
  return (
    <>
      <PageTitle eyebrow="Panel de prestadores" title="Pedidos asignados" description="Los que esperan tu respuesta aparecen primero." />
      <Card>
        {pedidos.length ? (
          <Table head={['Pedido', 'Cuándo', 'Barrio', 'Precio', 'Estado']}>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link href={`/empresa/pedidos/${p.id}`} className="font-semibold hover:text-primary">
                    {numeroPedido(p.numero)} · {p.servicio_nombre}
                  </Link>
                </Td>
                <Td className="text-xs">
                  {formatDate(p.dia)}, {franjaRango(p.franja)}
                </Td>
                <Td>{p.barrio}</Td>
                <Td className="num">{pesos(p.precio_cerrado)}</Td>
                <Td>
                  <EstadoPedido estado={p.estado} />
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Todavía no te asignamos pedidos.</Empty>
        )}
      </Card>
    </>
  )
}
