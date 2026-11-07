import Link from 'next/link'
import { Asistente } from '@/components/site/asistente'
import { Check } from '@/components/site/check'
import { PageShell } from '@/components/site/page-shell'
import { Tarifario } from '@/components/site/tarifario'
import { VisitBeacon } from '@/components/site/visit-beacon'
import { getTarifario } from '@/lib/data/servicios'
import { whatsappLabel, whatsappLink } from '@/lib/site'

// Portada pública (solo la superficie de hogares). Diseño y textos del ayudaya.html del equipo.
// Es estática: el tarifario sale de Neon con 'use cache' y se refresca al editarlo desde la plataforma.

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

export default async function Home() {
  const servicios = await getTarifario()
  const precio = (codigo: string) => servicios.find((s) => s.codigo === codigo)?.precio
  const desde = (rubro: string, codigos?: string[]) => {
    const list = servicios.filter((s) => s.rubro === rubro && (!codigos || codigos.includes(s.codigo))).map((s) => s.precio)
    return list.length ? Math.min(...list) : null
  }

  const galeria = [
    { foto: '/img/destapacion.webp', alt: 'Plomero destapando una cañería con máquina', titulo: 'Destapaciones', rubro: 'plomeria', texto: precio('PL-04') ? `desde ${fmt(precio('PL-04')!)}` : '' },
    { foto: '/img/llave-sifon.webp', alt: 'Llave ajustando el sifón cromado de una bacha', titulo: 'Sifones y griferías', rubro: 'plomeria', texto: precio('PL-02') ? `desde ${fmt(precio('PL-02')!)}` : '' },
    { foto: '/img/llave-cano.webp', alt: 'Llave Stillson ajustando un caño', titulo: 'Pérdidas de agua', rubro: 'plomeria', texto: precio('PL-01') ? `diagnóstico ${fmt(precio('PL-01')!)}` : '' },
    { foto: '/img/llama-gas.webp', alt: 'Hornalla de cocina encendida con llama azul', titulo: 'Gas, calefones y estufas', rubro: 'gas', texto: desde('gas') ? `desde ${fmt(desde('gas')!)}` : '' },
    { foto: '/img/tablero-casco.webp', alt: 'Electricista con casco trabajando en un tablero', titulo: 'Tomas, llaves y ventiladores', rubro: 'electricidad', texto: desde('electricidad', ['EL-02', 'EL-04']) ? `desde ${fmt(desde('electricidad', ['EL-02', 'EL-04'])!)}` : '' },
    { foto: '/img/electricista-chaleco.webp', alt: 'Electricista con chaleco revisando un medidor', titulo: 'Tableros y térmicas', rubro: 'electricidad', texto: precio('EL-03') ? `desde ${fmt(precio('EL-03')!)}` : '' },
  ]

  const waPedido = whatsappLink('Hola AyudaYa, quiero pedir un servicio.\n\nServicio: \nProblema: \nBarrio: \nDirección: \nCuándo: \nNombre: ')
  const waPrestador = whatsappLink('Hola AyudaYa, soy prestador y quiero sumarme al piloto. Mi oficio es: ')

  return (
    <PageShell>
      <VisitBeacon />
      <div id="inicio" className="wrap grid items-center gap-9 py-9 pb-12 md:grid-cols-[1.15fr_.85fr] md:gap-12 md:py-14 md:pb-16">
        <div>
          <p className="eyebrow">Plomería · Gas · Electricidad</p>
          <h1 className="display mt-3.5 text-[clamp(38px,6.6vw,68px)] font-extrabold">
            Un profesional verificado en tu casa, con <em className="not-italic text-primary-ink">precio cerrado</em> antes de que entre.
          </h1>
          <p className="lead mt-5 text-lg">
            Elegí el servicio, mirá cuánto cuesta y pedilo. Te asignamos un plomero, gasista o electricista de confianza en Mar del Plata, con horario confirmado. El
            precio que aceptás es el que pagás: <strong className="text-foreground">sin comisión ni recargo para vos</strong>.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a className="btn btn-primary" href="#asistente">
              Contanos qué pasa
            </a>
            <a className="btn btn-ghost" href="#servicios">
              Ver servicios y precios
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="chip">
              <Check /> Prestadores verificados
            </span>
            <span className="chip">
              <Check /> Sin comisión para el cliente
            </span>
            <span className="chip">
              <Check /> Sin cargos sorpresa
            </span>
            <span className="chip">
              <Check /> Garantía de 30 días
            </span>
          </div>
        </div>

        <div className="grid min-w-0">
          <div className="grid h-[280px] grid-cols-[1.25fr_1fr] grid-rows-2 gap-2 sm:h-[clamp(300px,34vw,380px)]">
            <figure className="foto row-span-2">
              <img src="/img/plomero-bacha.webp" alt="Plomero arreglando el desagüe debajo de una bacha" />
            </figure>
            <figure className="foto">
              <img src="/img/tablero-casco.webp" alt="Electricista con casco trabajando en un tablero eléctrico" />
            </figure>
            <figure className="foto">
              <img src="/img/llama-gas.webp" alt="Hornalla de cocina encendida con llama azul" />
            </figure>
          </div>
          <aside className="orden mx-2 -mt-10 sm:mx-5 sm:-mt-14" aria-label="Ejemplo de orden de trabajo">
            <span className="stamp">Precio cerrado</span>
            <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-border pb-3.5">
              <span className="eyebrow">
                Orden <b className="text-foreground">#AY-0142</b>
              </span>
              <span className="eyebrow">Hoy</span>
            </div>
            <div className="orden-row">
              <span>Servicio</span>
              <span>Destape de cañería</span>
            </div>
            <div className="orden-row">
              <span>Prestador</span>
              <span>Plomero verificado · DNI y referencias</span>
            </div>
            <div className="orden-row">
              <span>Llega</span>
              <span>Hoy, entre 16 y 20 h</span>
            </div>
            <div className="flex items-end justify-between gap-3 pt-4">
              <span className="eyebrow">Total a pagar</span>
              <span className="num text-[30px]">{fmt(precio('PL-04') ?? 45000)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Ejemplo de cómo ves tu pedido confirmado. Sin comisión para el cliente.</p>
          </aside>
        </div>
      </div>

      <div className="cinta" aria-hidden="true" />

      <section id="trabajos" className="py-16">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Lo que resolvemos</p>
            <h2 className="h2">Los arreglos de todos los días, con gente que sabe</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {galeria.map((g) => (
              <a key={g.titulo} href={`#tarifa-${g.rubro}`} className="group grid gap-2 no-underline">
                <figure className="foto aspect-[4/3]">
                  <img src={g.foto} alt={g.alt} loading="lazy" className="transition-transform duration-500 group-hover:scale-[1.04]" />
                </figure>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <b className="font-semibold">{g.titulo}</b>
                  <span className="whitespace-nowrap font-mono text-xs text-primary-ink">{g.texto}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="asistente" className="border-t border-border py-16">
        <div className="wrap grid items-start gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div className="sec-head mb-0">
            <p className="eyebrow">Asistente AyudaYa</p>
            <h2 className="h2">¿No sabés qué servicio pedir? Contanos qué pasa</h2>
            <p className="lead">
              Describí el problema con tus palabras. El asistente te hace un par de preguntas y te sugiere el servicio del tarifario con su precio. Vos decidís si lo
              pedís o elegís otro.
            </p>
            <p className="hint">
              Si ya sabés lo que necesitás, elegilo directo en el{' '}
              <a href="#servicios" className="underline">
                tarifario
              </a>
              .
            </p>
            <figure className="foto mt-5 aspect-[16/10]">
              <img src="/img/herramientas-piso.webp" alt="Llave Stillson, caños y conexiones de plomería sobre el piso" loading="lazy" />
              <figcaption
                className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-8 text-sm text-white"
                style={{ background: 'linear-gradient(transparent, rgba(10,18,30,.8))' }}
              >
                Contalo como se lo contarías al plomero.
              </figcaption>
            </figure>
          </div>
          <Asistente servicios={servicios} />
        </div>
      </section>

      <section id="servicios" className="border-t border-border py-16">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Tarifario del piloto</p>
            <h2 className="h2">Elegí el servicio y conocé el precio</h2>
            <p className="lead">
              Precios de mano de obra para los trabajos más pedidos. Es el precio final para vos: AyudaYa no te cobra comisión. Si tu problema no está en la lista, pedí
              una visita de diagnóstico.
            </p>
          </div>
          <Tarifario servicios={servicios} />
          <p className="mt-3.5 max-w-[70ch] text-[13px] text-muted-foreground">
            Si el trabajo necesita materiales o es más grande de lo previsto, el prestador te pasa un presupuesto por la plataforma y lo aprobás antes de empezar. Ese
            monto aprobado es el precio final.
          </p>
        </div>
      </section>

      <section id="como" className="plano border-t border-border py-16">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Cómo funciona</p>
            <h2 className="h2">De la pérdida al arreglo, en cuatro pasos</h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              ['Elegís el servicio', 'Lo elegís del tarifario o le contás el problema al asistente para que te sugiera uno. Ves el precio antes de pedir.'],
              ['Te asignamos un prestador', 'Buscamos un profesional verificado de tu zona y te confirmamos día y franja horaria.'],
              ['Conocés quién va', 'Antes de la visita ves su nombre, su matrícula cuando corresponde y las opiniones de otros clientes.'],
              ['Pagás y calificás', 'Pagás el precio acordado al terminar, sin comisión para vos, y calificás el trabajo.'],
            ].map(([t, d], i) => (
              <li key={t} className="grid content-start gap-2.5">
                <span className="font-display text-[44px] font-extrabold leading-none text-primary-ink" style={{ fontStretch: '75%' }}>
                  {i + 1}
                </span>
                <h3 className="h3">{t}</h3>
                <p className="text-[15px] text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Por qué AyudaYa</p>
            <h2 className="h2">Lo que nadie te asegura cuando llamás a alguien que no conocés</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[14px] border border-border bg-border sm:grid-cols-2">
            {[
              ['Sabés quién entra a tu casa', 'Cada prestador pasa una verificación: DNI, matrícula para gas y electricidad, y referencias de trabajos anteriores.'],
              ['El precio no cambia al final', 'Publicamos el precio antes de que pidas. Cualquier extra se aprueba antes de empezar, nunca después.'],
              ['Sin comisión para vos', 'El precio del tarifario es lo que pagás. AyudaYa cobra una comisión al prestador, no al cliente.'],
              ['Respuesta en el día', 'Coordinamos el horario apenas recibimos tu pedido, en lugar de esperar días a que alguien conteste.'],
              ['Si algo falla, vuelve', 'Si el arreglo falla dentro de los 30 días, el prestador vuelve sin costo.'],
              ['Atención humana y local', 'Somos de Mar del Plata. Si preferís, pedís y consultás por WhatsApp.'],
            ].map(([t, d]) => (
              <div key={t} className="grid content-start gap-2 bg-card p-6">
                <h3 className="h3">{t}</h3>
                <p className="text-[15px] text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pedido" className="border-t border-border py-16">
        <div className="wrap grid items-start gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">Pedí tu servicio</p>
            <h2 className="h2 mt-3">Contanos qué pasa y te confirmamos el horario</h2>
            <p className="lead mt-3.5">Creá tu cuenta una sola vez y seguí tu pedido online: quién va, cuándo llega, presupuestos adicionales y calificación.</p>
            <ul className="mt-6 grid gap-3.5 text-[15px]">
              {[
                'No pagás nada hasta que el trabajo esté hecho.',
                'Atendemos de lunes a sábado, de 8 a 20 h.',
                'Para una pérdida de gas, cerrá la llave general, ventilá y llamá a la guardia de emergencias de Camuzzi antes de pedir.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-ok" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="ui-form">
            <h3 className="h3">Dos formas de pedir</h3>
            <Link href="/pedido/nuevo" className="btn btn-primary">
              Pedir con mi cuenta
            </Link>
            <p className="hint">Elegís servicio, barrio, día y franja. Ves el precio cerrado antes de confirmar.</p>
            <div className="border-t border-border pt-4">
              <a href={waPedido} target="_blank" rel="noopener" className="btn btn-wa w-full">
                Pedir por WhatsApp
              </a>
              <p className="hint mt-2">
                Sin registrarte: escribinos al <span className="num">{whatsappLabel()}</span> y coordinamos por ahí.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="prestadores" className="border-t border-border py-16">
        <div className="wrap">
          <div className="prestadores-band grid items-center gap-8 p-6 sm:p-11 md:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="eyebrow" style={{ color: 'inherit', opacity: 0.7 }}>
                Para prestadores
              </p>
              <h2 className="h2 mt-3">¿Sos plomero, gasista o electricista en Mar del Plata?</h2>
              <p className="lead mt-3.5" style={{ color: '#C9D3DE' }}>
                Sumate al piloto y recibí trabajos de tu zona sin gastar en publicidad.
              </p>
              <ul className="mt-4 grid list-disc gap-1.5 pl-5">
                <li>Aceptás o rechazás cada pedido que te asignamos.</li>
                <li>Cobrás el precio publicado; AyudaYa se queda con una comisión del 15% solo por los trabajos que terminás. Sin abono mensual.</li>
                <li>Tus calificaciones te consiguen más clientes.</li>
              </ul>
            </div>
            <a className="btn btn-primary justify-self-start" href={waPrestador} target="_blank" rel="noopener">
              Quiero sumarme
            </a>
          </div>
        </div>
      </section>

      <section id="preguntas" className="border-t border-border py-16">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2 className="h2">Antes de pedir</h2>
          </div>
          {[
            ['¿El precio puede cambiar?', 'No sin tu aprobación. El precio publicado es el final para ese trabajo. Si el prestador encuentra algo más, te manda un presupuesto por la plataforma y decidís si seguir antes de que empiece.'],
            ['¿Pago alguna comisión?', 'No. El precio del tarifario es lo que pagás. AyudaYa cobra una comisión del 15% al prestador, nunca al cliente.'],
            ['¿Cómo pago?', 'Cuando el trabajo está terminado, le pagás al prestador el precio acordado (efectivo, transferencia o Mercado Pago). No hace falta pagar por adelantado.'],
            ['¿En qué zonas atienden?', 'Estamos en etapa piloto en Mar del Plata. Si tu barrio todavía no está cubierto, te avisamos al recibir el pedido.'],
            ['¿Quiénes son los prestadores?', 'Profesionales independientes que seleccionamos por experiencia y responsabilidad. Verificamos su identidad, su matrícula cuando el trabajo la exige y sus referencias.'],
          ].map(([q, a]) => (
            <details key={q} className="faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
