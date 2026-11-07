import { CircleAlert } from 'lucide-react'
import { signOutAction } from '@/app/auth-actions'
import { NavLinks } from '@/components/panel/nav-links'
import { StatusBadge } from '@/components/panel/ui'
import { Brand } from '@/components/site/brand'
import { requirePrestador } from '@/lib/guards'
import { prestadorCan } from '@/lib/permissions'

// Guard en el servidor ANTES de responder: sin sesión o sin membresía → 404 (no revela que existe).
export const instant = false

export default async function PrestadorPanelLayout({ children }: LayoutProps<'/empresa'>) {
  const ctx = await requirePrestador('dashboard.view')
  const links = [
    { href: '/empresa', label: 'Resumen' },
    { href: '/empresa/pedidos', label: 'Pedidos' },
    { href: '/empresa/calificaciones', label: 'Calificaciones' },
    ...(prestadorCan(ctx.role, 'comisiones.view') ? [{ href: '/empresa/comisiones', label: 'Comisiones' }] : []),
    ...(prestadorCan(ctx.role, 'perfil.edit') ? [{ href: '/empresa/perfil', label: 'Mi perfil' }] : []),
  ]

  return (
    <>
      <div className="cinta h-2" aria-hidden="true" />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Brand href="/empresa" suffix="panel de prestadores" />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold">{ctx.clientName}</span>
            <StatusBadge status={ctx.status} />
            {ctx.verificacion !== 'verificado' && <StatusBadge status={ctx.verificacion} />}
            <span className="hidden text-muted-foreground sm:inline">{ctx.user.email}</span>
            <form action={signOutAction.bind(null, '/empresa/ingresar')}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Salir</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-[1180px] px-5 pb-3 sm:px-8">
          <NavLinks links={links} root="/empresa" />
        </div>
      </header>
      {ctx.readOnly && (
        <div role="status" className="border-b border-[#f3c9c9] bg-[#fdeaea] px-5 py-3 text-sm text-[#8f2f2f]">
          <div className="mx-auto flex max-w-[1180px] items-start gap-2 sm:px-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Tu cuenta está {ctx.status === 'paused' ? 'pausada' : 'dada de baja'}: el panel queda en modo solo lectura y no te asignamos pedidos nuevos. Para
              reactivarla, respondé el último mail que te enviamos o escribinos.
            </p>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-8 sm:px-8">{children}</main>
    </>
  )
}
