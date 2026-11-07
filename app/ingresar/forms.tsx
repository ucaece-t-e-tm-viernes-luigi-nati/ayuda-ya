'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ActionForm } from '@/components/forms'
import { PasswordInput } from '@/components/password-input'
import { PerfilFields } from '@/components/site/perfil-fields'
import { ingresarHogar, registrarHogar } from '../hogar-actions'

const submit = 'btn btn-primary w-full'

export function IngresarForms() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/mis-pedidos'
  const [registro, setRegistro] = useState(params.get('modo') === 'registro')

  return (
    <div className="ui-form">
      <div className="sec-head mb-2">
        <p className="eyebrow">{registro ? 'Crear cuenta' : 'Ingresar'}</p>
        <h1 className="h2">{registro ? 'Creá tu cuenta' : 'Ingresá a AyudaYa'}</h1>
        <p className="lead">
          {registro ? 'Una sola vez: así el profesional sabe adónde ir y podés seguir tus pedidos.' : 'Para pedir un servicio y seguir tus pedidos.'}
        </p>
      </div>

      {registro ? (
        <ActionForm action={registrarHogar} submitLabel="Crear cuenta" pendingLabel="Creando…" className="grid gap-4" submitClassName={submit}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="nombre">Nombre y apellido</label>
            <input id="nombre" name="nombre" required maxLength={80} autoComplete="name" className="ui-input" />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="ui-input" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" className="ui-input" />
            <span className="hint">Mínimo 8 caracteres.</span>
          </div>
          <PerfilFields />
        </ActionForm>
      ) : (
        <ActionForm action={ingresarHogar} submitLabel="Ingresar" pendingLabel="Ingresando…" className="grid gap-4" submitClassName={submit}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="ui-input" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <PasswordInput id="password" name="password" required autoComplete="current-password" className="ui-input" />
          </div>
        </ActionForm>
      )}

      <button type="button" onClick={() => setRegistro(!registro)} className="text-sm text-muted-foreground underline">
        {registro ? 'Ya tengo cuenta, quiero ingresar' : 'No tengo cuenta, quiero registrarme'}
      </button>
    </div>
  )
}
