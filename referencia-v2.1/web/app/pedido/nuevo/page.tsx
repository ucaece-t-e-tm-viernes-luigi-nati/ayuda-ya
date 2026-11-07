"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { OFICIOS, TURNOS, nombreOficio } from "@/lib/datos";
import Config from "@/components/Config";

const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function Formulario() {
  const router = useRouter();
  const oficio = useSearchParams().get("oficio") ?? "";
  const valido = OFICIOS.some((o) => o.id === oficio);
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [turno, setTurno] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setUid(null);
      const { data: perfil } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
      if (!perfil) return router.replace("/completar-datos");
      setUid(data.user.id);
    }).catch(() => setUid(null));
  }, [router]);
  useEffect(() => {
    if (!foto) return setPreview("");
    const url = URL.createObjectURL(foto);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  if (!valido) return <p>Elegí primero un oficio en <Link href="/">la portada</Link>.</p>;
  if (uid === null)
    return (
      <div className="card">
        <p>Para publicar tu problema necesitás una cuenta, así el profesional sabe adónde ir.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/registro">Crear cuenta</Link>
          <Link className="btn btn-ghost" href="/login">Ya tengo cuenta</Link>
        </div>
      </div>
    );

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uid) return;
    const f = new FormData(e.currentTarget);
    if (!turno) return setError("Elegí un turno.");
    if (foto && foto.size > 8 * 1024 * 1024) return setError("La foto pesa más de 8 MB.");
    setError("");
    setEnviando(true);
    let foto_path: string | null = null;
    if (foto) {
      const ext = (foto.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      foto_path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error: ferr } = await supabase.storage.from("fotos").upload(foto_path, foto, { contentType: foto.type });
      if (ferr) {
        setEnviando(false);
        return setError("No se pudo subir la foto: " + ferr.message);
      }
    }
    const { data, error: err } = await supabase
      .from("pedidos")
      .insert({ cliente_id: uid, oficio, descripcion: String(f.get("descripcion")).trim(), foto_path, dia: String(f.get("dia")), turno })
      .select("id")
      .single();
    setEnviando(false);
    if (err || !data) return setError(err?.message ?? "No pudimos publicar el pedido. ¿Completaste tus datos en el registro?");
    router.push(`/pedido/${data.id}`);
  }

  return (
    <form className="card" onSubmit={enviar}>
      <div className="field">
        <label htmlFor="descripcion">¿Qué está pasando?</label>
        <textarea id="descripcion" name="descripcion" required minLength={10} placeholder="Ej: pierde agua el sifón de la bacha de la cocina desde ayer" />
      </div>
      <div className="field">
        <label htmlFor="foto">Foto del problema</label>
        <input id="foto" type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        <span className="hint">Opcional, pero ayuda a que coticen mejor.</span>
        {preview && <img className="preview" src={preview} alt="Vista previa de la foto" />}
      </div>
      <div className="field">
        <label htmlFor="dia">Día preferido de la visita</label>
        <input id="dia" name="dia" type="date" required min={hoy()} />
      </div>
      <div className="field">
        <span className="label">Turno</span>
        <div className="turnos" role="group" aria-label="Turno">
          {TURNOS.map((t) => (
            <button type="button" key={t.id} className="turno" aria-pressed={turno === t.id} onClick={() => setTurno(t.id)}>
              <b>{t.rango}</b><span>{t.nombre}</span>
            </button>
          ))}
        </div>
        <span className="hint">Son 4 horas de margen: el profesional llega dentro del turno que elijas.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={enviando}>{enviando ? "Publicando…" : "Publicar y recibir ofertas"}</button>
    </form>
  );
}

function Titulo() {
  const oficio = useSearchParams().get("oficio") ?? "";
  return <span className="pill">{nombreOficio(oficio) || "Oficio"}</span>;
}

export default function NuevoPedido() {
  return (
    <main className="wrap narrow">
      <div className="sec-head">
        <span className="caño" aria-hidden />
        <p className="eyebrow">Paso 2 de 3</p>
        <h2>Contanos tu problema</h2>
        <div><Suspense><Titulo /></Suspense> <Link href="/" className="hint">cambiar oficio</Link></div>
      </div>
      <Config />
      <Suspense><Formulario /></Suspense>
    </main>
  );
}
