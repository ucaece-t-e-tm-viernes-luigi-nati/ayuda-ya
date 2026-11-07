import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono, Public_Sans } from 'next/font/google'
import { site } from '@/lib/site'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-plex-mono', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'AyudaYa — Plomeros, gasistas y electricistas verificados en Mar del Plata', template: '%s | AyudaYa' },
  description: site.tagline,
  applicationName: 'AyudaYa',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F5F7' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1520' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" data-scroll-behavior="smooth" className={`${archivo.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
