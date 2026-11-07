import 'server-only'
import { franjaRango, matriculaNombre, numeroPedido } from './catalogo'
import { q, q1 } from './db'
import { formatDate, pesos } from './dates'
import { appUrl, notifyEmails } from './env'
import { sendMail } from './mail'
import { mails } from './mail-templates'

// Mails de pedidos. Nunca lanzan (sendMail registra todo en email_outbox).

type PedidoMail = {
  id: string
  numero: number
  servicio_nombre: string
  precio_cerrado: number
  barrio: string
  dia: string
  franja: string
  comision_pct: string | null
  cliente_nombre: string
  cliente_email: string
  prestador_nombre: string | null
  matricula_tipo: string | null
  matricula_numero: string | null
  adicional: number
}

async function cargar(pedidoId: string) {
  return q1<PedidoMail>(
    `SELECT p.id, p.numero, p.servicio_nombre, p.precio_cerrado, p.barrio, to_char(p.dia, 'YYYY-MM-DD') AS dia, p.franja,
            p.comision_pct::text, u.name AS cliente_nombre, u.email AS cliente_email,
            c.name AS prestador_nombre, c.matricula_tipo, c.matricula_numero,
            coalesce((SELECT sum(monto)::int FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0) AS adicional
       FROM pedido p JOIN "user" u ON u.id = p.cliente_user_id LEFT JOIN client c ON c.id = p.prestador_id
      WHERE p.id = $1`,
    [pedidoId],
  )
}

const cuando = (p: PedidoMail) => `${formatDate(p.dia)}, ${franjaRango(p.franja)}`
const emailReal = (email: string) => !email.endsWith('.invalid')

export async function avisarNuevoPedido(pedidoId: string) {
  const p = await cargar(pedidoId)
  if (!p) return
  const mail = mails.adminNewOrder({
    numero: numeroPedido(p.numero),
    servicio: p.servicio_nombre,
    precio: pesos(p.precio_cerrado),
    barrio: p.barrio,
    cuando: cuando(p),
    link: `${appUrl()}/plataforma/pedidos/${p.id}`,
  })
  for (const to of notifyEmails()) await sendMail({ to, ...mail })
}

export async function avisarAsignacion(pedidoId: string) {
  const p = await cargar(pedidoId)
  if (!p || !p.prestador_nombre) return
  const owners = await q<{ email: string }>(
    `SELECT u.email FROM pedido p JOIN client_member m ON m.client_id = p.prestador_id JOIN "user" u ON u.id = m.user_id WHERE p.id = $1`,
    [pedidoId],
  )
  const pct = Number(p.comision_pct ?? 15)
  for (const { email } of owners) {
    await sendMail({
      to: email,
      ...mails.orderAssignedPrestador({
        empresa: p.prestador_nombre,
        numero: numeroPedido(p.numero),
        servicio: p.servicio_nombre,
        barrio: p.barrio,
        cuando: cuando(p),
        precio: pesos(p.precio_cerrado),
        comision: `${pct}% (${pesos((p.precio_cerrado * pct) / 100)})`,
        link: `${appUrl()}/empresa/pedidos/${p.id}`,
      }),
    })
  }
  if (emailReal(p.cliente_email)) {
    await sendMail({
      to: p.cliente_email,
      ...mails.orderAssignedHousehold({
        nombre: p.cliente_nombre,
        numero: numeroPedido(p.numero),
        servicio: p.servicio_nombre,
        prestador: p.prestador_nombre,
        matricula: p.matricula_numero ? `${matriculaNombre(p.matricula_tipo)} · N.º ${p.matricula_numero}` : matriculaNombre(p.matricula_tipo),
        cuando: cuando(p),
        precio: pesos(p.precio_cerrado),
        link: `${appUrl()}/pedido/${p.id}`,
      }),
    })
  }
}

export async function avisarTerminado(pedidoId: string) {
  const p = await cargar(pedidoId)
  if (!p || !emailReal(p.cliente_email)) return
  await sendMail({
    to: p.cliente_email,
    ...mails.orderFinishedHousehold({
      nombre: p.cliente_nombre,
      numero: numeroPedido(p.numero),
      servicio: p.servicio_nombre,
      total: pesos(p.precio_cerrado + p.adicional),
      link: `${appUrl()}/pedido/${p.id}`,
    }),
  })
}

export async function avisarPresupuesto(pedidoId: string, monto: number, detalle: string) {
  const p = await cargar(pedidoId)
  if (!p || !emailReal(p.cliente_email)) return
  await sendMail({
    to: p.cliente_email,
    ...mails.extraBudgetHousehold({ nombre: p.cliente_nombre, numero: numeroPedido(p.numero), monto: pesos(monto), detalle, link: `${appUrl()}/pedido/${p.id}` }),
  })
}
