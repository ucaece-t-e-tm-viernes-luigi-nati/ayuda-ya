"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Icono from "./Icono";

export default function TabBar() {
  const path = usePathname();
  const [logueado, setLogueado] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogueado(!!data.session)).catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setLogueado(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  const item = (href: string, n: string, t: string) => (
    <Link href={href} aria-current={path === href ? "page" : undefined}><Icono n={n} />{t}</Link>
  );
  return (
    <nav className="tabbar" aria-label="Navegación principal">
      {item("/", "inicio", "Inicio")}
      {item("/mis-pedidos", "pedidos", "Mis pedidos")}
      {logueado ? item("/completar-datos", "perfil", "Perfil") : item("/login", "perfil", "Ingresar")}
    </nav>
  );
}
