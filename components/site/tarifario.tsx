'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RUBROS, type Servicio } from '@/lib/catalogo'

const fmt = (n: number) => '$' + n.toLocaleString('es-AR')

/** Tarifario por rubro (pestañas). Las tarjetas de "Lo que resolvemos" abren el rubro con #tarifa-<rubro>. */
export function Tarifario({ servicios }: { servicios: Servicio[] }) {
  const [rubro, setRubro] = useState<string>('plomeria')

  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#tarifa-(\w+)/)
      if (m && RUBROS.some((r) => r.id === m[1])) {
        setRubro(m[1])
        document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const r = RUBROS.find((x) => x.id === rubro) ?? RUBROS[0]
  const items = servicios.filter((s) => s.rubro === r.id)

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Rubros">
        {RUBROS.map((x) => (
          <button key={x.id} type="button" role="tab" className="tab" aria-selected={x.id === rubro} onClick={() => setRubro(x.id)}>
            {x.nombre}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 md:grid-cols-[300px_1fr]">
        <figure className="foto aspect-video md:aspect-[3/4]">
          <img src={r.foto} alt={r.alt} loading="lazy" />
          <figcaption
            className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-10 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(transparent, rgba(10,18,30,.85))' }}
          >
            {r.nota}
          </figcaption>
        </figure>
        <div className="overflow-hidden rounded-[14px] border border-border bg-card" role="tabpanel">
          {items.map((s) => (
            <div
              key={s.codigo}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-b border-border p-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4 sm:px-5"
            >
              <span className="col-span-full font-mono text-xs text-muted-foreground sm:col-span-1">{s.codigo}</span>
              <div>
                <h3 className="text-base font-semibold">{s.nombre}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.descripcion}</p>
              </div>
              <span className="num whitespace-nowrap text-lg">{fmt(s.precio)}</span>
              <Link href={`/pedido/nuevo?servicio=${s.codigo}`} className="btn btn-ghost btn-sm col-span-full sm:col-span-1">
                Pedir
              </Link>
            </div>
          ))}
          {!items.length && <p className="p-5 text-sm text-muted-foreground">Por ahora no hay servicios publicados en este rubro.</p>}
        </div>
      </div>
    </>
  )
}
