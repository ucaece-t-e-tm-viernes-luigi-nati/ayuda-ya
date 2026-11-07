import type { Metadata } from 'next'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, PageTitle, StatusBadge } from '@/components/panel/ui'
import { BARRIOS, DIAS_SEMANA, FRANJAS, matriculaNombre, rubroNombre } from '@/lib/catalogo'
import { q1 } from '@/lib/db'
import { formatDate } from '@/lib/dates'
import { requirePrestador } from '@/lib/guards'
import { actualizarPerfil } from '../actions'

export const metadata: Metadata = { title: 'Mi perfil' }

const chip = 'flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10'

type Datos = { dias?: string[]; franjas?: string[]; urgencias?: boolean; vehiculo?: boolean; herramientas?: string; seguro?: string; experiencia?: number; dni?: string }

export default async function PerfilPrestadorPage() {
  const ctx = await requirePrestador('perfil.edit')
  const c = await q1<{
    name: string
    tax_id: string | null
    phone: string | null
    contact_email: string | null
    rubros: string[]
    zonas: string[]
    matricula_tipo: string | null
    matricula_numero: string | null
    verificacion: string
    verificado_at: Date | null
    data: Datos
  }>(
    `SELECT name, tax_id, phone, contact_email, rubros, zonas, matricula_tipo, matricula_numero, verificacion, verificado_at, data FROM client WHERE id = $1`,
    [ctx.clientId],
  )
  if (!c) return null
  const d = c.data ?? {}
  return (
    <>
      <PageTitle eyebrow="Panel de prestadores" title="Mi perfil" description="Rubros y matrícula los cambia el equipo de AyudaYa (hay que volver a verificarlos)." />
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Datos verificados">
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{c.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">CUIT</dt>
              <dd className="font-medium">{c.tax_id ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rubros</dt>
              <dd className="font-medium">{c.rubros.map(rubroNombre).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Matrícula</dt>
              <dd className="font-medium">
                {matriculaNombre(c.matricula_tipo)}
                {c.matricula_numero ? ` · N.º ${c.matricula_numero}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Verificación</dt>
              <dd className="flex items-center gap-2">
                <StatusBadge status={c.verificacion} /> {c.verificado_at && <span className="text-xs text-muted-foreground">{formatDate(c.verificado_at)}</span>}
              </dd>
            </div>
          </dl>
        </Card>
        <Card title="Zonas, disponibilidad y contacto">
          <ActionForm action={actualizarPerfil} submitLabel="Guardar cambios" disabled={ctx.readOnly}>
            <label className={`${labelClass} max-w-xs`}>
              WhatsApp
              <input name="phone" required defaultValue={c.phone ?? ''} className={inputClass} />
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Barrios donde trabajás</legend>
              <div className="flex flex-wrap gap-2">
                {BARRIOS.filter((b) => b !== 'Otro').map((b) => (
                  <label key={b} className={chip}>
                    <input type="checkbox" name="zonas" value={b} defaultChecked={c.zonas.includes(b)} /> {b}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Días</legend>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <label key={dia} className={chip}>
                    <input type="checkbox" name="dias" value={dia} defaultChecked={d.dias ? d.dias.includes(dia) : dia !== 'Domingo'} /> {dia}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Franjas</legend>
              <div className="flex flex-wrap gap-2">
                {FRANJAS.map((f) => (
                  <label key={f.id} className={chip}>
                    <input type="checkbox" name="franjas" value={f.id} defaultChecked={d.franjas ? d.franjas.includes(f.id) : true} /> {f.rango}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="urgencias" defaultChecked={d.urgencias} /> Tomo urgencias en el día
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="vehiculo" defaultChecked={d.vehiculo} /> Tengo vehículo propio
              </label>
            </div>
            <label className={labelClass}>
              Herramientas y equipos
              <input name="herramientas" maxLength={300} defaultValue={d.herramientas ?? ''} className={inputClass} />
            </label>
            <label className={labelClass}>
              Seguro
              <input name="seguro" maxLength={200} defaultValue={d.seguro ?? ''} className={inputClass} />
            </label>
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
