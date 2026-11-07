import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, Empty, Metric, PageTitle } from '@/components/panel/ui'
import { q, q1 } from '@/lib/db'
import { formatDate } from '@/lib/dates'
import { requireSuperadmin } from '@/lib/guards'

export const metadata: Metadata = { title: 'Métricas' }

const TZ = 'America/Argentina/Buenos_Aires'
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : '—')

// Métricas de las hipótesis del MVP (sección 14.4 del CLAUDE.md del equipo), calculadas desde Neon.
// Excluye los datos de demostración (hogar "demo-hogar").
export default async function PlatformDashboard() {
  await requireSuperadmin()
  const [k, semanas, top, prestadores] = await Promise.all([
    q1<{
      total: number
      terminados: number
      contratados: number
      cancelados: number
      nuevos: number
      horas_asignar: string | null
      promedio: string | null
      calificaciones: number
      visitas: number
      asistente: number
      pedidos_30: number
      hogares: number
      recompra: number
      con_adicional_rechazado: number
      pendientes_solicitudes: number
    }>(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE estado = 'terminado')::int AS terminados,
         count(*) FILTER (WHERE aceptado_at IS NOT NULL OR estado IN ('en_curso','terminado'))::int AS contratados,
         count(*) FILTER (WHERE estado = 'cancelado')::int AS cancelados,
         count(*) FILTER (WHERE estado = 'nuevo')::int AS nuevos,
         round(avg(extract(epoch FROM asignado_at - created_at) / 3600)::numeric, 1)::text AS horas_asignar,
         (SELECT round(avg(puntaje), 2)::text FROM calificacion k JOIN pedido p2 ON p2.id = k.pedido_id WHERE p2.cliente_user_id <> 'demo-hogar') AS promedio,
         (SELECT count(*)::int FROM calificacion k JOIN pedido p2 ON p2.id = k.pedido_id WHERE p2.cliente_user_id <> 'demo-hogar') AS calificaciones,
         (SELECT count(*)::int FROM evento WHERE tipo = 'visita' AND created_at > now() - interval '30 days') AS visitas,
         (SELECT count(*)::int FROM evento WHERE tipo = 'inicio_asistente' AND created_at > now() - interval '30 days') AS asistente,
         count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS pedidos_30,
         count(DISTINCT cliente_user_id)::int AS hogares,
         (SELECT count(*)::int FROM (
            SELECT p1.cliente_user_id FROM pedido p1 JOIN pedido p2 ON p2.cliente_user_id = p1.cliente_user_id AND p2.id <> p1.id
               AND p2.created_at > p1.created_at AND p2.created_at <= p1.created_at + interval '90 days'
             WHERE p1.cliente_user_id <> 'demo-hogar' GROUP BY p1.cliente_user_id) r) AS recompra,
         count(*) FILTER (WHERE estado = 'terminado' AND EXISTS (SELECT 1 FROM presupuesto_adicional a WHERE a.pedido_id = pedido.id AND a.estado = 'rechazado'))::int AS con_adicional_rechazado,
         (SELECT count(*)::int FROM client_application WHERE status = 'pending_review') AS pendientes_solicitudes
       FROM pedido WHERE cliente_user_id <> 'demo-hogar'`,
    ),
    q<{ semana: string; pedidos: number }>(
      `SELECT to_char(date_trunc('week', created_at AT TIME ZONE '${TZ}'), 'YYYY-MM-DD') AS semana, count(*)::int AS pedidos
         FROM pedido WHERE cliente_user_id <> 'demo-hogar' AND created_at > now() - interval '8 weeks'
        GROUP BY 1 ORDER BY 1`,
    ),
    q<{ codigo: string; nombre: string; pedidos: number }>(
      `SELECT servicio_codigo AS codigo, max(servicio_nombre) AS nombre, count(*)::int AS pedidos
         FROM pedido WHERE cliente_user_id <> 'demo-hogar' GROUP BY 1 ORDER BY 3 DESC, 1 LIMIT 6`,
    ),
    q1<{ activos: number; total: number; con_trabajo: number; segundo_mes: number; alta_hace_2m: number }>(
      `SELECT count(*) FILTER (WHERE status IN ('trial','active') AND verificacion = 'verificado')::int AS activos,
              count(*)::int AS total,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM pedido p WHERE p.prestador_id = c.id AND p.terminado_at > now() - interval '30 days'))::int AS con_trabajo,
              count(*) FILTER (WHERE created_at < now() - interval '30 days' AND status IN ('trial','active'))::int AS segundo_mes,
              count(*) FILTER (WHERE created_at < now() - interval '30 days')::int AS alta_hace_2m
         FROM client c WHERE NOT is_demo`,
    ),
  ])
  const t = k ?? ({} as NonNullable<typeof k>)
  const max = Math.max(1, ...semanas.map((s) => s.pedidos))
  const maxTop = Math.max(1, ...top.map((s) => s.pedidos))
  const semanasPromedio = semanas.length ? (semanas.reduce((a, s) => a + s.pedidos, 0) / semanas.length).toFixed(1) : '0'

  return (
    <>
      <PageTitle
        eyebrow="Plataforma"
        title="Hipótesis del MVP"
        description="Métricas calculadas en vivo desde la base (sin datos de demo). Criterios de éxito del TP entre paréntesis."
        actions={
          <>
            <Link href="/plataforma/pedidos?estado=nuevo" className="btn btn-primary btn-sm">
              {t.nuevos ?? 0} pedidos por asignar
            </Link>
            <Link href="/plataforma/solicitudes" className="btn btn-ghost btn-sm">
              {t.pendientes_solicitudes ?? 0} solicitudes de alta
            </Link>
          </>
        }
      />
      <section aria-label="Métricas" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Solicitudes por semana" value={semanasPromedio} hint="Promedio últimas 8 semanas (≥ 15)" />
        <Metric label="Visitas → solicitudes" value={pct(t.pedidos_30 ?? 0, t.visitas ?? 0)} hint={`${t.pedidos_30 ?? 0} pedidos / ${t.visitas ?? 0} visitas, 30 días (≥ 3%)`} />
        <Metric label="Solicitudes → contrataciones" value={pct(t.contratados ?? 0, t.total ?? 0)} hint={`${t.contratados ?? 0} de ${t.total ?? 0} (≥ 50%)`} />
        <Metric label="Tiempo hasta asignar" value={t.horas_asignar ? `${t.horas_asignar} h` : '—'} hint="Promedio (< 2 h en horario laboral)" />
        <Metric label="Calificación promedio" value={t.promedio ? `★ ${t.promedio}` : '—'} hint={`${t.calificaciones ?? 0} calificaciones (≥ 4,5)`} />
        <Metric label="Precio cerrado cumplido" value={pct((t.terminados ?? 0) - (t.con_adicional_rechazado ?? 0), t.terminados ?? 0)} hint="Terminados sin adicional rechazado (≥ 95%)" />
        <Metric label="Recompra a 90 días" value={pct(t.recompra ?? 0, t.hogares ?? 0)} hint={`${t.recompra ?? 0} de ${t.hogares ?? 0} hogares (≥ 20%)`} />
        <Metric
          label="Prestadores activos"
          value={`${prestadores?.activos ?? 0}`}
          hint={`${prestadores?.con_trabajo ?? 0} con trabajos en 30 días · activos al 2.º mes: ${prestadores?.segundo_mes ?? 0}/${prestadores?.alta_hace_2m ?? 0} (8 de 10)`}
        />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Solicitudes por semana" description="Pedidos creados, últimas 8 semanas.">
          {semanas.length ? (
            <ul className="flex flex-col gap-2">
              {semanas.map((s) => (
                <li key={s.semana} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground">Sem. {formatDate(s.semana)}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.pedidos / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold">{s.pedidos}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Todavía no hay pedidos.</Empty>
          )}
        </Card>
        <Card title="Servicios más pedidos">
          {top.length ? (
            <ul className="flex flex-col gap-2">
              {top.map((s) => (
                <li key={s.codigo} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_40px] items-center gap-3 text-sm">
                  <span className="truncate">
                    <span className="font-mono text-xs text-muted-foreground">{s.codigo}</span> {s.nombre}
                  </span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.pedidos / maxTop) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold">{s.pedidos}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Todavía no hay pedidos.</Empty>
          )}
        </Card>
        <Card title="Cancelaciones y embudo">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Pedidos totales</dt>
            <dd className="font-semibold">{t.total ?? 0}</dd>
            <dt className="text-muted-foreground">Terminados</dt>
            <dd className="font-semibold">{t.terminados ?? 0}</dd>
            <dt className="text-muted-foreground">Cancelados</dt>
            <dd className="font-semibold">
              {t.cancelados ?? 0} ({pct(t.cancelados ?? 0, t.total ?? 0)})
            </dd>
            <dt className="text-muted-foreground">Usos del asistente (30 días)</dt>
            <dd className="font-semibold">{t.asistente ?? 0}</dd>
          </dl>
        </Card>
      </div>
    </>
  )
}
