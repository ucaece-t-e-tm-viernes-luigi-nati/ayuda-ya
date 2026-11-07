"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Config from "@/components/Config";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setCargando(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (err || !data.user) {
      setCargando(false);
      return setError("Mail o contraseña incorrectos.");
    }
    const { data: perfil } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    setCargando(false);
    router.push(perfil ? "/" : "/completar-datos");
  }

  return (
    <main className="wrap narrow">
      <div className="sec-head"><span className="caño" aria-hidden /><h2>Ingresar</h2></div>
      <Config />
      <form className="card" onSubmit={enviar}>
        <div className="field"><label htmlFor="email">Mail</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={cargando}>{cargando ? "Ingresando…" : "Ingresar"}</button>
        <p className="hint">¿No tenés cuenta? <Link href="/registro">Registrate</Link></p>
      </form>
    </main>
  );
}
