"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [logueado, setLogueado] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogueado(!!data.session)).catch(() => setLogueado(false));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setLogueado(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="top">
      <div className="wrap bar">
        <Link href="/" className="logo">
          <b>Ayuda<span>Ya</span></b>
          <small>Servicios para el hogar</small>
        </Link>
        <nav className="nav">
          {logueado ? (
            <>
              <Link href="/mis-pedidos" className="btn btn-ghost btn-sm">Mis pedidos</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
              <Link href="/registro" className="btn btn-primary btn-sm">Registrarme</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
