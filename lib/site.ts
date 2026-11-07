// Datos de la startup (públicos).
export const site = {
  name: 'AyudaYa',
  tagline: 'Plomeros, gasistas y electricistas verificados en Mar del Plata, con precio cerrado antes de que entren a tu casa.',
  city: 'Mar del Plata',
  course: 'Taller Emprendedor · UCAECE · comisión viernes · 2026 2C',
}

/** Número de WhatsApp público (NEXT_PUBLIC_WHATSAPP, formato internacional sin + ni espacios). Placeholder si falta. */
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP ?? '').replace(/\D/g, '') || '5492230000000'
export const WHATSAPP_CONFIGURADO = !!(process.env.NEXT_PUBLIC_WHATSAPP ?? '').replace(/\D/g, '')

export function whatsappLink(text: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
}

export function whatsappLabel() {
  const n = WHATSAPP
  // 549 223 xxx-xxxx → +54 9 223 xxx-xxxx
  if (/^549\d{10}$/.test(n)) return `+54 9 ${n.slice(3, 6)} ${n.slice(6, 9)}-${n.slice(9)}`
  return `+${n}`
}
