"use client";
import { useState } from "react";

export type DatosPerfil = {
  nombre: string; celular: string; direccion: string; barrio: string;
  ciudad: string; provincia: string; codigo_postal: string; indicaciones: string;
};

const PROVINCIAS = ["Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"];

// Campos de contacto compartidos entre registro y "completar datos".
// Con `conCuenta` también pide mail y contraseña.
export default function FormPerfil({
  conCuenta, boton, onSubmit, inicial,
}: {
  conCuenta: boolean;
  boton: string;
  inicial?: Partial<DatosPerfil>;
  onSubmit: (d: DatosPerfil & { email: string; password: string }) => Promise<string | void>;
}) {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const celular = v("celular").replace(/[^\d+]/g, "");
    if (celular.replace(/\D/g, "").length < 8) return setError("Revisá el número de celular.");
    if (conCuenta && v("password").length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres.");
    setError("");
    setCargando(true);
    const msg = await onSubmit({
      nombre: v("nombre"), celular, direccion: v("direccion"), barrio: v("barrio"),
      ciudad: v("ciudad"), provincia: v("provincia"), codigo_postal: v("codigo_postal"),
      indicaciones: v("indicaciones"), email: v("email"), password: v("password"),
    });
    setCargando(false);
    if (msg) setError(msg);
  }

  return (
    <form className="card" onSubmit={enviar}>
      <p className="label">Tus datos</p>
      <div className="field"><label htmlFor="nombre">Nombre y apellido</label><input id="nombre" name="nombre" required autoComplete="name" defaultValue={inicial?.nombre} /></div>
      <div className="two">
        <div className="field"><label htmlFor="celular">Celular (WhatsApp)</label><input id="celular" name="celular" type="tel" required autoComplete="tel" placeholder="Con código de área" defaultValue={inicial?.celular} /></div>
        {conCuenta && <div className="field"><label htmlFor="email">Mail</label><input id="email" name="email" type="email" required autoComplete="email" /></div>}
      </div>

      <p className="label" style={{ marginTop: 8 }}>Dónde te visitamos</p>
      <div className="field"><label htmlFor="direccion">Dirección</label><input id="direccion" name="direccion" required autoComplete="address-line1" placeholder="Calle y número, piso / depto" defaultValue={inicial?.direccion} /></div>
      <div className="two">
        <div className="field"><label htmlFor="barrio">Barrio (opcional)</label><input id="barrio" name="barrio" defaultValue={inicial?.barrio} /></div>
        <div className="field"><label htmlFor="codigo_postal">Código postal</label><input id="codigo_postal" name="codigo_postal" autoComplete="postal-code" defaultValue={inicial?.codigo_postal} /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="ciudad">Ciudad</label><input id="ciudad" name="ciudad" required autoComplete="address-level2" defaultValue={inicial?.ciudad} /></div>
        <div className="field">
          <label htmlFor="provincia">Provincia</label>
          <select id="provincia" name="provincia" required defaultValue={inicial?.provincia ?? ""}>
            <option value="" disabled>Elegí una</option>
            {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label htmlFor="indicaciones">Indicaciones para llegar (opcional)</label><input id="indicaciones" name="indicaciones" placeholder="Timbre, entre calles, portón, etc." defaultValue={inicial?.indicaciones} /></div>

      {conCuenta && (
        <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /><span className="hint">Mínimo 8 caracteres.</span></div>
      )}
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}>
        <input type="checkbox" required style={{ width: 20, marginTop: 3 }} />
        <span>Acepto que AyudaYa comparta mi dirección y celular con el profesional que elija, solo para coordinar la visita.</span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={cargando}>{cargando ? "Guardando…" : boton}</button>
    </form>
  );
}
