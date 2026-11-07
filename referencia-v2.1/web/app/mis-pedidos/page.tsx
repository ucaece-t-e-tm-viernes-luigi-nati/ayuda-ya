"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { nombreOficio, rangoTurno } from "@/lib/datos";

type Pedido = { id: string; oficio: string; dia: string; turno: string; estado: string; ofertas: { count: number }[] };

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("id,oficio,dia,turno,estado,ofertas!ofertas_pedido_id_fkey(count)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("No pudimos cargar tus pedidos. ¿Ingresaste?");
        setPedidos((data as unknown as Pedido[]) ?? []);
      });
  }, []);

  return (
    <main className="wrap narrow">
      <div className="sec-head"><span className="caño" aria-hidden /><h2>Mis pedidos</h2></div>
      {error && <p className="error">{error} <Link href="/login">Ingresar</Link></p>}
      {pedidos?.length === 0 && !error && <p className="lead">Todavía no publicaste nada. <Link href="/">Contanos tu problema</Link>.</p>}
      <div className="lista">
        {pedidos?.map((p) => (
          <Link key={p.id} href={`/pedido/${p.id}`} className="item">
            <div><b>{nombreOficio(p.oficio)}</b><br /><small>{p.dia} · {rangoTurno(p.turno)}</small></div>
            <span className="pill">{p.estado === "publicado" ? `${p.ofertas?.[0]?.count ?? 0} ofertas` : p.estado}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
