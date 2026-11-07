import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Brand } from '@/components/site/brand'
import { BARRIOS, DIAS_SEMANA, FRANJAS, MATRICULAS, RUBROS, matriculaNombre, rubroNombre, franjaRango } from '@/lib/catalogo'
import { listActivePlans, RESUME_COOKIE, resolveOnboarding, type Application } from '@/lib/onboarding'
import { resendCode, saveAccount, saveStep, submitApplication, verifyEmail } from './actions'

export const metadata: Metadata = { title: 'Alta de prestador' }
// Valida el token antes de responder: link inválido o vencido → 404 real.
export const instant = false

const STEPS = ['Cuenta', 'Tus datos', 'Características', 'Condiciones', 'Revisión']
const chip = 'flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10'

export default async function OnboardingPage({ params, searchParams }: PageProps<'/empresa/alta/[token]'>) {
  const { token } = await params
  const sp = await searchParams
  const claveParam = typeof sp.clave === 'string' ? sp.clave : null
  const cookie = (await cookies()).get(RESUME_COOKIE)?.value ?? ''
  const cookieKey = cookie.startsWith(`${token}:`) ? cookie.slice(token.length + 1) : null
  const key = claveParam ?? cookieKey

  const resolved = await resolveOnboarding(token, key)
  if (!resolved) notFound()
  const { invite, application } = resolved
  const linkKey = invite.kind === 'campaign' ? (application?.resume_key ?? null) : null

  const maxStep = application ? Math.min(application.step, 5) : 1
  const requested = Number(typeof sp.paso === 'string' ? sp.paso : maxStep)
  const step = Number.isInteger(requested) && requested >= 1 && requested <= maxStep ? requested : maxStep
  const editable = !application || application.status === 'draft' || application.status === 'changes_requested'
  const stepHref = (n: number) => `/empresa/alta/${token}?${linkKey ? `clave=${encodeURIComponent(linkKey)}&` : ''}paso=${n}`

  return (
    <main className="mx-auto max-w-[780px] px-5 py-10">
      <Brand href={`/empresa/alta/${token}`} suffix="alta de prestadores" />
      <h1 className="display mt-6 text-[32px] font-extrabold">Sumate como prestador de AyudaYa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Completá el alta en 5 pasos. Se guarda en cada paso: podés seguir después desde este mismo link. Sin abono mensual: solo una comisión del 15% por trabajo terminado.
      </p>

      {!editable && application ? (
        <StatusView application={application} />
      ) : (
        <>
          {application?.status === 'changes_requested' && application.review_reason && (
            <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-[#f1d9a6] bg-[#fff8e6] p-4 text-sm text-[#7a5a14]">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Necesitamos que corrijas lo siguiente:</p>
                <p className="mt-1 whitespace-pre-line">{application.review_reason}</p>
                <p className="mt-2 text-xs">Revisá los pasos, corregí y volvé a enviar desde &quot;Revisión&quot;.</p>
              </div>
            </div>
          )}
          <ol className="mt-6 flex flex-wrap gap-2" aria-label="Pasos del alta">
            {STEPS.map((label, i) => {
              const n = i + 1
              const reachable = n <= maxStep
              const current = n === step
              const cls = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${current ? 'bg-foreground text-background' : reachable ? 'border border-border bg-card text-foreground' : 'border border-border text-muted-foreground'}`
              return (
                <li key={label}>
                  {reachable && !current ? (
                    <Link href={stepHref(n)} className={cls}>
                      {n}. {label}
                    </Link>
                  ) : (
                    <span className={cls} aria-current={current ? 'step' : undefined}>
                      {n}. {label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          <section className="mt-5 rounded-[20px] border border-border bg-card p-5 sm:p-7">
            {step === 1 && <StepAccount token={token} linkKey={linkKey} application={application} lockedEmail={invite.kind === 'personal' ? invite.email : null} />}
            {step === 2 && application && <StepDatos token={token} linkKey={linkKey} application={application} />}
            {step === 3 && application && <StepFeatures token={token} linkKey={linkKey} application={application} />}
            {step === 4 && application && <StepPlan token={token} linkKey={linkKey} application={application} />}
            {step === 5 && application && <StepReview token={token} linkKey={linkKey} application={application} />}
          </section>
        </>
      )}
    </main>
  )
}

type StepProps = { token: string; linkKey: string | null; application: Application }

function StepAccount({ token, linkKey, application, lockedEmail }: { token: string; linkKey: string | null; application: Application | null; lockedEmail: string | null }) {
  const awaitingCode = application && !application.email_verified_at
  return (
    <>
      <h2 className="text-lg font-bold">1. Tu cuenta</h2>
      <p className="mb-4 text-xs text-muted-foreground">A este correo te llegan los avisos de pedidos, las liquidaciones y tu usuario.</p>
      <ActionForm action={saveAccount.bind(null, token, linkKey)} submitLabel={awaitingCode ? 'Guardar y reenviar código' : 'Guardar y seguir'}>
        <label className={labelClass}>
          Nombre y apellido
          <input name="contact_name" required maxLength={80} defaultValue={application?.contact_name ?? ''} autoComplete="name" className={inputClass} />
        </label>
        <label className={labelClass}>
          Correo electrónico
          <input name="email" type="email" required defaultValue={lockedEmail ?? application?.email ?? ''} readOnly={!!lockedEmail} autoComplete="email" className={inputClass} />
          {lockedEmail && <span className="text-xs font-normal text-muted-foreground">Es el correo al que te enviamos la invitación.</span>}
        </label>
        <label className={labelClass}>
          WhatsApp
          <input name="phone" required maxLength={40} defaultValue={application?.phone ?? ''} placeholder="223 555-1234" autoComplete="tel" className={inputClass} />
        </label>
      </ActionForm>
      {awaitingCode && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-semibold">Verificá tu correo</h3>
          <p className="mb-3 text-xs text-muted-foreground">Te enviamos un código de 6 números a {application.email}. Vence en 30 minutos.</p>
          <ActionForm action={verifyEmail.bind(null, token, linkKey)} submitLabel="Verificar" className="flex flex-wrap items-end gap-3">
            <label className={labelClass}>
              Código
              <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className={`${inputClass} w-36 tracking-[0.3em]`} />
            </label>
          </ActionForm>
          <form action={resendCode.bind(null, token, linkKey)} className="mt-3">
            <button className="text-xs font-semibold text-primary underline">Reenviar código</button>
          </form>
        </div>
      )}
    </>
  )
}

function StepDatos({ token, linkKey, application }: StepProps) {
  const d = application.data ?? {}
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">2. Tus datos</h2>
      <ActionForm action={saveStep.bind(null, token, linkKey, 2)} submitLabel="Guardar y seguir">
        <label className={labelClass}>
          Nombre comercial (o tu nombre y apellido)
          <input name="name" required maxLength={80} defaultValue={d.name ?? application.contact_name ?? ''} placeholder="Ej. Plomería Ruiz" className={inputClass} />
          <span className="text-xs font-normal text-muted-foreground">Es el nombre que ve el cliente cuando te asignamos.</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            DNI
            <input name="dni" required inputMode="numeric" maxLength={10} defaultValue={d.dni ?? ''} className={inputClass} />
          </label>
          <label className={labelClass}>
            CUIT / CUIL
            <input name="tax_id" required inputMode="numeric" maxLength={13} defaultValue={d.tax_id ?? ''} placeholder="20123456789" className={inputClass} />
          </label>
          <label className={labelClass}>
            Condición fiscal (opcional)
            <select name="monotributo" defaultValue={d.monotributo ?? ''} className={inputClass}>
              <option value="">Elegí una</option>
              <option>Monotributo</option>
              <option>Monotributo social</option>
              <option>Responsable inscripto</option>
              <option>Todavía no estoy inscripto</option>
            </select>
          </label>
          <label className={labelClass}>
            Ciudad
            <input name="city" maxLength={60} defaultValue={d.city ?? 'Mar del Plata'} className={inputClass} />
          </label>
        </div>
        <label className={labelClass}>
          Domicilio (opcional)
          <input name="address" maxLength={160} defaultValue={d.address ?? ''} className={inputClass} />
        </label>
      </ActionForm>
    </>
  )
}

function StepFeatures({ token, linkKey, application }: StepProps) {
  const d = application.data ?? {}
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">3. Características de tu trabajo</h2>
      <ActionForm action={saveStep.bind(null, token, linkKey, 3)} submitLabel="Guardar y seguir">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Rubros</legend>
          <div className="flex flex-wrap gap-3">
            {RUBROS.map((r) => (
              <label key={r.id} className={chip}>
                <input type="checkbox" name="rubros" value={r.id} defaultChecked={d.rubros?.includes(r.id)} /> {r.nombre}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Para gas es obligatorio ser gasista matriculado. Para electricidad pedimos matrícula de electricista.</p>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <label className={labelClass}>
            Tipo de matrícula
            <select name="matricula_tipo" required defaultValue={d.matricula_tipo ?? ''} className={inputClass}>
              <option value="" disabled>
                Elegí una
              </option>
              {MATRICULAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Número de matrícula
            <input name="matricula_numero" maxLength={40} defaultValue={d.matricula_numero ?? ''} className={inputClass} />
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Barrios de Mar del Plata donde trabajás</legend>
          <div className="flex flex-wrap gap-2">
            {BARRIOS.filter((b) => b !== 'Otro').map((b) => (
              <label key={b} className={chip}>
                <input type="checkbox" name="zonas" value={b} defaultChecked={d.zonas?.includes(b)} /> {b}
              </label>
            ))}
          </div>
        </fieldset>
        <label className={`${labelClass} max-w-xs`}>
          Años de experiencia
          <input name="experiencia" type="number" min={0} max={70} required defaultValue={d.experiencia ?? ''} className={inputClass} />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Disponibilidad: días</legend>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map((dia) => (
              <label key={dia} className={chip}>
                <input type="checkbox" name="dias" value={dia} defaultChecked={d.dias ? d.dias.includes(dia) : dia !== 'Domingo'} /> {dia}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Disponibilidad: franjas</legend>
          <div className="flex flex-wrap gap-2">
            {FRANJAS.map((f) => (
              <label key={f.id} className={chip}>
                <input type="checkbox" name="franjas" value={f.id} defaultChecked={d.franjas ? d.franjas.includes(f.id) : true} /> {f.rango}
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="urgencias" defaultChecked={d.urgencias} /> Puedo tomar urgencias en el día
          </label>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">Herramientas y movilidad</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vehiculo" defaultChecked={d.vehiculo} /> Tengo vehículo propio
          </label>
          <label className={labelClass}>
            Herramientas y equipos propios (opcional)
            <input name="herramientas" maxLength={300} defaultValue={d.herramientas ?? ''} placeholder="Ej. máquina destapadora, manómetro, detector de gas" className={inputClass} />
          </label>
        </fieldset>
        <label className={labelClass}>
          Seguro (opcional)
          <input name="seguro" maxLength={200} defaultValue={d.seguro ?? ''} placeholder="Ej. accidentes personales / responsabilidad civil, compañía" className={inputClass} />
        </label>
      </ActionForm>
    </>
  )
}

async function StepPlan({ token, linkKey, application }: StepProps) {
  const plans = await listActivePlans()
  const d = application.data ?? {}
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">4. Condiciones</h2>
      <ActionForm action={saveStep.bind(null, token, linkKey, 4)} submitLabel="Guardar y seguir">
        <fieldset>
          <legend className="sr-only">Condiciones</legend>
          <div className="grid gap-3">
            {plans.map((p) => (
              <label key={p.id} className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="plan_id" value={p.id} required defaultChecked={(application.requested_plan_id ?? plans[0]?.id) === p.id} /> {p.name}
                </span>
                <span className="text-lg font-bold">
                  {Number(p.monthly_price_cents) > 0 ? `Abono ${p.currency} ${Number(p.monthly_price_cents) / 100} / mes + ` : 'Sin abono mensual · '}
                  {Number(p.commission_pct)}% de comisión por trabajo terminado
                </span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-semibold">Cómo se liquida la comisión</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            <li>El cliente te paga a vos el precio cerrado del tarifario (más los adicionales que haya aprobado en la plataforma).</li>
            <li>A principio de cada mes te mandamos la liquidación: el 15% de los trabajos que terminaste el mes anterior.</li>
            <li>La pagás por transferencia hasta el día de pago que elijas. Si no hubo trabajos, no pagás nada.</li>
          </ul>
        </div>
        <label className={`${labelClass} max-w-xs`}>
          Día del mes para pagar la liquidación (1 a 28)
          <input name="billing_day" type="number" min={1} max={28} required defaultValue={d.billing_day ?? 10} className={inputClass} />
        </label>
      </ActionForm>
    </>
  )
}

async function StepReview({ token, linkKey, application }: StepProps) {
  const d = application.data ?? {}
  const plans = await listActivePlans()
  const plan = plans.find((p) => p.id === application.requested_plan_id)
  const rows: Array<[string, string]> = [
    ['Responsable', `${application.contact_name ?? '—'} · ${application.email} · ${application.phone ?? '—'}`],
    ['Nombre comercial', d.name ?? '—'],
    ['DNI / CUIT', `${d.dni || '—'} / ${d.tax_id || '—'}`],
    ['Condición fiscal', d.monotributo || '—'],
    ['Ciudad', d.city ?? '—'],
    ['Rubros', d.rubros?.map(rubroNombre).join(', ') || '—'],
    ['Matrícula', `${matriculaNombre(d.matricula_tipo)}${d.matricula_numero ? ` · N.º ${d.matricula_numero}` : ''}`],
    ['Zonas', d.zonas?.join(', ') || '—'],
    ['Experiencia', d.experiencia != null ? `${d.experiencia} años` : '—'],
    ['Disponibilidad', `${d.dias?.join(', ') || '—'} · ${d.franjas?.map(franjaRango).join(', ') || '—'}${d.urgencias ? ' · toma urgencias' : ''}`],
    ['Vehículo / herramientas', `${d.vehiculo ? 'Con vehículo' : 'Sin vehículo'}${d.herramientas ? ` · ${d.herramientas}` : ''}`],
    ['Seguro', d.seguro || '—'],
    ['Condiciones', plan ? `${plan.name} · ${Number(plan.commission_pct)}% de comisión` : '—'],
    ['Día de pago', d.billing_day ? String(d.billing_day) : '—'],
  ]
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">5. Revisión y envío</h2>
      <dl className="mb-5 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[180px_minmax(0,1fr)]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <ActionForm
        action={submitApplication.bind(null, token, linkKey)}
        submitLabel={application.status === 'changes_requested' ? 'Reenviar solicitud' : 'Enviar solicitud'}
        pendingLabel="Enviando…"
      >
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" required className="mt-1" />
          <span>
            Acepto los términos del servicio de AyudaYa (precio cerrado del tarifario, comisión del 15% por trabajo terminado, garantía de 30 días) y la política de
            datos: usamos estos datos solo para verificar tu matrícula, gestionar tu cuenta y asignarte pedidos.
          </span>
        </label>
      </ActionForm>
    </>
  )
}

function StatusView({ application }: { application: Application }) {
  const messages: Record<string, { title: string; text: string }> = {
    pending_review: { title: '¡Recibimos tu solicitud!', text: 'Estamos verificando tus datos y tu matrícula. Te respondemos por mail en un plazo de 2 días hábiles.' },
    approved: { title: 'Tu solicitud fue aprobada', text: 'Te enviamos por mail tu usuario y una contraseña temporal para ingresar al panel de prestadores.' },
    rejected: { title: 'Tu solicitud no fue aprobada', text: 'Te enviamos el motivo por mail. Gracias por el tiempo que le dedicaste.' },
  }
  const m = messages[application.status] ?? messages.pending_review
  return (
    <div role="status" className="mt-8 rounded-[20px] border border-border bg-card p-7 text-center">
      <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-bold">{m.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{m.text}</p>
    </div>
  )
}
