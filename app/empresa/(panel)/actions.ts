'use server'

import { refresh } from 'next/cache'
import type { FormState } from '@/components/forms'
import { audit } from '@/lib/audit'
import { BARRIOS, DIAS_SEMANA, FRANJA_IDS } from '@/lib/catalogo'
import { UUID_RE } from '@/lib/data/pedidos'
import { q, q1, tx } from '@/lib/db'
import { dayKeyAR, pesos } from '@/lib/dates'
import { requirePrestadorWrite } from '@/lib/guards'
import { avisarNuevoPedido, avisarPresupuesto, avisarTerminado } from '@/lib/notificaciones'

// Acciones del PRESTADOR. El client_id SIEMPRE sale de la sesión (requirePrestadorWrite), nunca del formulario.
// Cada UPDATE filtra por prestador_id = client de la sesión y por el estado esperado.

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? '').trim().slice(0, max)
const actor = (ctx: { user: { id: string } }) => ({ id: ctx.user.id, role: 'prestador' })

export async function aceptarPedido(pedidoId: string) {
  const { ctx, error } = await requirePrestadorWrite('pedidos.manage')
  if (error || !UUID_RE.test(pedidoId)) return
  const row = await q1(
    `UPDATE pedido SET aceptado_at = now(), updated_at = now()
      WHERE id = $1 AND prestador_id = $2 AND estado = 'asignado' AND aceptado_at IS NULL RETURNING id`,
    [pedidoId, ctx.clientId],
  )
  if (row) await audit(actor(ctx), 'pedido.accept', { clientId: ctx.clientId, entity: 'pedido', entityId: pedidoId })
  refresh()
}

export async function rechazarPedido(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { ctx, error } = await requirePrestadorWrite('pedidos.manage')
  if (error) return { error }
  if (!UUID_RE.test(pedidoId)) return { error: 'Pedido inválido.' }
  const motivo = str(fd, 'motivo', 300)
  if (motivo.length < 3) return { error: 'Contanos brevemente por qué no podés tomarlo.' }
  // Vuelve a "nuevo" para que el equipo lo reasigne.
  const row = await q1(
    `UPDATE pedido SET estado = 'nuevo', prestador_id = NULL, asignado_at = NULL, aceptado_at = NULL, comision_pct = NULL, updated_at = now()
      WHERE id = $1 AND prestador_id = $2 AND estado = 'asignado' AND aceptado_at IS NULL RETURNING id`,
    [pedidoId, ctx.clientId],
  )
  if (!row) return { error: 'Este pedido ya no se puede rechazar.' }
  await audit(actor(ctx), 'pedido.reject_assignment', { clientId: ctx.clientId, entity: 'pedido', entityId: pedidoId, detail: { motivo } })
  await avisarNuevoPedido(pedidoId)
  refresh()
  return { ok: true, message: 'Listo, avisamos al equipo para reasignarlo.' }
}

export async function iniciarPedido(pedidoId: string) {
  const { ctx, error } = await requirePrestadorWrite('pedidos.manage')
  if (error || !UUID_RE.test(pedidoId)) return
  const row = await q1(
    `UPDATE pedido SET estado = 'en_curso', en_curso_at = now(), updated_at = now()
      WHERE id = $1 AND prestador_id = $2 AND estado = 'asignado' AND aceptado_at IS NOT NULL RETURNING id`,
    [pedidoId, ctx.clientId],
  )
  if (row) await audit(actor(ctx), 'pedido.start', { clientId: ctx.clientId, entity: 'pedido', entityId: pedidoId })
  refresh()
}

export async function terminarPedido(pedidoId: string) {
  const { ctx, error } = await requirePrestadorWrite('pedidos.manage')
  if (error || !UUID_RE.test(pedidoId)) return
  const hoy = dayKeyAR()
  const row = await tx(async (db) => {
    // Los presupuestos que el cliente no respondió quedan rechazados (no se cobran).
    await db.query(
      `UPDATE presupuesto_adicional SET estado = 'rechazado', respondido_at = now()
        WHERE pedido_id = $1 AND prestador_id = $2 AND estado = 'pendiente'`,
      [pedidoId, ctx.clientId],
    )
    // Comisión = % del precio final (precio cerrado + adicionales aprobados). 0 si el prestador está en período de prueba.
    const { rows } = await db.query<{ comision_monto: number }>(
      `UPDATE pedido p SET estado = 'terminado', terminado_at = now(), updated_at = now(),
              comision_monto = CASE WHEN c.trial_ends_at IS NOT NULL AND c.trial_ends_at >= $3::date THEN 0
                                    ELSE round((p.precio_cerrado + coalesce((SELECT sum(monto) FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0))
                                               * coalesce(p.comision_pct, c.commission_pct) / 100)::int END
         FROM client c
        WHERE p.id = $1 AND p.prestador_id = $2 AND c.id = p.prestador_id AND p.estado = 'en_curso'
        RETURNING p.comision_monto`,
      [pedidoId, ctx.clientId, hoy],
    )
    return rows[0] ?? null
  })
  if (row) {
    await audit(actor(ctx), 'pedido.finish', { clientId: ctx.clientId, entity: 'pedido', entityId: pedidoId, detail: { comision: row.comision_monto } })
    await avisarTerminado(pedidoId)
  }
  refresh()
}

export async function proponerPresupuesto(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { ctx, error } = await requirePrestadorWrite('pedidos.manage')
  if (error) return { error }
  if (!UUID_RE.test(pedidoId)) return { error: 'Pedido inválido.' }
  const monto = Math.round(Number(str(fd, 'monto', 12).replace(/\./g, '').replace(',', '.')))
  const detalle = str(fd, 'detalle', 800)
  if (!Number.isFinite(monto) || monto < 500 || monto > 5_000_000) return { error: 'Indicá un monto válido en pesos.' }
  if (detalle.length < 10) return { error: 'Explicá qué incluye el adicional (materiales, tareas extra).' }
  const pedido = await q1(
    `SELECT 1 FROM pedido WHERE id = $1 AND prestador_id = $2 AND ((estado = 'asignado' AND aceptado_at IS NOT NULL) OR estado = 'en_curso')`,
    [pedidoId, ctx.clientId],
  )
  if (!pedido) return { error: 'Solo podés proponer adicionales en pedidos aceptados o en curso.' }
  const pendiente = await q1(`SELECT 1 FROM presupuesto_adicional WHERE pedido_id = $1 AND estado = 'pendiente'`, [pedidoId])
  if (pendiente) return { error: 'Ya hay un adicional esperando la respuesta del cliente.' }
  await q(`INSERT INTO presupuesto_adicional (pedido_id, prestador_id, monto, detalle, created_by) VALUES ($1, $2, $3, $4, $5)`, [
    pedidoId,
    ctx.clientId,
    monto,
    detalle,
    ctx.user.id,
  ])
  await audit(actor(ctx), 'presupuesto.create', { clientId: ctx.clientId, entity: 'pedido', entityId: pedidoId, detail: { monto } })
  await avisarPresupuesto(pedidoId, monto, detalle)
  refresh()
  return { ok: true, message: `Enviamos el adicional de ${pesos(monto)} al cliente. No lo hagas hasta que lo apruebe.` }
}

export async function actualizarPerfil(_: FormState, fd: FormData): Promise<FormState> {
  const { ctx, error } = await requirePrestadorWrite('perfil.edit')
  if (error) return { error }
  const phone = str(fd, 'phone', 40)
  const zonas = fd.getAll('zonas').map(String).filter((z) => (BARRIOS as readonly string[]).includes(z) && z !== 'Otro')
  const dias = fd.getAll('dias').map(String).filter((d) => (DIAS_SEMANA as readonly string[]).includes(d))
  const franjas = fd.getAll('franjas').map(String).filter((f) => FRANJA_IDS.includes(f))
  if (phone.replace(/\D/g, '').length < 8) return { error: 'Ingresá un WhatsApp válido.' }
  if (!zonas.length) return { error: 'Elegí al menos un barrio.' }
  if (!dias.length || !franjas.length) return { error: 'Elegí días y franjas de disponibilidad.' }
  await q(
    `UPDATE client SET phone = $2, zonas = $3, data = data || $4::jsonb, updated_at = now() WHERE id = $1`,
    [ctx.clientId, phone, zonas, JSON.stringify({ dias, franjas, urgencias: fd.get('urgencias') === 'on', vehiculo: fd.get('vehiculo') === 'on', herramientas: str(fd, 'herramientas', 300), seguro: str(fd, 'seguro', 200) })],
  )
  await audit(actor(ctx), 'client.profile_update', { clientId: ctx.clientId, entity: 'client', entityId: ctx.clientId, detail: { zonas, dias, franjas } })
  refresh()
  return { ok: true, message: 'Perfil actualizado.' }
}
