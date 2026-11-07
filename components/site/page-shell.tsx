import type { ReactNode } from 'react'
import { SiteFooter } from './footer'
import { SiteHeader } from './header'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

export function SecHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <div className="sec-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="h2">{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </div>
  )
}
