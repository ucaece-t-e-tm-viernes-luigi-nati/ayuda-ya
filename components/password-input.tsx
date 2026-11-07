'use client'

import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * Campo de contraseña con botón "ojito" para mostrar u ocultar lo tipeado.
 * Usarlo en TODOS los campos de contraseña (logins, cambio y creación de clave, confirmaciones).
 * El botón no toma el foco al hacer clic (onMouseDown preventDefault), así no se pierde el cursor ni el autocompletado.
 */
export function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block w-full">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-11`} />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[10px] text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
      </button>
    </span>
  )
}
