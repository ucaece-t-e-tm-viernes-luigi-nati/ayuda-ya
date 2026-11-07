'use server'

import { redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import type { FormState } from '@/components/forms'
import { audit } from '@/lib/audit'
import { getCurrentUser } from '@/lib/auth'
import { BARRIOS, FRANJA_IDS } from '@/lib/catalogo'
import { getServicioActivo } from '@/lib/data/servicios'
import { UUID_RE } from '@/lib/data/pedidos'
import { q, q1 } from '@/lib/db'
import { addDays, dayKeyAR } from '@/lib/dates'
import { registrarEvento } from '@/lib/eventos'
import { getPerfilHogar } from '@/lib/guards'
import { avisarNuevoPedido } from '@/lib/notificaciones'

// Acciones del HOGAR sobre sus pedidos. Cada una re-lee la sesión y verifica que el pedido sea suyo.

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? '').trim().slice(0, max)

async function usuario(next: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(next)}`)
  return user
}

export async function crearPedido(_: FormState, fd: FormData): Promise<FormState> {
  const user = await usuario('/pedido/nuevo')
  const perfil = await getPerfilHogar(user.id)
  if (!perfil) redirect('/completar-datos?next=/pedido/nuevo')

  const codigo = str(fd, 'servicio', 10)
  const problema = str(fd, 'problema', 1500)
  const barrio = str(fd, 'barrio', 60)
  const direccion = str(fd, 'direccion', 160)
  const dia = str(fd, 'dia', 10)
  const franja = str(fd, 'franja', 10)
  const origenRaw = str(fd, 'origen', 20)
  const origen = ['asistente_ia', 'palabras_clave'].includes(origenRaw) ? origenRaw : 'tarifario'
  const hoy = dayKeyAR()

  const servicio = await getServicioActivo(codigo)
  if (!servicio) return { error: 'Elegí un servicio del tarifario.' }
  if (problema.length < 10) return { error: 'Contanos un poco más qué está pasando (al menos una frase).' }
  if (!(BARRIOS as readonly string[]).includes(barrio)) return { error: 'Elegí el barrio.' }
  if (direccion.length < 4) return { error: 'Indicá la dirección.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hoy || dia > addDays(hoy, 60)) return { error: 'Elegí un día entre hoy y los próximos 60 días.' }
  if (!FRANJA_IDS.includes(franja)) return { error: 'Elegí una franja horaria.' }

  // El precio cerrado SIEMPRE sale de la base (nunca del formulario).
  const row = await q1<{ id: string }>(
    `INSERT INTO pedido (cliente_user_id, servicio_codigo, servicio_nombre, rubro, precio_cerrado, problema, barrio, direccion,
                         contacto_nombre, contacto_celular, dia, franja, origen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date, $12, $13) RETURNING id`,
    [user.id, servicio.codigo, servicio.nombre, servicio.rubro, servicio.precio, problema, barrio, direccion, user.name, perfil.celular, dia, franja, origen],
  )
  if (!row) return { error: 'No pudimos guardar el pedido. Probá de nuevo.' }
  await registrarEvento('pedido_enviado', { userId: user.id, pedidoId: row.id, datos: { servicio: servicio.codigo, origen } })
  await avisarNuevoPedido(row.id)
  redirect(`/pedido/${row.id}?nuevo=1`)
}

export async function cancelarPedido(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await usuario(`/pedido/${pedidoId}`)
  if (!UUID_RE.test(pedidoId)) return { error: 'Pedido inválido.' }
  const motivo = str(fd, 'motivo', 300) || null
  const row = await q1<{ prestador_id: string | null }>(
    `UPDATE pedido SET estado = 'cancelado', cancelado_at = now(), cancelado_por = 'cliente', motivo_cancelacion = $3, updated_at = now()
      WHERE id = $1 AND cliente_user_id = $2 AND estado IN ('nuevo','asignado') RETURNING prestador_id`,
    [pedidoId, user.id, motivo],
  )
  if (!row) return { error: 'Este pedido ya no se puede cancelar desde acá. Escribinos por WhatsApp.' }
  await audit({ id: user.id, role: 'hogar' }, 'pedido.cancel', { clientId: row.prestador_id, entity: 'pedido', entityId: pedidoId, detail: { motivo } })
  refresh()
  return { ok: true, message: 'Cancelamos el pedido.' }
}

export async function responderPresupuesto(pedidoId: string, presupuestoId: string, aprobar: boolean) {
  const user = await usuario(`/pedido/${pedidoId}`)
  if (!UUID_RE.test(pedidoId) || !UUID_RE.test(presupuestoId)) return
  const row = await q1<{ monto: number; prestador_id: string }>(
    `UPDATE presupuesto_adicional a SET estado = $3, respondido_at = now()
       FROM pedido p
      WHERE a.id = $2 AND a.pedido_id = $1 AND p.id = a.pedido_id AND p.cliente_user_id = $4 AND a.estado = 'pendiente'
        AND p.estado IN ('asignado','en_curso')
      RETURNING a.monto, a.prestador_id`,
    [pedidoId, presupuestoId, aprobar ? 'aprobado' : 'rechazado', user.id],
  )
  if (row) {
    await audit({ id: user.id, role: 'hogar' }, aprobar ? 'presupuesto.aprobar' : 'presupuesto.rechazar', {
      clientId: row.prestador_id,
      entity: 'presupuesto_adicional',
      entityId: presupuestoId,
      detail: { monto: row.monto },
    })
  }
  refresh()
}

export async function calificarPedido(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await usuario(`/pedido/${pedidoId}`)
  if (!UUID_RE.test(pedidoId)) return { error: 'Pedido inválido.' }
  const puntaje = Number(str(fd, 'puntaje', 1))
  const comentario = str(fd, 'comentario', 600) || null
  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) return { error: 'Elegí de 1 a 5 estrellas.' }
  const rows = await q(
    `INSERT INTO calificacion (pedido_id, prestador_id, cliente_user_id, puntaje, comentario)
     SELECT id, prestador_id, cliente_user_id, $3, $4 FROM pedido WHERE id = $1 AND cliente_user_id = $2 AND estado = 'terminado'
     ON CONFLICT (pedido_id) DO NOTHING RETURNING pedido_id`,
    [pedidoId, user.id, puntaje, comentario],
  )
  if (!rows.length) return { error: 'Este pedido ya fue calificado o todavía no está terminado.' }
  refresh()
  return { ok: true, message: '¡Gracias por calificar!' }
}
