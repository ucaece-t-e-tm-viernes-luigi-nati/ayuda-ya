import { BARRIOS } from '@/lib/catalogo'

type Inicial = { celular?: string | null; barrio?: string | null; direccion?: string | null; indicaciones?: string | null }

/** Campos de contacto y dirección del hogar (registro y "completar datos"). */
export function PerfilFields({ inicial }: { inicial?: Inicial | null }) {
  return (
    <>
      <div className="field">
        <label htmlFor="celular">Celular (WhatsApp)</label>
        <input id="celular" name="celular" type="tel" required autoComplete="tel" placeholder="223 555-1234" defaultValue={inicial?.celular ?? ''} className="ui-input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="barrio">Barrio</label>
          <select id="barrio" name="barrio" required defaultValue={inicial?.barrio ?? ''} className="ui-input">
            <option value="" disabled>
              Elegí tu barrio
            </option>
            {BARRIOS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <input id="direccion" name="direccion" required maxLength={160} autoComplete="address-line1" placeholder="Calle y número, piso / depto" defaultValue={inicial?.direccion ?? ''} className="ui-input" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="indicaciones">Indicaciones para llegar (opcional)</label>
        <input id="indicaciones" name="indicaciones" maxLength={200} placeholder="Timbre, entre calles, portón, etc." defaultValue={inicial?.indicaciones ?? ''} className="ui-input" />
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="acepta" required className="mt-1 size-4" defaultChecked={!!inicial?.direccion} />
        <span>Acepto que AyudaYa comparta mi dirección y celular con el profesional asignado, solo para coordinar la visita.</span>
      </label>
    </>
  )
}
