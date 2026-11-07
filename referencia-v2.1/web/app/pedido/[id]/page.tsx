"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { nombreOficio, pesos, rangoTurno } from "@/lib/datos";

type Pedido = { id: string; oficio: string; descripcion: string; foto_path: string | null; dia: string; turno: string; estado: string; oferta_elegida: string | null; puja_cierra_at: string | null };
type Oferta = { id: string; monto: number; nota: string | null; created_at: string };

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [foto, setFoto] = useState("");
  const [error, setError] = useState("");
  const [cargado, setCargado] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const cargar = useCallback(async () => {
    const [p, o] = await Promise.all([
      supabase.from("pedidos").select("*").eq("id", id).maybeSingle(),
      supabase.from("ofertas").select("id,monto,nota,created_at").eq("pedido_id", id).order("monto", { ascending: true }),
    ]);
    setCargado(true);
    if (p.data) setPedido(p.data as Pedido);
    if (o.data) setOfertas(o.data as Oferta[]);
  }, [id]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000); // las ofertas llegan mientras mirás la pantalla
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    if (!pedido?.foto_path) return;
    supabase.storage.from("fotos").createSignedUrl(pedido.foto_path, 3600).then(({ data }) => setFoto(data?.signedUrl ?? ""));
  }, [pedido?.foto_path]);

  async function elegir(ofertaId: string) {
    setError("");
    const { error: err } = await supabase.from("pedidos").update({ oferta_elegida: ofertaId, estado: "asignado" }).eq("id", id);
    if (err) return setError(err.message);
    cargar();
  }

  if (!cargado) return <main className="wrap narrow"><p className="lead">Cargando…</p></main>;
  if (!pedido) return <main className="wrap narrow"><p className="lead">No encontramos este pedido. <Link href="/login">Ingresá</Link> o volvé a <Link href="/mis-pedidos">tus pedidos</Link>.</p></main>;

  const elegida = ofertas.find((o) => o.id === pedido.oferta_elegida);
  const minimo = ofertas[0]?.monto;
  const cierre = pedido.puja_cierra_at ? new Date(pedido.puja_cierra_at).getTime() : null;
  const restante = cierre ? cierre - ahora : null;
  const abierta = restante !== null && restante > 0;
  const cerrada = restante !== null && restante <= 0;
  const reloj = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  };

  return (
    <main className="wrap">
      <div className="sec-head">
        <span className="caño" aria-hidden />
        <p className="eyebrow">Paso 3 de 3</p>
        <h2>{elegida ? "Elegiste tu profesional" : "Ofertas para tu pedido"}</h2>
      </div>
      <div className="layout2">
        <div className="resumen">
          <div className="row"><span>Oficio</span><span>{nombreOficio(pedido.oficio)}</span></div>
          <div className="row"><span>Visita</span><span>{pedido.dia} · {rangoTurno(pedido.turno)}</span></div>
          <div className="row"><span>Problema</span><span>{pedido.descripcion}</span></div>
          {foto && <img className="preview" src={foto} alt="Foto del problema" />}
        </div>
        <div>
          {elegida ? (
            <div className="ok">Oferta elegida: {pesos(elegida.monto)}. Ese precio queda cerrado. Te contactamos para confirmar la visita.</div>
          ) : ofertas.length === 0 ? (
            <div className="card"><h3>Esperando ofertas</h3><p className="lead">Los prestadores verificados ya pueden ver tu pedido. Cuando llegue la primera oferta, arranca una cuenta regresiva de 1 hora para que compitan por el mejor precio. Esta pantalla se actualiza sola.</p></div>
          ) : (
            <div className="ofertas">
              {abierta ? (
                <div className="aviso" role="timer">
                  Puja abierta: cierra en <b className="num">{reloj(restante!)}</b>. Los prestadores pueden seguir bajando su precio. Vas a poder elegir cuando termine.
                </div>
              ) : (
                <div className="aviso">La puja cerró. Elegí la oferta que prefieras.</div>
              )}
              <p className="hint">Ordenadas de menor a mayor precio.</p>
              {ofertas.map((o) => (
                <div key={o.id} className={`oferta${o.monto === minimo ? " mejor" : ""}`}>
                  <div>
                    <div className="monto">{pesos(o.monto)}</div>
                    <div className="meta">{o.monto === minimo ? "Menor precio · " : ""}{o.nota ?? "Mano de obra"}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" disabled={!cerrada} onClick={() => elegir(o.id)}>Elegir</button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </div>
    </main>
  );
}
