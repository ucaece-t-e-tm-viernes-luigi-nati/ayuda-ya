import type { Metadata } from 'next'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { Card, PageTitle } from '@/components/panel/ui'
import { RUBROS, rubroNombre } from '@/lib/catalogo'
import { listServiciosAdmin } from '@/lib/data/servicios'
import { requireSuperadmin } from '@/lib/guards'
import { saveServicio } from '../actions'

export const metadata: Metadata = { title: 'Tarifario' }

type S = { codigo?: string; rubro?: string; nombre?: string; descripcion?: string; precio?: number; activo?: boolean; orden?: number }

function ServicioForm({ s, nuevo }: { s: S; nuevo?: boolean }) {
  return (
    <ActionForm action={saveServicio} submitLabel={nuevo ? 'Crear servicio' : 'Guardar'} className="grid gap-3" resetOnSuccess={nuevo}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[110px_160px_minmax(0,1fr)_130px_80px]">
        <label className={labelClass}>
          Código
          <input name="codigo" required defaultValue={s.codigo} readOnly={!nuevo} placeholder="PL-05" maxLength={5} className={`${inputClass} font-mono uppercase`} />
        </label>
        <label className={labelClass}>
          Rubro
          <select name="rubro" defaultValue={s.rubro ?? 'plomeria'} className={inputClass}>
            {RUBROS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} col-span-2 sm:col-span-1`}>
          Nombre
          <input name="nombre" required defaultValue={s.nombre} maxLength={100} className={inputClass} />
        </label>
        <label className={labelClass}>
          Precio ($)
          <input name="precio" required inputMode="numeric" defaultValue={s.precio} className={inputClass} />
        </label>
        <label className={labelClass}>
          Orden
          <input name="orden" type="number" defaultValue={s.orden ?? 0} className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        Descripción
        <input name="descripcion" defaultValue={s.descripcion} maxLength={300} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={s.activo ?? true} /> Publicado en el tarifario
      </label>
    </ActionForm>
  )
}

export default async function TarifarioAdminPage() {
  await requireSuperadmin()
  const servicios = await listServiciosAdmin()
  return (
    <>
      <PageTitle
        eyebrow="Plataforma"
        title="Tarifario"
        description="Precios de mano de obra que ve el público. Al guardar se actualiza la portada; los pedidos ya hechos mantienen su precio cerrado."
      />
      <Card title="Nuevo servicio" className="mb-5">
        <ServicioForm s={{}} nuevo />
      </Card>
      <div className="flex flex-col gap-4">
        {servicios.map((s) => (
          <Card key={s.codigo} title={`${s.codigo} · ${s.nombre}`} description={`${rubroNombre(s.rubro)} · ${s.pedidos} pedidos${s.activo ? '' : ' · NO publicado'}`}>
            <ServicioForm s={s} />
          </Card>
        ))}
      </div>
    </>
  )
}
