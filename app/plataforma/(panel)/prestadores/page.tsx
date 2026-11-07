import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Empty, PageTitle, StatusBadge, Table, Td } from '@/components/panel/ui'
import { rubroNombre } from '@/lib/catalogo'
import { q } from '@/lib/db'
import { formatMoney } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'

export const metadata: Metadata = { title: 'Prestadores' }

export default async function PrestadoresPage() {
  await requireSuperadmin()
  const rows = await q<{
    id: string
    name: string
    rubros: string[]
    zonas: string[]
    status: string
    verificacion: string
    is_demo: boolean
    terminados: number
    activos: number
    promedio: string | null
    deuda: string
  }>(
    `SELECT c.id, c.name, c.rubros, c.zonas, c.status, c.verificacion, c.is_demo,
            (SELECT count(*)::int FROM pedido p WHERE p.prestador_id = c.id AND p.estado = 'terminado') AS terminados,
            (SELECT count(*)::int FROM pedido p WHERE p.prestador_id = c.id AND p.estado IN ('asignado','en_curso')) AS activos,
            (SELECT round(avg(puntaje), 1)::text FROM calificacion k WHERE k.prestador_id = c.id) AS promedio,
            (SELECT coalesce(sum(amount_cents), 0)::text FROM payment x WHERE x.client_id = c.id AND x.status IN ('pending','overdue')) AS deuda
       FROM client c ORDER BY c.is_demo, c.status = 'active' DESC, c.name`,
  )
  return (
    <>
      <PageTitle eyebrow="Plataforma" title="Prestadores" description="Verificación, estado, comisiones y liquidaciones. Las altas nuevas llegan por Solicitudes." />
      <Card>
        {rows.length ? (
          <Table head={['Prestador', 'Rubros', 'Estado', 'Trabajos', 'Calificación', 'Saldo']}>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td>
                  <Link href={`/plataforma/prestadores/${c.id}`} className="font-semibold hover:text-primary">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {c.zonas.slice(0, 4).join(', ')}
                    {c.zonas.length > 4 ? '…' : ''}
                    {c.is_demo ? ' · demo' : ''}
                  </p>
                </Td>
                <Td className="text-xs">{c.rubros.map(rubroNombre).join(', ')}</Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={c.status} />
                    <StatusBadge status={c.verificacion} />
                  </div>
                </Td>
                <Td className="text-xs">
                  {c.terminados} terminados · {c.activos} activos
                </Td>
                <Td>{c.promedio ? `★ ${c.promedio}` : '—'}</Td>
                <Td>{Number(c.deuda) > 0 ? formatMoney(c.deuda) : '—'}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Todavía no hay prestadores aprobados.</Empty>
        )}
      </Card>
    </>
  )
}
