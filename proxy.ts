import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { q1 } from '@/lib/db'
import { superadminEmails } from '@/lib/env'
import { RESUME_COOKIE, resolveOnboarding } from '@/lib/onboarding'
import { isSuperadmin } from '@/lib/permissions'

// Primera barrera de las superficies internas (/empresa = prestadores, /plataforma = equipo AyudaYa):
// responde 404 REAL antes de renderizar, así no se revela que la ruta existe. Los guards de cada página,
// layout y server action (lib/guards.ts) siguen verificando todo igual: esto no los reemplaza.

const PUBLIC_EXACT = new Set(['/empresa/ingresar', '/plataforma/ingresar'])

function notFoundResponse(request: NextRequest) {
  return NextResponse.rewrite(new URL('/__no-encontrado', request.url), { status: 404 })
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const path = pathname.replace(/\/+$/, '') || '/'

  if (PUBLIC_EXACT.has(path)) return NextResponse.next()

  // Superficie de hogares con cuenta: sin sesión → /ingresar (y vuelve). Un pedido ajeno → 404 real.
  // Las páginas vuelven a verificar todo en el servidor (requireHogar / getPedidoDeHogar).
  if (path === '/mis-pedidos' || path === '/completar-datos' || path === '/pedido' || path.startsWith('/pedido/')) {
    try {
      const session = await auth.api.getSession({ headers: request.headers })
      if (!session?.user) {
        const login = new URL('/ingresar', request.url)
        login.searchParams.set('next', path + request.nextUrl.search)
        return NextResponse.redirect(login)
      }
      if (path === '/pedido/nuevo') {
        const perfil = await q1(`SELECT 1 FROM perfil_hogar WHERE user_id = $1`, [session.user.id])
        if (!perfil) {
          const completar = new URL('/completar-datos', request.url)
          completar.searchParams.set('next', path + request.nextUrl.search)
          return NextResponse.redirect(completar)
        }
      } else if (path.startsWith('/pedido/')) {
        const id = path.slice('/pedido/'.length)
        const own = /^[0-9a-f-]{36}$/i.test(id) ? await q1(`SELECT 1 FROM pedido WHERE id = $1 AND cliente_user_id = $2`, [id, session.user.id]) : null
        if (!own) return notFoundResponse(request)
      }
      return NextResponse.next()
    } catch (error) {
      console.error('[proxy] error verificando hogar', error)
      return NextResponse.next()
    }
  }

  try {
    // Alta por link: el token tiene que existir y estar vigente (o tener una solicitud en curso).
    if (path.startsWith('/empresa/alta/')) {
      const token = path.slice('/empresa/alta/'.length)
      const cookie = request.cookies.get(RESUME_COOKIE)?.value ?? ''
      const key = searchParams.get('clave') ?? (cookie.startsWith(`${token}:`) ? cookie.slice(token.length + 1) : null)
      if (token.includes('/') || !(await resolveOnboarding(token, key))) return notFoundResponse(request)
      return NextResponse.next()
    }

    // Link de primer ingreso del superadmin: solo valida el formato (el token se verifica al usarlo).
    if (path === '/plataforma/ingresar/clave') {
      return /^[A-Za-z0-9_-]{20,80}$/.test(searchParams.get('token') ?? '') ? NextResponse.next() : notFoundResponse(request)
    }

    const session = await auth.api.getSession({ headers: request.headers })
    const user = session?.user as { id: string; email: string; emailVerified: boolean; role?: string; mustChangePassword?: boolean } | undefined
    if (!user) return notFoundResponse(request)

    if (path === '/plataforma' || path.startsWith('/plataforma/')) {
      if (!isSuperadmin({ role: user.role ?? 'member', email: user.email, emailVerified: !!user.emailVerified }, superadminEmails())) return notFoundResponse(request)
      return NextResponse.next()
    }

    // /empresa/*: hace falta ser miembro de un prestador (el permiso fino lo chequea cada página/action).
    const member = await q1(`SELECT 1 FROM client_member WHERE user_id = $1 LIMIT 1`, [user.id])
    if (!member) return notFoundResponse(request)
    // Con contraseña temporal solo puede entrar a cambiarla.
    if (user.mustChangePassword && path !== '/empresa/cambiar-clave' && request.method === 'GET') {
      return NextResponse.redirect(new URL('/empresa/cambiar-clave', request.url))
    }
    return NextResponse.next()
  } catch (error) {
    console.error('[proxy] error verificando acceso', error)
    return notFoundResponse(request)
  }
}

export const config = {
  matcher: ['/empresa', '/empresa/:path*', '/plataforma', '/plataforma/:path*', '/mis-pedidos', '/completar-datos', '/pedido/:path*'],
}
