'use client'

import { useEffect } from 'react'

/** Registra una "visita" por sesión de navegador (métrica visitas → solicitudes). */
export function VisitBeacon() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('ay_visita')) return
      sessionStorage.setItem('ay_visita', '1')
    } catch {
      // sin sessionStorage: se registra igual
    }
    fetch('/api/evento', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tipo: 'visita' }), keepalive: true }).catch(() => null)
  }, [])
  return null
}
