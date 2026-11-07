import Link from 'next/link'
import { site } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-7 pb-10 text-[13px] text-muted-foreground">
      <div className="wrap flex flex-wrap justify-between gap-3">
        <span>AyudaYa · Servicios para el hogar en Mar del Plata</span>
        <span className="flex flex-wrap gap-3">
          <Link href="/mis-pedidos" className="underline-offset-2 hover:underline">
            Mis pedidos
          </Link>
          <span>Piloto 2026 · {site.course}</span>
        </span>
      </div>
    </footer>
  )
}
