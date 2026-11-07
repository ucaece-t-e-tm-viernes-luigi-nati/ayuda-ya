import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PageShell } from '@/components/site/page-shell'
import { IngresarForms } from './forms'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false, follow: false } }

// Login / registro de HOGARES. No da acceso a ningún panel interno (cada superficie tiene su propio login).
export default function IngresarPage() {
  return (
    <PageShell>
      <div className="wrap max-w-[560px] py-12">
        <Suspense>
          <IngresarForms />
        </Suspense>
      </div>
    </PageShell>
  )
}
