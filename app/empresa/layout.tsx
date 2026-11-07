import type { Metadata } from 'next'

// Superficie de PRESTADORES (clientes B2B, "empresa"). No se linkea desde la parte pública; no se indexa.
export const metadata: Metadata = {
  title: { default: 'Panel de prestadores', template: '%s · Panel de prestadores | AyudaYa' },
  robots: { index: false, follow: false, nocache: true },
}

export default function EmpresaLayout({ children }: LayoutProps<'/empresa'>) {
  return <div className="min-h-screen bg-background">{children}</div>
}
