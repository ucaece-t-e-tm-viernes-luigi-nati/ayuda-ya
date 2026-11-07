import type { Metadata } from 'next'
import { ActionForm, inputClass, labelClass } from '@/components/forms'
import { PasswordInput } from '@/components/password-input'
import { Brand } from '@/components/site/brand'
import { venueSignIn } from '../auth-actions'

export const metadata: Metadata = { title: 'Ingresar' }

// Login propio de los prestadores. Se llega por el link del mail de aprobación.
export default function PrestadorLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Brand href="/empresa/ingresar" suffix="prestadores" />
        </div>
        <div className="mt-6 rounded-[20px] border border-border bg-card p-6">
          <h1 className="display text-2xl font-extrabold">Panel de prestadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresá con el usuario que te enviamos por mail.</p>
          <ActionForm action={venueSignIn} submitLabel="Ingresar" pendingLabel="Ingresando…" className="mt-5 flex flex-col gap-4" submitClassName="btn btn-primary w-full">
            <label className={labelClass}>
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </label>
            <label className={labelClass}>
              Contraseña
              <PasswordInput name="password" required autoComplete="current-password" className={inputClass} />
            </label>
          </ActionForm>
        </div>
      </div>
    </main>
  )
}
