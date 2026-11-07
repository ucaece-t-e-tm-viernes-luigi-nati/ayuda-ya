"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Config from "@/components/Config";
import FormPerfil from "@/components/FormPerfil";

export default function CompletarDatos() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email ?? "" } : null)).catch(() => setUser(null));
  }, []);

  return (
    <main className="wrap narrow">
      <div className="sec-head">
        <span className="caño" aria-hidden />
        <h2>Completá tus datos</h2>
        <p className="lead">Los necesitamos para que el profesional sepa adónde ir.</p>
      </div>
      <Config />
      {user === null && <p>Primero <a href="/login">ingresá</a>.</p>}
      {user && (
        <FormPerfil
          conCuenta={false}
          boton="Guardar datos"
          onSubmit={async (perfil) => {
            const { error } = await supabase.from("profiles").upsert({
              id: user.id, email: user.email, nombre: perfil.nombre, celular: perfil.celular, direccion: perfil.direccion,
              ciudad: perfil.ciudad, provincia: perfil.provincia, barrio: perfil.barrio || null,
              codigo_postal: perfil.codigo_postal || null, indicaciones: perfil.indicaciones || null,
            });
            if (error) return error.message;
            router.push("/");
          }}
        />
      )}
    </main>
  );
}
