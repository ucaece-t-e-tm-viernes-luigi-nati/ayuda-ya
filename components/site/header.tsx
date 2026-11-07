import Link from 'next/link'
import { Brand } from './brand'

// Header del sitio público. Solo superficie de hogares: NUNCA linkea a /empresa ni a /plataforma.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border backdrop-blur" style={{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
      <div className="wrap flex items-center justify-between gap-4 py-3">
        <Brand suffix="Mar del Plata · piloto" />
        <nav className="flex items-center gap-2" aria-label="Principal">
          <Link href="/mis-pedidos" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Mis pedidos
          </Link>
          <Link href="/pedido/nuevo" className="btn btn-primary btn-sm">
            Pedir un servicio
          </Link>
        </nav>
      </div>
    </header>
  )
}
