import { signOutAction } from '@/app/auth-actions'
import { NavLinks } from '@/components/panel/nav-links'
import { Brand } from '@/components/site/brand'
import { requireSuperadmin } from '@/lib/guards'

// Guard en el servidor ANTES de responder: sin sesión o sin rol superadmin → 404.
export const instant = false

const links = [
  { href: '/plataforma', label: 'Métricas' },
  { href: '/plataforma/pedidos', label: 'Pedidos' },
  { href: '/plataforma/tarifario', label: 'Tarifario' },
  { href: '/plataforma/prestadores', label: 'Prestadores' },
  { href: '/plataforma/solicitudes', label: 'Solicitudes' },
  { href: '/plataforma/invitaciones', label: 'Invitaciones' },
  { href: '/plataforma/mails', label: 'Mails' },
  { href: '/plataforma/auditoria', label: 'Auditoría' },
]

export default async function PlatformPanelLayout({ children }: LayoutProps<'/plataforma'>) {
  const user = await requireSuperadmin()
  return (
    <>
      <div className="cinta h-2" aria-hidden="true" />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Brand href="/plataforma" suffix="plataforma · equipo" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <form action={signOutAction.bind(null, '/plataforma/ingresar')}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Salir</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-[1240px] px-5 pb-3 sm:px-8">
          <NavLinks links={links} root="/plataforma" />
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-8 sm:px-8">{children}</main>
    </>
  )
}
