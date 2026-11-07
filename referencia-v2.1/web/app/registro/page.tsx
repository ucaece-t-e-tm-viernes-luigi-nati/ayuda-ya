"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Config from "@/components/Config";
import FormPerfil from "@/components/FormPerfil";

export default function Registro() {
  const router = useRouter();
  return (
    <main className="wrap narrow">
      <div className="sec-head">
        <span className="caño" aria-hidden />
        <h2>Creá tu cuenta</h2>
        <p className="lead">Guardamos tus datos de contacto para que el profesional sepa adónde ir cuando elijas una oferta.</p>
      </div>
      <Config />
      <FormPerfil
        conCuenta
        boton="Crear cuenta"
        onSubmit={async ({ password, email, ...perfil }) => {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error || !data.user) return error?.message ?? "No pudimos crear la cuenta.";
          if (!data.session) return "Te mandamos un mail para confirmar la cuenta. Confirmalo, ingresá y completá tus datos.";
          const { error: perr } = await supabase.from("profiles").insert({ id: data.user.id, email, ...perfil, barrio: perfil.barrio || null, codigo_postal: perfil.codigo_postal || null, indicaciones: perfil.indicaciones || null });
          if (perr) return "La cuenta se creó pero no se guardaron tus datos: " + perr.message;
          router.push("/");
        }}
      />
      <p className="hint" style={{ marginTop: 14 }}>¿Ya tenés cuenta? <Link href="/login">Ingresá</Link></p>
    </main>
  );
}
