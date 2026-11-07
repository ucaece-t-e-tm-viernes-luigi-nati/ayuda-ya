import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageShell } from '@/components/site/page-shell'
import { getTarifario } from '@/lib/data/servicios'
import { addDays, dayKeyAR } from '@/lib/dates'
import { getPerfilHogar, requireHogar } from '@/lib/guards'
import { whatsappLabel } from '@/lib/site'
import { NuevoPedidoForm } from './form'

export const metadata: Metadata = { title: 'Pedir un servicio', robots: { index: false, follow: false } }
// Lee la sesión antes de responder: sin cuenta → /ingresar (y vuelve acá con el servicio elegido).
export const instant = false

export default async function NuevoPedidoPage({ searchParams }: PageProps<'/pedido/nuevo'>) {
  const sp = await searchParams
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const servicio = one('servicio').toUpperCase().slice(0, 5)
  const origen = one('origen')
  const detalle = one('detalle').slice(0, 900)
  const qs = new URLSearchParams({ ...(servicio && { servicio }), ...(origen && { origen }), ...(detalle && { detalle }) }).toString()
  const aqui = `/pedido/nuevo${qs ? `?${qs}` : ''}`

  const user = await requireHogar(aqui)
  const perfil = await getPerfilHogar(user.id)
  if (!perfil) redirect(`/completar-datos?next=${encodeURIComponent(aqui)}`)
  const servicios = await getTarifario()
  const hoy = dayKeyAR()

  return (
    <PageShell>
      <div className="wrap grid items-start gap-10 py-12 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <div className="sec-head">
            <p className="eyebrow">Pedí tu servicio</p>
            <h1 className="h2">Contanos qué pasa y te confirmamos el horario</h1>
            <p className="lead">Ves el precio cerrado antes de confirmar. No pagás nada hasta que el trabajo esté hecho, y AyudaYa no te cobra comisión.</p>
          </div>
          <div className="alerta">
            <b>¿Pérdida de gas?</b>
            Cerrá la llave general, ventilá y llamá a la guardia de emergencias de Camuzzi antes de pedir.
          </div>
          <p className="hint mt-4">
            ¿Preferís no usar la web? Escribinos por WhatsApp al <span className="num">{whatsappLabel()}</span>; también podés enviar este mismo pedido por ahí desde
            el formulario.
          </p>
        </div>
        <NuevoPedidoForm
          servicios={servicios}
          inicial={{
            servicio: servicios.some((s) => s.codigo === servicio) ? servicio : '',
            origen: ['asistente_ia', 'palabras_clave'].includes(origen) ? origen : 'tarifario',
            problema: detalle,
            barrio: perfil.barrio,
            direccion: perfil.direccion,
            nombre: user.name,
            celular: perfil.celular,
          }}
          minDia={hoy}
          maxDia={addDays(hoy, 60)}
        />
      </div>
    </PageShell>
  )
}
