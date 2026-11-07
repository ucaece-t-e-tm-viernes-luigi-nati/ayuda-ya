import { configurado } from "@/lib/supabase";

export default function Config() {
  if (configurado) return null;
  return (
    <div className="aviso">
      Falta conectar Supabase: copiá <code>.env.example</code> a <code>.env.local</code> y completá la URL y la clave.
    </div>
  );
}
