import type { Metadata } from 'next'
import { ActionForm } from '@/components/forms'
import { PageShell } from '@/components/site/page-shell'
import { PerfilFields } from '@/components/site/perfil-fields'
import { getPerfilHogar, requireHogar } from '@/lib/guards'
import { guardarDatosHogar } from '../hogar-actions'

export const metadata: Metadata = { title: 'Tus datos', robots: { index: false, follow: false } }
// Lee la sesión antes de responder (sin sesión → /ingresar).
export const instant = false

export default async function CompletarDatosPage({ searchParams }: PageProps<'/completar-datos'>) {
  const sp = await searchParams
  const next = typeof sp.next === 'string' ? sp.next : '/mis-pedidos'
  const user = await requireHogar('/completar-datos')
  const perfil = await getPerfilHogar(user.id)

  return (
    <PageShell>
      <div className="wrap max-w-[620px] py-12">
        <ActionForm action={guardarDatosHogar} submitLabel="Guardar datos" className="ui-form" submitClassName="btn btn-primary">
          <div className="sec-head mb-2">
            <p className="eyebrow">Tus datos</p>
            <h1 className="h2">{perfil ? 'Actualizá tus datos' : 'Completá tus datos'}</h1>
            <p className="lead">Los necesitamos para que el profesional sepa adónde ir.</p>
          </div>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="nombre">Nombre y apellido</label>
            <input id="nombre" name="nombre" required maxLength={80} defaultValue={user.name} className="ui-input" />
          </div>
          <PerfilFields inicial={perfil} />
        </ActionForm>
      </div>
    </PageShell>
  )
}
