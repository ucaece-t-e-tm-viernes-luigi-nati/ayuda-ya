'use client'

import { useState } from 'react'

/** Selector de 1 a 5 estrellas (radio buttons accesibles). */
export function Estrellas() {
  const [valor, setValor] = useState(0)
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">Puntaje</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer text-3xl leading-none">
            <input type="radio" name="puntaje" value={n} required className="sr-only" onChange={() => setValor(n)} />
            <span className={n <= valor ? 'text-primary' : 'text-border'} aria-hidden="true">
              ★
            </span>
            <span className="sr-only">{n} de 5</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
