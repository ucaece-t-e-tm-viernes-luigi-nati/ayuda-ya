// Plantillas de mails transaccionales de AyudaYa (castellano rioplatense, HTML simple + texto plano).
import { site } from './site'

const STARTUP = site.name

export function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Mail = { subject: string; html: string; text: string; template: string }

// Bloques: string = párrafo (HTML ya escapado); ['list', [label, value][]]; ['quote', text]; ['link', label, url]; ['title', text]
type Block = string | ['list', Array<[string, string]>] | ['quote', string] | ['link', string, string] | ['title', string]

function render(template: string, subject: string, blocks: Block[]): Mail {
  const html: string[] = []
  const text: string[] = []
  for (const block of blocks) {
    if (typeof block === 'string') {
      html.push(`<p style="margin:0 0 14px;line-height:1.5">${block}</p>`)
      text.push(block.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'))
    } else if (block[0] === 'title') {
      html.push(`<h3 style="margin:18px 0 8px;font-size:16px">${esc(block[1])}</h3>`)
      text.push(`\n${block[1]}`)
    } else if (block[0] === 'list') {
      html.push(
        `<ul style="margin:0 0 14px;padding-left:18px;line-height:1.6">${block[1]
          .map(([label, value]) => `<li><strong>${esc(label)}:</strong> ${esc(value)}</li>`)
          .join('')}</ul>`,
      )
      text.push(block[1].map(([label, value]) => `- ${label}: ${value}`).join('\n'))
    } else if (block[0] === 'quote') {
      html.push(`<blockquote style="margin:0 0 14px;padding:10px 14px;border-left:3px solid #D2510D;background:#FBEFE7;white-space:pre-line">${esc(block[1])}</blockquote>`)
      text.push(`> ${block[1]}`)
    } else if (block[0] === 'link') {
      html.push(
        `<p style="margin:0 0 14px"><a href="${esc(block[2])}" style="display:inline-block;background:#D2510D;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:bold">${esc(block[1])}</a><br><span style="font-size:12px;color:#5A6B80">${esc(block[2])}</span></p>`,
      )
      text.push(`${block[1]}: ${block[2]}`)
    }
  }
  const body = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#13233A;background:#F3F5F7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:24px;border:1px solid #D6DEE6">
<p style="font-weight:900;font-size:22px;margin:0 0 4px">Ayuda<span style="color:#D2510D">Ya</span></p>
<div style="height:6px;margin:0 0 18px;background:repeating-linear-gradient(-45deg,#D2510D 0 8px,#13233A 8px 16px);border-radius:2px"></div>
${html.join('\n')}
<p style="margin:24px 0 0;color:#5A6B80;font-size:13px">— El equipo de ${STARTUP} · Servicios para el hogar en Mar del Plata</p>
</div></body></html>`
  return { subject, html: body, text: `${text.join('\n\n')}\n\n— El equipo de ${STARTUP}`, template }
}

const b = (value: string) => `<strong>${esc(value)}</strong>`

export const mails = {
  // ---------------- Alta de prestadores ----------------
  invite(p: { link: string; expires: string; name?: string | null }) {
    return render('invite', `Te invitamos a sumarte como prestador en ${STARTUP}`, [
      `Hola${p.name ? ` ${esc(p.name)}` : ''}, te invitamos a sumarte al piloto de ${STARTUP}: conectamos hogares de Mar del Plata con plomeros, gasistas y electricistas verificados, con precio cerrado.`,
      'Sin abono mensual: solo pagás una comisión del 15% sobre los trabajos que terminás. Completá el alta en unos minutos desde este link personal; se guarda en cada paso y podés seguir después.',
      ['link', 'Completar el alta', p.link],
      `El link vence el ${b(p.expires)}.`,
    ])
  },

  emailCode(p: { code: string }) {
    return render('email_code', `Tu código de verificación de ${STARTUP}: ${p.code}`, [
      'Usá este código para verificar tu correo en el formulario de alta:',
      `<span style="font-size:24px;letter-spacing:4px">${b(p.code)}</span>`,
      'Vence en 30 minutos. Si no fuiste vos, ignorá este mail.',
    ])
  },

  adminNewApplication(p: { empresa: string; ciudad: string; nombre: string; email: string; whatsapp: string; rubros: string; plan: string; fecha: string; link: string }) {
    return render('admin_new_application', `Nueva solicitud de alta: ${p.empresa}`, [
      'Hay una nueva solicitud de alta de prestador para revisar.',
      ['list', [
        ['Prestador', `${p.empresa} (${p.ciudad})`],
        ['Responsable', `${p.nombre} · ${p.email} · ${p.whatsapp}`],
        ['Rubros', p.rubros],
        ['Plan pedido', p.plan],
        ['Enviada', p.fecha],
      ]],
      ['link', 'Revisar solicitud', p.link],
    ])
  },

  applicationReceived(p: { nombre: string; empresa: string; resumen: Array<[string, string]>; plazo: number }) {
    return render('application_received', `Recibimos tu solicitud en ${STARTUP}`, [
      `Hola ${esc(p.nombre)}, ¡gracias por sumarte a ${STARTUP}!`,
      `Recibimos la solicitud de alta de ${b(p.empresa)}. Nuestro equipo va a verificar tus datos y tu matrícula y te respondemos por este medio en un plazo de ${p.plazo} días hábiles.`,
      ['title', 'Resumen de lo que enviaste'],
      ['list', p.resumen],
      'Si necesitás cambiar algo, respondé este mail.',
    ])
  },

  approved(p: {
    nombre: string
    empresa: string
    link: string
    email: string
    password: string | null
    venceClave: string
    plan: string
    comision: string
    abono: string | null
    finPrueba: string | null
    diaPago: number
    mediosPago: string
  }) {
    const blocks: Block[] = [
      `Hola ${esc(p.nombre)}, ¡buenas noticias! Verificamos tus datos y aprobamos el alta de ${b(p.empresa)} como prestador de ${STARTUP}.`,
      ['title', 'Tus datos de ingreso al panel de prestadores'],
      ['list', [
        ['Link', p.link],
        ['Usuario', p.email],
        ['Contraseña temporal', p.password ?? `(usá la contraseña que ya tenés en ${STARTUP})`],
      ]],
      ['link', 'Ingresar al panel de prestadores', p.link],
    ]
    if (p.password) {
      blocks.push(`Al ingresar por primera vez te vamos a pedir que la cambies. Es obligatorio y la contraseña temporal vence el ${b(p.venceClave)}.`)
    }
    blocks.push(['title', `Tus condiciones: ${p.plan}`])
    const condiciones: Array<[string, string]> = [
      ['Abono mensual', p.abono ?? 'No hay abono mensual'],
      ['Comisión de AyudaYa', `${p.comision} sobre el precio final de cada trabajo terminado (precio cerrado + adicionales aprobados por el cliente)`],
    ]
    if (p.finPrueba) condiciones.push(['Período de prueba sin comisión', `trabajos terminados hasta el ${p.finPrueba}`])
    condiciones.push(
      ['Liquidación', `mensual: a principio de cada mes te mandamos el detalle de las comisiones de los trabajos terminados el mes anterior`],
      ['Vencimiento', `el día ${p.diaPago} de cada mes`],
      ['Medios de pago', p.mediosPago],
    )
    blocks.push(['list', condiciones])
    blocks.push('El cliente le paga el precio cerrado a vos. Si no hubo trabajos terminados en el mes, no pagás nada.')
    blocks.push('Cualquier duda, respondé este mail.')
    return render('approved', `¡Tu cuenta de prestador en ${STARTUP} fue aprobada!`, blocks)
  },

  changesRequested(p: { nombre: string; empresa: string; motivo: string; link: string }) {
    return render('changes_requested', `Tu solicitud en ${STARTUP} necesita algunos cambios`, [
      `Hola ${esc(p.nombre)}, revisamos la solicitud de ${b(p.empresa)} y antes de aprobarla necesitamos que corrijas lo siguiente:`,
      ['quote', p.motivo],
      'Podés corregirlo acá, tus datos ya están cargados:',
      ['link', 'Corregir mi solicitud', p.link],
      'Cuando la reenvíes, la volvemos a revisar.',
    ])
  },

  rejected(p: { nombre: string; empresa: string; motivo: string }) {
    return render('rejected', `Sobre tu solicitud en ${STARTUP}`, [
      `Hola ${esc(p.nombre)}, gracias por tu interés en ${STARTUP}.`,
      `Revisamos la solicitud de ${b(p.empresa)} y en esta oportunidad no podemos aprobarla por el siguiente motivo:`,
      ['quote', p.motivo],
      'Gracias por el tiempo que le dedicaste.',
    ])
  },

  // ---------------- Comisiones (cron + registro manual) ----------------
  settlementIssued(p: { empresa: string; periodo: string; trabajos: number; facturado: string; monto: string; vence: string; mediosPago: string }) {
    return render('settlement_issued', `Liquidación de comisiones de ${p.periodo} · ${STARTUP}`, [
      `Hola, te pasamos la liquidación de comisiones de ${b(p.empresa)} del período ${b(p.periodo)}.`,
      ['list', [
        ['Trabajos terminados', String(p.trabajos)],
        ['Total cobrado a clientes', p.facturado],
        ['Comisión a pagar', p.monto],
        ['Vence', p.vence],
        ['Medios de pago', p.mediosPago],
      ]],
      'El detalle trabajo por trabajo está en tu panel, en "Comisiones".',
    ])
  },

  billingReminder(p: { empresa: string; monto: string; fecha: string }) {
    return render('billing_reminder', `Tu liquidación de ${STARTUP} vence el ${p.fecha}`, [
      `Hola, te recordamos que la liquidación de comisiones de ${b(p.empresa)} (${esc(p.monto)}) vence el ${b(p.fecha)}.`,
      'Si ya la pagaste, ignorá este mensaje.',
    ])
  },

  billingOverdue(p: { empresa: string; monto: string; fecha: string; fechaPausa: string }) {
    return render('billing_overdue', `Tu liquidación de ${STARTUP} está vencida`, [
      `La liquidación de comisiones de ${b(p.empresa)} (${esc(p.monto)}) venció el ${b(p.fecha)}.`,
      `Regularizala para evitar la pausa de tu cuenta el ${b(p.fechaPausa)}: con la cuenta pausada no recibís pedidos nuevos.`,
    ])
  },

  billingPaused(p: { empresa: string }) {
    return render('billing_paused', `Pausamos tu cuenta de prestador en ${STARTUP}`, [
      `Pausamos la cuenta de ${b(p.empresa)} por falta de pago de la liquidación. Mientras tanto no te asignamos pedidos nuevos.`,
      'Tus datos están a salvo: al registrar el pago se reactiva.',
    ])
  },

  paymentRegistered(p: { empresa: string; monto: string; periodo: string }) {
    return render('payment_registered', `Registramos tu pago en ${STARTUP}`, [
      `Registramos tu pago de ${b(p.monto)} de la liquidación de ${b(p.periodo)} para ${b(p.empresa)}. ¡Gracias!`,
    ])
  },

  statusChanged(p: { empresa: string; estado: string; detalle: string }) {
    return render('status_changed', `Cambió el estado de tu cuenta en ${STARTUP}`, [
      `El estado de la cuenta de ${b(p.empresa)} ahora es: ${b(p.estado)}.`,
      esc(p.detalle),
      'Cualquier duda, respondé este mail.',
    ])
  },

  resetAccess(p: { empresa: string; link: string; email: string; password: string; venceClave: string }) {
    return render('reset_access', `Tu acceso al panel de prestadores de ${STARTUP}`, [
      `Te enviamos un nuevo acceso para el panel de ${b(p.empresa)}.`,
      ['list', [
        ['Link', p.link],
        ['Usuario', p.email],
        ['Contraseña temporal', p.password],
      ]],
      ['link', 'Ingresar al panel', p.link],
      `Al ingresar te vamos a pedir que la cambies. La contraseña temporal vence el ${b(p.venceClave)}.`,
    ])
  },

  superadminSetup(p: { link: string }) {
    return render('superadmin_setup', `Acceso a la plataforma de ${STARTUP}`, [
      'Pediste crear o restablecer tu contraseña de la plataforma. Usá este link (vence en 30 minutos, un solo uso):',
      ['link', 'Definir mi contraseña', p.link],
      'Si no fuiste vos, ignorá este mail.',
    ])
  },

  // ---------------- Pedidos ----------------
  adminNewOrder(p: { numero: string; servicio: string; precio: string; barrio: string; cuando: string; link: string }) {
    return render('admin_new_order', `Nuevo pedido ${p.numero}: ${p.servicio}`, [
      'Entró un pedido nuevo para asignar.',
      ['list', [
        ['Servicio', p.servicio],
        ['Precio cerrado', p.precio],
        ['Barrio', p.barrio],
        ['Cuándo', p.cuando],
      ]],
      ['link', 'Asignar prestador', p.link],
    ])
  },

  orderAssignedHousehold(p: { nombre: string; numero: string; servicio: string; prestador: string; matricula: string; cuando: string; precio: string; link: string }) {
    return render('order_assigned_household', `Tu pedido ${p.numero} ya tiene profesional`, [
      `Hola ${esc(p.nombre)}, ya asignamos un profesional verificado a tu pedido.`,
      ['list', [
        ['Servicio', p.servicio],
        ['Profesional', p.prestador],
        ['Matrícula', p.matricula],
        ['Cuándo', p.cuando],
        ['Precio cerrado', p.precio],
      ]],
      'Si el trabajo necesita algo más, el profesional te manda un presupuesto adicional por la plataforma y lo aprobás antes de que empiece.',
      ['link', 'Ver mi pedido', p.link],
    ])
  },

  orderAssignedPrestador(p: { empresa: string; numero: string; servicio: string; barrio: string; cuando: string; precio: string; comision: string; link: string }) {
    return render('order_assigned_prestador', `Nuevo pedido asignado ${p.numero}: ${p.servicio}`, [
      `Hola, te asignamos un pedido nuevo para ${b(p.empresa)}. Entrá al panel para aceptarlo o rechazarlo.`,
      ['list', [
        ['Servicio', p.servicio],
        ['Barrio', p.barrio],
        ['Cuándo', p.cuando],
        ['Precio cerrado', p.precio],
        ['Comisión AyudaYa', p.comision],
      ]],
      'La dirección y el celular del cliente se ven en el panel cuando aceptás el pedido.',
      ['link', 'Ver el pedido', p.link],
    ])
  },

  extraBudgetHousehold(p: { nombre: string; numero: string; monto: string; detalle: string; link: string }) {
    return render('extra_budget_household', `Presupuesto adicional para tu pedido ${p.numero}`, [
      `Hola ${esc(p.nombre)}, el profesional propone un trabajo adicional de ${b(p.monto)}:`,
      ['quote', p.detalle],
      'No se hace nada extra sin tu aprobación. Aprobalo o rechazalo desde tu pedido:',
      ['link', 'Ver y responder', p.link],
    ])
  },

  orderFinishedHousehold(p: { nombre: string; numero: string; servicio: string; total: string; link: string }) {
    return render('order_finished_household', `Tu pedido ${p.numero} está terminado`, [
      `Hola ${esc(p.nombre)}, el profesional marcó como terminado el trabajo "${esc(p.servicio)}".`,
      ['list', [['Total a pagar', p.total]]],
      'Si el arreglo falla dentro de los 30 días, el prestador vuelve sin costo. ¿Nos contás cómo te fue? Calificar te lleva 10 segundos:',
      ['link', 'Calificar el trabajo', p.link],
    ])
  },
}
