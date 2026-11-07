"use client";
import Link from "next/link";
import { useState } from "react";
import { OFICIOS } from "@/lib/datos";
import Icono from "@/components/Icono";

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Home() {
  const [q, setQ] = useState("");
  const lista = OFICIOS.filter((o) => !q || norm(o.nombre + " " + o.ejemplo).includes(norm(q)));

  return (
    <main className="wrap">
      <h1 className="hero-h">¿Qué necesitás <em>resolver hoy?</em></h1>
      <p className="lead" style={{ marginTop: 12 }}>Elegí el oficio, contanos qué pasa con una foto y los profesionales verificados compiten con su mejor precio.</p>

      <div className="buscador">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá un servicio…" aria-label="Buscar un servicio" />
        <span className="lupa"><svg viewBox="0 0 24 24" stroke="#fff" fill="none" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg></span>
      </div>

      <div className="tiles">
        {lista.map((o, i) => (
          <Link key={o.id} href={`/pedido/nuevo?oficio=${o.id}`} className={`tile${i === 0 && !q ? " destacado" : o.id === "aire" && !q ? " oscuro" : ""}`}>
            <Icono n={o.id} />
            <span><b>{o.nombre}</b><small>{o.ejemplo}</small></span>
          </Link>
        ))}
        {lista.length === 0 && <p className="sin-resultados">No encontramos ese servicio. Probá con “Otro oficio” y contanos qué necesitás.</p>}
      </div>

      <a className="banda" href="/registro">
        <span><b>Los profesionales compiten por tu precio</b><span>Publicá tu problema y elegí la mejor oferta.</span></span>
        <i className="flecha"><Icono n="flecha" /></i>
      </a>

      <div className="garantias">
        <div className="garantia"><i><Icono n="escudo" /></i><span><b>Profesionales verificados</b>Identidad y matrícula controladas.</span></div>
        <div className="garantia"><i><Icono n="estrella" /></i><span><b>Precios claros</b>La oferta que elegís queda cerrada.</span></div>
        <div className="garantia"><i><Icono n="reloj" /></i><span><b>Rápido y seguro</b>Elegís día y turno de 4 horas.</span></div>
      </div>
    </main>
  );
}
