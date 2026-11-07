import 'server-only'
import { audit } from './audit'
import { q } from './db'
import { addDays, dayKeyAR, formatDate, formatMoney, periodLabel, pesos, previousPeriod } from './dates'
import { pauseAfterDays } from './env'
import { sendMail } from './mail'
import { mails } from './mail-templates'

// Cobro de comisiones de AyudaYa (modelo intermediario, sin abono):
//   - Cada pedido terminado guarda su comision_monto (15% del precio final; 0 si el prestador estaba en prueba).
//   - A principio de cada mes se emite la liquidación del mes anterior (payment pending) con vencimiento el
//     día de pago (billing_day) del mes en curso. Si no hubo trabajos, no se emite nada.
//   - Aviso 3 días antes, vencida → past_due, y a los PAUSE_AFTER_DAYS días → paused (no recibe pedidos nuevos).
//   - El pago lo registra a mano el superadmin (/plataforma/prestadores/[id]).

export const MEDIOS_PAGO = 'transferencia bancaria (te pasamos el CBU por este medio) o efectivo'
const TZ = 'America/Argentina/Buenos_Aires'

type Owner = { id: string; name: string; emails: string[] | null }
const OWNERS = `(SELECT array_agg(u.email) FROM client_member m JOIN "user" u ON u.id = m.user_id WHERE m.client_id = c.id AND m.role = 'owner') AS emails`

async function notify(emails: string[] | null, mail: { subject: string; html: string; text: string; template: string }) {
  for (const to of emails ?? []) await sendMail({ to, ...mail })
}

async function alreadyDone(clientId: string, action: string, key: string) {
  const rows = await q(`SELECT 1 FROM audit_log WHERE client_id = $1 AND action = $2 AND detail->>'key' = $3 LIMIT 1`, [clientId, action, key])
  return rows.length > 0
}

/** Proceso diario (cron de Vercel). Idempotente: si corre dos veces el mismo día no duplica liquidaciones ni mails. */
export async function runDailyBilling(today = dayKeyAR()) {
  const result = { trialsEnded: 0, settlements: 0, reminders: 0, overdue: 0, paused: 0 }
  const grace = pauseAfterDays()

  // 1. Fin del período de prueba → active.
  const trials = await q<Owner>(`SELECT c.id, c.name, ${OWNERS} FROM client c WHERE c.status = 'trial' AND NOT c.is_demo AND c.trial_ends_at < $1::date`, [today])
  for (const c of trials) {
    await q(`UPDATE client SET status = 'active', updated_at = now() WHERE id = $1`, [c.id])
    await notify(c.emails, mails.statusChanged({ empresa: c.name, estado: 'Activo', detalle: 'Terminó tu período de prueba: desde ahora los trabajos terminados llevan la comisión acordada.' }))
    await audit(null, 'client.trial_end', { actorRole: 'cron', clientId: c.id, entity: 'client', entityId: c.id })
    result.trialsEnded++
  }

  // 2. Liquidación del mes anterior.
  const period = previousPeriod(today.slice(0, 7))
  const pendientes = await q<Owner & { trabajos: number; facturado: number; comision: number; billing_day: number | null }>(
    `SELECT c.id, c.name, c.billing_day, ${OWNERS},
            count(p.id)::int AS trabajos,
            sum(p.precio_cerrado + coalesce((SELECT sum(monto) FROM presupuesto_adicional a WHERE a.pedido_id = p.id AND a.estado = 'aprobado'), 0))::int AS facturado,
            coalesce(sum(p.comision_monto), 0)::int AS comision
       FROM client c JOIN pedido p ON p.prestador_id = c.id AND p.estado = 'terminado'
        AND to_char(p.terminado_at AT TIME ZONE '${TZ}', 'YYYY-MM') = $1
      WHERE NOT c.is_demo AND c.status <> 'cancelled'
        AND NOT EXISTS (SELECT 1 FROM payment x WHERE x.client_id = c.id AND x.period = $1)
      GROUP BY c.id
     HAVING coalesce(sum(p.comision_monto), 0) > 0`,
    [period],
  )
  for (const c of pendientes) {
    const day = String(Math.min(Math.max(c.billing_day ?? 10, 1), 28)).padStart(2, '0')
    let due = `${today.slice(0, 7)}-${day}`
    if (due < addDays(today, 3)) due = addDays(today, 3)
    const inserted = await q(
      `INSERT INTO payment (client_id, period, amount_cents, currency, status, due_date) VALUES ($1, $2, $3, 'ARS', 'pending', $4::date)
       ON CONFLICT (client_id, period) DO NOTHING RETURNING id`,
      [c.id, period, c.comision * 100, due],
    )
    if (!inserted.length) continue
    await notify(
      c.emails,
      mails.settlementIssued({ empresa: c.name, periodo: periodLabel(period), trabajos: c.trabajos, facturado: pesos(c.facturado), monto: pesos(c.comision), vence: formatDate(due), mediosPago: MEDIOS_PAGO }),
    )
    await audit(null, 'settlement.issue', { actorRole: 'cron', clientId: c.id, entity: 'payment', entityId: period, detail: { key: period, comision: c.comision, due } })
    result.settlements++
  }

  // 3. Aviso 3 días antes del vencimiento.
  const soon = await q<Owner & { period: string; amount_cents: string; due: string }>(
    `SELECT c.id, c.name, ${OWNERS}, x.period, x.amount_cents::text, to_char(x.due_date, 'YYYY-MM-DD') AS due
       FROM payment x JOIN client c ON c.id = x.client_id
      WHERE x.status = 'pending' AND NOT c.is_demo AND x.due_date = $1::date`,
    [addDays(today, 3)],
  )
  for (const c of soon) {
    if (await alreadyDone(c.id, 'billing.reminder', c.period)) continue
    await notify(c.emails, mails.billingReminder({ empresa: c.name, monto: formatMoney(c.amount_cents), fecha: formatDate(c.due) }))
    await audit(null, 'billing.reminder', { actorRole: 'cron', clientId: c.id, entity: 'payment', entityId: c.period, detail: { key: c.period } })
    result.reminders++
  }

  // 4. Vencidas → overdue y prestador → past_due.
  const vencidas = await q<Owner & { period: string; amount_cents: string; due: string; status: string }>(
    `SELECT c.id, c.name, c.status, ${OWNERS}, x.period, x.amount_cents::text, to_char(x.due_date, 'YYYY-MM-DD') AS due
       FROM payment x JOIN client c ON c.id = x.client_id
      WHERE x.status = 'pending' AND NOT c.is_demo AND x.due_date < $1::date`,
    [today],
  )
  for (const c of vencidas) {
    await q(`UPDATE payment SET status = 'overdue' WHERE client_id = $1 AND period = $2 AND status = 'pending'`, [c.id, c.period])
    if (['trial', 'active'].includes(c.status)) await q(`UPDATE client SET status = 'past_due', updated_at = now() WHERE id = $1`, [c.id])
    await notify(c.emails, mails.billingOverdue({ empresa: c.name, monto: formatMoney(c.amount_cents), fecha: formatDate(c.due), fechaPausa: formatDate(addDays(c.due, grace)) }))
    await audit(null, 'client.past_due', { actorRole: 'cron', clientId: c.id, entity: 'payment', entityId: c.period, detail: { key: c.period, from: c.status } })
    result.overdue++
  }

  // 5. Pausa por falta de pago.
  const toPause = await q<Owner>(
    `SELECT c.id, c.name, ${OWNERS} FROM client c
      WHERE c.status = 'past_due' AND NOT c.is_demo
        AND EXISTS (SELECT 1 FROM payment x WHERE x.client_id = c.id AND x.status = 'overdue' AND x.due_date < ($1::date - make_interval(days => $2::int)))`,
    [today, grace],
  )
  for (const c of toPause) {
    await q(`UPDATE client SET status = 'paused', updated_at = now() WHERE id = $1`, [c.id])
    await notify(c.emails, mails.billingPaused({ empresa: c.name }))
    await audit(null, 'client.pause', { actorRole: 'cron', clientId: c.id, entity: 'client', entityId: c.id, detail: { reason: 'falta de pago' } })
    result.paused++
  }

  return result
}
