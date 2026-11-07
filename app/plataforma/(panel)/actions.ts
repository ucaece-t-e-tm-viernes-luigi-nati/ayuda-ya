'use server'

import { redirect } from 'next/navigation'
import { refresh, updateTag } from 'next/cache'
import type { FormState } from '@/components/forms'
import { STATUS_LABELS } from '@/components/panel/ui'
import { audit } from '@/lib/audit'
import { MEDIOS_PAGO } from '@/lib/billing'
import { RUBRO_IDS } from '@/lib/catalogo'
import { UUID_RE } from '@/lib/data/pedidos'
import { TARIFARIO_TAG } from '@/lib/data/servicios'
import { q, q1, tx } from '@/lib/db'
import { addDays, dayKeyAR, formatDate, formatDateTime, formatMoney, periodLabel } from '@/lib/dates'
import { appUrl } from '@/lib/env'
import { requireSuperadmin } from '@/lib/guards'
import { sendMail } from '@/lib/mail'
import { mails } from '@/lib/mail-templates'
import { avisarAsignacion } from '@/lib/notificaciones'
import type { Application } from '@/lib/onboarding'
import { ASSIGNABLE_STATUSES } from '@/lib/permissions'
import { createCredentialUser, findUserByEmail, generateTempPassword, isValidEmail, normalizeEmail, randomToken, setUserPassword, TEMP_PASSWORD_HOURS } from '@/lib/users'

// Cada action vuelve a verificar que quien llama es superadmin (requireSuperadmin → 404 si no).

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? '').trim().slice(0, max)
const actor = (u: { id: string }) => ({ id: u.id, role: 'superadmin' })

function slugify(text: string) {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'prestador'
  )
}

// ---------------- Solicitudes de alta ----------------

/** Aprobar: crea el prestador (client) + owner con contraseña temporal, fija comisión, prueba y día de pago. Todo en una transacción. */
export async function approveApplication(applicationId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const planId = str(fd, 'plan_id', 40)
  const commission = Number(str(fd, 'commission_pct', 6).replace(',', '.'))
  const trialDays = Number(str(fd, 'trial_days', 3) || 0)
  const billingDay = Number(str(fd, 'billing_day', 2))
  if (!Number.isFinite(commission) || commission < 0 || commission > 50) return { error: 'Comisión inválida (0 a 50%).' }
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) return { error: 'Días de prueba inválidos.' }
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) return { error: 'El día de pago tiene que ser entre 1 y 28.' }
  if (fd.get('verificado') !== 'on') return { error: 'Confirmá que verificaste identidad y matrícula antes de aprobar.' }
  const plan = await q1<{ id: string; name: string; monthly_price_cents: string; currency: string }>(
    `SELECT id, name, monthly_price_cents::text, currency FROM plan WHERE id = $1`,
    [planId],
  )
  if (!plan) return { error: 'Elegí las condiciones (plan).' }

  const today = dayKeyAR()
  const trialEnds = trialDays > 0 ? addDays(today, trialDays) : null
  // Primer vencimiento posible: el día de pago del mes que viene (liquida el mes en curso).
  const [y, m] = today.split('-').map(Number)
  const nextDue = new Date(Date.UTC(y, m, billingDay)).toISOString().slice(0, 10)
  let password: string | null = null
  let app: Application | null = null
  let clientName = ''

  try {
    await tx(async (db) => {
      const { rows } = await db.query<Application>(`SELECT * FROM client_application WHERE id = $1 AND status = 'pending_review' FOR UPDATE`, [applicationId])
      app = rows[0] ?? null
      if (!app) throw new Error('not_pending')
      const d = app.data ?? {}
      clientName = d.name ?? app.contact_name ?? 'Prestador'

      let slug = slugify(clientName)
      const taken = await db.query(`SELECT slug FROM client WHERE slug = $1 OR slug LIKE $1 || '-%'`, [slug])
      if (taken.rowCount) slug = `${slug}-${taken.rowCount + 1}`

      const client = await db.query<{ id: string }>(
        `INSERT INTO client (slug, name, legal_name, tax_id, city, phone, contact_email, rubros, zonas, matricula_tipo, matricula_numero,
                             verificacion, verificado_at, data, plan_id, monthly_price_cents, commission_pct, currency, status, trial_ends_at, billing_day, next_due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'verificado',now(),$12::jsonb,$13,$14,$15,$16,$17,$18::date,$19,$20::date) RETURNING id`,
        [
          slug,
          clientName,
          app.contact_name,
          d.tax_id || null,
          d.city || 'Mar del Plata',
          app.phone,
          app.email,
          d.rubros ?? [],
          d.zonas ?? [],
          d.matricula_tipo ?? null,
          d.matricula_numero || null,
          JSON.stringify({
            dni: d.dni,
            monotributo: d.monotributo,
            address: d.address,
            experiencia: d.experiencia,
            dias: d.dias,
            franjas: d.franjas,
            urgencias: d.urgencias,
            vehiculo: d.vehiculo,
            herramientas: d.herramientas,
            seguro: d.seguro,
          }),
          plan.id,
          Number(plan.monthly_price_cents),
          commission,
          plan.currency,
          trialEnds ? 'trial' : 'active',
          trialEnds,
          billingDay,
          nextDue,
        ],
      )
      const clientId = client.rows[0].id

      const existing = await findUserByEmail(app.email, db)
      let userId = existing?.id
      if (!userId) {
        password = generateTempPassword()
        userId = await createCredentialUser(db, { email: app.email, name: app.contact_name ?? clientName, password, temporary: true, emailVerified: true })
      }
      await db.query(`INSERT INTO client_member (client_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING`, [clientId, userId])
      await db.query(
        `UPDATE client_application SET status = 'approved', reviewed_by = $2, reviewed_at = now(), review_reason = NULL, client_id = $3, updated_at = now() WHERE id = $1`,
        [applicationId, admin.id, clientId],
      )
      await db.query(
        `INSERT INTO audit_log (actor_user_id, actor_role, client_id, action, entity, entity_id, detail) VALUES ($1, 'superadmin', $2, 'application.approve', 'client_application', $3, $4)`,
        [admin.id, clientId, applicationId, JSON.stringify({ plan: plan.id, commission, trialDays, billingDay, newUser: !existing })],
      )
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'not_pending') return { error: 'La solicitud ya no está pendiente.' }
    throw error
  }

  const a = app as Application | null
  if (a) {
    await sendMail({
      to: a.email,
      ...mails.approved({
        nombre: a.contact_name ?? '',
        empresa: clientName,
        link: `${appUrl()}/empresa/ingresar`,
        email: a.email,
        password,
        venceClave: formatDateTime(new Date(Date.now() + TEMP_PASSWORD_HOURS * 3600 * 1000)),
        plan: plan.name,
        comision: `${commission}%`,
        abono: Number(plan.monthly_price_cents) > 0 ? formatMoney(plan.monthly_price_cents, plan.currency) : null,
        finPrueba: trialEnds ? formatDate(trialEnds) : null,
        diaPago: billingDay,
        mediosPago: MEDIOS_PAGO,
      }),
      secrets: password ? [password] : [],
    })
  }
  redirect(`/plataforma/solicitudes/${applicationId}`)
}

/** Rechazo con motivo: "puede corregir" (changes_requested, mail con link) o "definitivo" (rejected). */
export async function reviewApplication(applicationId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const reason = str(fd, 'reason', 2000)
  const mode = str(fd, 'mode') === 'reject' ? 'rejected' : 'changes_requested'
  if (reason.length < 5) return { error: 'Escribí el motivo (es obligatorio y le llega al prestador).' }

  const app = await q1<Application & { kind: string }>(
    `UPDATE client_application a SET status = $2, review_reason = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now()
       FROM client_invite i
      WHERE a.id = $1 AND a.status = 'pending_review' AND i.token = a.invite_token
      RETURNING a.*, i.kind`,
    [applicationId, mode, reason, admin.id],
  )
  if (!app) return { error: 'La solicitud ya no está pendiente.' }
  const empresa = app.data?.name ?? app.contact_name ?? 'tu alta'
  if (mode === 'changes_requested') {
    const link = `${appUrl()}/empresa/alta/${app.invite_token}?corregir=1${app.kind === 'campaign' ? `&clave=${app.resume_key}` : ''}`
    await sendMail({ to: app.email, ...mails.changesRequested({ nombre: app.contact_name ?? '', empresa, motivo: reason, link }) })
  } else {
    await sendMail({ to: app.email, ...mails.rejected({ nombre: app.contact_name ?? '', empresa, motivo: reason }) })
  }
  await audit(actor(admin), mode === 'rejected' ? 'application.reject' : 'application.request_changes', { entity: 'client_application', entityId: applicationId, detail: { reason } })
  redirect(`/plataforma/solicitudes/${applicationId}`)
}

// ---------------- Prestadores ----------------

const ALLOWED_STATUS = ['trial', 'active', 'past_due', 'paused', 'cancelled']
const DETALLE_ESTADO: Record<string, string> = {
  active: 'Ya podés recibir pedidos nuevos.',
  paused: 'Mientras esté pausada no te asignamos pedidos nuevos. Los que ya tenés en curso los podés terminar.',
  cancelled: 'La cuenta quedó dada de baja: no vas a recibir pedidos nuevos.',
}

export async function setClientStatus(clientId: string, status: string) {
  const admin = await requireSuperadmin()
  if (!ALLOWED_STATUS.includes(status) || !UUID_RE.test(clientId)) return
  const row = await q1<{ name: string; prev: string; emails: string[] | null }>(
    `WITH prev AS (SELECT status FROM client WHERE id = $1)
     UPDATE client SET status = $2, updated_at = now() WHERE id = $1
     RETURNING name, (SELECT status FROM prev) AS prev,
       (SELECT array_agg(u.email) FROM client_member m JOIN "user" u ON u.id = m.user_id WHERE m.client_id = $1 AND m.role = 'owner') AS emails`,
    [clientId, status],
  )
  if (!row) return
  await audit(actor(admin), `client.status.${status}`, { clientId, entity: 'client', entityId: clientId, detail: { from: row.prev, to: status } })
  if (row.prev !== status) {
    for (const to of row.emails ?? []) {
      await sendMail({ to, ...mails.statusChanged({ empresa: row.name, estado: STATUS_LABELS[status] ?? status, detalle: DETALLE_ESTADO[status] ?? '' }) })
    }
  }
  refresh()
}

export async function setVerificacion(clientId: string, estado: string) {
  const admin = await requireSuperadmin()
  if (!['pendiente', 'verificado', 'observado'].includes(estado) || !UUID_RE.test(clientId)) return
  await q(
    `UPDATE client SET verificacion = $2, verificado_at = CASE WHEN $2 = 'verificado' THEN now() ELSE verificado_at END, updated_at = now() WHERE id = $1`,
    [clientId, estado],
  )
  await audit(actor(admin), 'client.verification', { clientId, entity: 'client', entityId: clientId, detail: { estado } })
  refresh()
}

export async function updateCondiciones(clientId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  if (!UUID_RE.test(clientId)) return { error: 'Prestador inválido.' }
  const commission = Number(str(fd, 'commission_pct', 6).replace(',', '.'))
  const billingDay = Number(str(fd, 'billing_day', 2))
  const rubros = fd.getAll('rubros').map(String).filter((r) => RUBRO_IDS.includes(r))
  if (!Number.isFinite(commission) || commission < 0 || commission > 50) return { error: 'Comisión inválida (0 a 50%).' }
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) return { error: 'El día de pago tiene que ser entre 1 y 28.' }
  if (!rubros.length) return { error: 'Elegí al menos un rubro.' }
  const matTipo = str(fd, 'matricula_tipo', 30)
  if (rubros.includes('gas') && matTipo !== 'gasista') return { error: 'Para gas la matrícula tiene que ser de gasista.' }
  await q(
    `UPDATE client SET commission_pct = $2, billing_day = $3, rubros = $4, matricula_tipo = $5, matricula_numero = $6, updated_at = now() WHERE id = $1`,
    [clientId, commission, billingDay, rubros, matTipo || null, str(fd, 'matricula_numero', 40) || null],
  )
  await audit(actor(admin), 'client.conditions_change', { clientId, entity: 'client', entityId: clientId, detail: { commission, billingDay, rubros, matTipo } })
  refresh()
  return { ok: true, message: 'Condiciones actualizadas. Los pedidos ya asignados mantienen su comisión.' }
}

/** Registra a mano el pago de una liquidación y reactiva la cuenta si no le quedan deudas vencidas. */
export async function registerPayment(clientId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const paymentId = str(fd, 'payment_id', 40)
  const method = str(fd, 'method', 40) || 'transferencia'
  const notes = str(fd, 'notes', 300) || null
  if (!UUID_RE.test(clientId) || !UUID_RE.test(paymentId)) return { error: 'Elegí la liquidación.' }

  const result = await tx(async (db) => {
    const { rows } = await db.query<{ period: string; amount_cents: string; currency: string }>(
      `UPDATE payment SET status = 'paid', method = $3, paid_at = now(), notes = $4, registered_by = $5
        WHERE id = $1 AND client_id = $2 AND status IN ('pending','overdue') RETURNING period, amount_cents::text, currency`,
      [paymentId, clientId, method, notes, admin.id],
    )
    if (!rows[0]) return null
    const { rows: c } = await db.query<{ name: string; status: string; emails: string[] | null }>(
      `SELECT c.name, c.status, (SELECT array_agg(u.email) FROM client_member m JOIN "user" u ON u.id = m.user_id WHERE m.client_id = c.id AND m.role = 'owner') AS emails
         FROM client c WHERE c.id = $1`,
      [clientId],
    )
    const { rowCount } = await db.query(`SELECT 1 FROM payment WHERE client_id = $1 AND status = 'overdue'`, [clientId])
    let newStatus = c[0].status
    if (!rowCount && ['past_due', 'paused'].includes(c[0].status)) {
      newStatus = 'active'
      await db.query(`UPDATE client SET status = 'active', updated_at = now() WHERE id = $1`, [clientId])
    }
    return { ...rows[0], ...c[0], newStatus }
  })
  if (!result) return { error: 'Esa liquidación ya estaba paga o no existe.' }
  await audit(actor(admin), 'payment.register', { clientId, entity: 'payment', entityId: result.period, detail: { amount: result.amount_cents, method, from: result.status, to: result.newStatus } })
  for (const to of result.emails ?? []) {
    await sendMail({ to, ...mails.paymentRegistered({ empresa: result.name, monto: formatMoney(result.amount_cents, result.currency), periodo: periodLabel(result.period) }) })
  }
  refresh()
  return { ok: true, message: `Pago registrado${result.newStatus !== result.status ? ' y cuenta reactivada' : ''}.` }
}

/** Genera una nueva contraseña temporal para el prestador (p. ej. si la anterior venció) y se la manda por mail. */
export async function resendAccess(clientId: string, userId: string) {
  const admin = await requireSuperadmin()
  const row = await q1<{ email: string; name: string }>(
    `SELECT u.email, c.name FROM client_member m JOIN "user" u ON u.id = m.user_id JOIN client c ON c.id = m.client_id WHERE m.client_id = $1 AND m.user_id = $2`,
    [clientId, userId],
  )
  if (!row) return
  const password = generateTempPassword()
  await tx((db) => setUserPassword(db, userId, password, { temporary: true }))
  await sendMail({
    to: row.email,
    ...mails.resetAccess({ empresa: row.name, link: `${appUrl()}/empresa/ingresar`, email: row.email, password, venceClave: formatDateTime(new Date(Date.now() + TEMP_PASSWORD_HOURS * 3600 * 1000)) }),
    secrets: [password],
  })
  await audit(actor(admin), 'member.reset_access', { clientId, entity: 'user', entityId: userId })
  refresh()
}

// ---------------- Pedidos ----------------

/** Asignación manual: solo a prestadores verificados, activos (o en prueba), del rubro y que trabajen en el barrio. */
export async function asignarPedido(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const clientId = str(fd, 'prestador_id', 40)
  if (!UUID_RE.test(pedidoId) || !UUID_RE.test(clientId)) return { error: 'Elegí un prestador.' }
  const forzarZona = fd.get('forzar_zona') === 'on'
  const row = await q1<{ id: string }>(
    `UPDATE pedido p SET estado = 'asignado', prestador_id = c.id, comision_pct = c.commission_pct, asignado_at = now(), aceptado_at = NULL, updated_at = now()
       FROM client c
      WHERE p.id = $1 AND c.id = $2 AND p.estado = 'nuevo'
        AND c.verificacion = 'verificado' AND c.status = ANY($3) AND p.rubro = ANY(c.rubros)
        AND ($4 OR p.barrio = ANY(c.zonas))
      RETURNING p.id`,
    [pedidoId, clientId, [...ASSIGNABLE_STATUSES], forzarZona],
  )
  if (!row) return { error: 'No se pudo asignar: el pedido ya no está nuevo o el prestador no cumple (verificado, activo, rubro y zona).' }
  await audit(actor(admin), 'pedido.assign', { clientId, entity: 'pedido', entityId: pedidoId, detail: { forzarZona } })
  await avisarAsignacion(pedidoId)
  refresh()
  return { ok: true, message: 'Pedido asignado. Avisamos por mail al prestador y al cliente.' }
}

export async function cancelarPedidoAdmin(pedidoId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const motivo = str(fd, 'motivo', 300)
  if (motivo.length < 3) return { error: 'Escribí el motivo.' }
  const row = await q1<{ prestador_id: string | null }>(
    `UPDATE pedido SET estado = 'cancelado', cancelado_at = now(), cancelado_por = 'ayudaya', motivo_cancelacion = $2, updated_at = now()
      WHERE id = $1 AND estado IN ('nuevo','asignado','en_curso') RETURNING prestador_id`,
    [pedidoId, motivo],
  )
  if (!row) return { error: 'El pedido ya está terminado o cancelado.' }
  await audit(actor(admin), 'pedido.cancel', { clientId: row.prestador_id, entity: 'pedido', entityId: pedidoId, detail: { motivo } })
  refresh()
  return { ok: true, message: 'Pedido cancelado.' }
}

// ---------------- Tarifario ----------------

export async function saveServicio(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const codigo = str(fd, 'codigo', 5).toUpperCase()
  const rubro = str(fd, 'rubro', 20)
  const nombre = str(fd, 'nombre', 100)
  const descripcion = str(fd, 'descripcion', 300)
  const precio = Math.round(Number(str(fd, 'precio', 12).replace(/\./g, '').replace(',', '.')))
  const orden = Number(str(fd, 'orden', 3) || 0)
  const activo = fd.get('activo') === 'on'
  if (!/^[A-Z]{2}-\d{2}$/.test(codigo)) return { error: 'El código tiene que ser como PL-05 (2 letras, guion, 2 números).' }
  if (!RUBRO_IDS.includes(rubro)) return { error: 'Elegí el rubro.' }
  if (nombre.length < 3) return { error: 'Poné el nombre del servicio.' }
  if (!Number.isFinite(precio) || precio < 1000 || precio > 10_000_000) return { error: 'Precio inválido (en pesos, sin centavos).' }
  const prev = await q1<{ precio: number }>(`SELECT precio FROM servicio WHERE codigo = $1`, [codigo])
  await q(
    `INSERT INTO servicio (codigo, rubro, nombre, descripcion, precio, activo, orden) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (codigo) DO UPDATE SET rubro = $2, nombre = $3, descripcion = $4, precio = $5, activo = $6, orden = $7, updated_at = now()`,
    [codigo, rubro, nombre, descripcion, precio, activo, Number.isFinite(orden) ? orden : 0],
  )
  await audit(actor(admin), prev ? 'servicio.update' : 'servicio.create', { entity: 'servicio', entityId: codigo, detail: { precio, prev: prev?.precio ?? null, activo } })
  updateTag(TARIFARIO_TAG)
  refresh()
  return { ok: true, message: `Servicio ${codigo} guardado. Los pedidos ya hechos mantienen su precio cerrado.` }
}

// ---------------- Invitaciones ----------------

export async function createInvite(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireSuperadmin()
  const kind = str(fd, 'kind') === 'campaign' ? 'campaign' : 'personal'
  const token = randomToken(24)

  if (kind === 'personal') {
    const email = normalizeEmail(fd.get('email'))
    const name = str(fd, 'name', 80) || null
    if (!isValidEmail(email)) return { error: 'Ingresá un correo válido.' }
    await q(`INSERT INTO client_invite (token, kind, email, label, expires_at, created_by) VALUES ($1, 'personal', $2, $3, now() + interval '14 days', $4)`, [token, email, name, admin.id])
    const link = `${appUrl()}/empresa/alta/${token}`
    if (fd.get('send') === 'on') {
      await sendMail({ to: email, ...mails.invite({ link, expires: formatDate(addDays(dayKeyAR(), 14)), name }) })
    }
    await audit(actor(admin), 'invite.create', { entity: 'client_invite', detail: { kind, email, sent: fd.get('send') === 'on' } })
    refresh()
    return { ok: true, message: fd.get('send') === 'on' ? `Invitación enviada a ${email}.` : 'Invitación creada. Copiá el link de la tabla.' }
  }

  const label = str(fd, 'label', 80) || 'Campaña'
  const days = Number(str(fd, 'days', 3) || 30)
  const maxUsesRaw = str(fd, 'max_uses', 5)
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null
  if (!Number.isInteger(days) || days < 1 || days > 365) return { error: 'La vigencia tiene que ser entre 1 y 365 días.' }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: 'El cupo tiene que ser un número positivo.' }
  await q(
    `INSERT INTO client_invite (token, kind, label, max_uses, expires_at, created_by) VALUES ($1, 'campaign', $2, $3, now() + make_interval(days => $4::int), $5)`,
    [token, label, maxUses, days, admin.id],
  )
  await audit(actor(admin), 'invite.create', { entity: 'client_invite', detail: { kind, label, days, maxUses } })
  refresh()
  return { ok: true, message: 'Link de campaña creado. Copialo de la tabla y compartilo por mail o WhatsApp.' }
}

export async function revokeInvite(token: string) {
  const admin = await requireSuperadmin()
  await q(`UPDATE client_invite SET revoked_at = now() WHERE token = $1 AND revoked_at IS NULL`, [token])
  await audit(actor(admin), 'invite.revoke', { entity: 'client_invite', detail: { token: `${token.slice(0, 6)}…` } })
  refresh()
}

export async function resendInvite(token: string) {
  const admin = await requireSuperadmin()
  const invite = await q1<{ email: string | null; label: string | null; expires_at: Date }>(
    `SELECT email, label, expires_at FROM client_invite WHERE token = $1 AND kind = 'personal' AND revoked_at IS NULL AND expires_at > now() AND uses = 0`,
    [token],
  )
  if (!invite?.email) return
  await sendMail({ to: invite.email, ...mails.invite({ link: `${appUrl()}/empresa/alta/${token}`, expires: formatDate(invite.expires_at), name: invite.label }) })
  await audit(actor(admin), 'invite.resend', { entity: 'client_invite', detail: { email: invite.email } })
  refresh()
}
