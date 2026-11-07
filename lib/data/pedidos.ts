import 'server-only'
import { q, q1 } from '../db'

export type PedidoDetalle = {
  id: string
  numero: number
  cliente_user_id: string
  servicio_codigo: string
  servicio_nombre: string
  rubro: string
  precio_cerrado: number
  problema: string
  barrio: string
  direccion: string
  contacto_nombre: string
  contacto_celular: string
  indicaciones: string | null
  dia: string
  franja: string
  estado: string
  origen: string
  prestador_id: string | null
  prestador_nombre: string | null
  prestador_telefono: string | null
  matricula_tipo: string | null
  matricula_numero: string | null
  comision_pct: string | null
  comision_monto: number | null
  created_at: Date
  asignado_at: Date | null
  aceptado_at: Date | null
  en_curso_at: Date | null
  terminado_at: Date | null
  cancelado_at: Date | null
  cancelado_por: string | null
  motivo_cancelacion: string | null
  adicional_aprobado: number
  puntaje: number | null
  comentario: string | null
}

const SELECT = `SELECT p.id, p.numero, p.cliente_user_id, p.servicio_codigo, p.servicio_nombre, p.rubro, p.precio_cerrado, p.problema, p.barrio,
       p.direccion, p.contacto_nombre, p.contacto_celular, ph.indicaciones, to_char(p.dia, 'YYYY-MM-DD') AS dia, p.franja, p.estado, p.origen,
       p.prestador_id, c.name AS prestador_nombre, c.phone AS prestador_telefono, c.matricula_tipo, c.matricula_numero,
       p.comision_pct::text, p.comision_monto, p.created_at, p.asignado_at, p.aceptado_at, p.en_curso_at, p.terminado_at, p.cancelado_at,
       p.cancelado_por, p.motivo_cancelacion,
       coalesce((SELECT sum(monto)::int FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0) AS adicional_aprobado,
       k.puntaje, k.comentario
  FROM pedido p
  LEFT JOIN client c ON c.id = p.prestador_id
  LEFT JOIN perfil_hogar ph ON ph.user_id = p.cliente_user_id
  LEFT JOIN calificacion k ON k.pedido_id = p.id`

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pedido de un hogar: el dueño sale de la sesión (userId), nunca de la URL. */
export function getPedidoDeHogar(id: string, userId: string) {
  if (!UUID_RE.test(id)) return Promise.resolve(null)
  return q1<PedidoDetalle>(`${SELECT} WHERE p.id = $1 AND p.cliente_user_id = $2`, [id, userId])
}

/** Pedido asignado a un prestador (clientId resuelto de la sesión). */
export function getPedidoDePrestador(id: string, clientId: string) {
  if (!UUID_RE.test(id)) return Promise.resolve(null)
  return q1<PedidoDetalle>(`${SELECT} WHERE p.id = $1 AND p.prestador_id = $2`, [id, clientId])
}

export function getPedidoAdmin(id: string) {
  if (!UUID_RE.test(id)) return Promise.resolve(null)
  return q1<PedidoDetalle>(`${SELECT} WHERE p.id = $1`, [id])
}

export type Presupuesto = { id: string; monto: number; detalle: string; estado: string; created_at: Date; respondido_at: Date | null }

export function listPresupuestos(pedidoId: string) {
  return q<Presupuesto>(`SELECT id, monto, detalle, estado, created_at, respondido_at FROM presupuesto_adicional WHERE pedido_id = $1 ORDER BY created_at`, [pedidoId])
}

export type PedidoFila = {
  id: string
  numero: number
  servicio_nombre: string
  servicio_codigo: string
  rubro: string
  precio_cerrado: number
  barrio: string
  dia: string
  franja: string
  estado: string
  prestador_nombre: string | null
  created_at: Date
  pendientes: number
}

const LIST = `SELECT p.id, p.numero, p.servicio_nombre, p.servicio_codigo, p.rubro, p.precio_cerrado, p.barrio, to_char(p.dia, 'YYYY-MM-DD') AS dia,
       p.franja, p.estado, c.name AS prestador_nombre, p.created_at,
       (SELECT count(*)::int FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'pendiente') AS pendientes
  FROM pedido p LEFT JOIN client c ON c.id = p.prestador_id`

export function listPedidosDeHogar(userId: string) {
  return q<PedidoFila>(`${LIST} WHERE p.cliente_user_id = $1 ORDER BY p.created_at DESC LIMIT 100`, [userId])
}

export function listPedidosDePrestador(clientId: string) {
  return q<PedidoFila>(
    `${LIST} WHERE p.prestador_id = $1
      ORDER BY (p.estado = 'asignado' AND p.aceptado_at IS NULL) DESC, (p.estado IN ('asignado','en_curso')) DESC, p.dia DESC, p.created_at DESC LIMIT 200`,
    [clientId],
  )
}

export function listPedidosAdmin(estado: string | null) {
  return estado
    ? q<PedidoFila>(`${LIST} WHERE p.estado = $1 ORDER BY p.created_at DESC LIMIT 300`, [estado])
    : q<PedidoFila>(`${LIST} ORDER BY (p.estado = 'nuevo') DESC, p.created_at DESC LIMIT 300`)
}
