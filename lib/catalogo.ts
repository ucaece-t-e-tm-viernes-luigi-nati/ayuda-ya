// Constantes del dominio de AyudaYa. Funciones puras: sirven en servidor y navegador.

export const RUBROS = [
  { id: 'plomeria', nombre: 'Plomería', oficio: 'Plomero', nota: 'Plomeros con experiencia comprobable.', foto: '/img/manos-valvula.webp', alt: 'Manos de un plomero ajustando una válvula de agua' },
  { id: 'gas', nombre: 'Gas', oficio: 'Gasista', nota: 'Solo gasistas matriculados.', foto: '/img/llama-gas.webp', alt: 'Hornalla encendida con llama azul' },
  { id: 'electricidad', nombre: 'Electricidad', oficio: 'Electricista', nota: 'Electricistas matriculados para instalaciones.', foto: '/img/tablero-casco.webp', alt: 'Electricista trabajando en un tablero eléctrico' },
] as const

export type RubroId = (typeof RUBROS)[number]['id']
export const RUBRO_IDS = RUBROS.map((r) => r.id) as readonly string[]
export const rubroNombre = (id: string) => RUBROS.find((r) => r.id === id)?.nombre ?? id

/** Barrios de Mar del Plata (General Pueyrredon) para pedidos y zonas de trabajo. */
export const BARRIOS = [
  'Centro',
  'La Perla',
  'Constitución',
  'Chauvín',
  'Los Troncos',
  'Playa Grande',
  'Güemes',
  'San Carlos',
  'Don Bosco',
  'Puerto',
  'Punta Mogotes',
  'Bosque Peralta Ramos',
  'San Juan',
  'Libertad',
  'Estación Norte',
  'Parque Luro',
  'Camet',
  'Las Avenidas',
  'Malvinas Argentinas',
  'Caisamar',
  'Sierra de los Padres',
  'Batán',
  'Otro',
] as const

export const FRANJAS = [
  { id: '8-12', nombre: 'Mañana', rango: '8 a 12 h' },
  { id: '12-16', nombre: 'Mediodía', rango: '12 a 16 h' },
  { id: '16-20', nombre: 'Tarde', rango: '16 a 20 h' },
] as const
export const FRANJA_IDS = FRANJAS.map((f) => f.id) as readonly string[]
export const franjaRango = (id: string) => FRANJAS.find((f) => f.id === id)?.rango ?? id

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

/** Tipos de matrícula. Para el rubro gas es obligatorio "gasista". */
export const MATRICULAS = [
  { id: 'gasista', nombre: 'Gasista matriculado (habilitado por la distribuidora / ENARGAS)' },
  { id: 'electricista', nombre: 'Electricista matriculado (registro provincial / municipal)' },
  { id: 'plomero', nombre: 'Plomero / sanitarista matriculado' },
  { id: 'sin_matricula', nombre: 'Sin matrícula (solo plomería)' },
] as const
export const matriculaNombre = (id: string | null | undefined) => MATRICULAS.find((m) => m.id === id)?.nombre ?? id ?? '—'

export const ESTADOS_PEDIDO = ['nuevo', 'asignado', 'en_curso', 'terminado', 'cancelado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export const ESTADO_PEDIDO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  en_curso: 'En curso',
  terminado: 'Terminado',
  cancelado: 'Cancelado',
}

export const ORIGEN_LABEL: Record<string, string> = {
  asistente_ia: 'Asistente con IA',
  palabras_clave: 'Asistente (palabras clave)',
  tarifario: 'Tarifario',
}

export const numeroPedido = (n: number | string) => `#AY-${String(n).padStart(4, '0')}`

export type Servicio = {
  codigo: string
  rubro: string
  nombre: string
  descripcion: string
  precio: number
  activo: boolean
  orden: number
}
