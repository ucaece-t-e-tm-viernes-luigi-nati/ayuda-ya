import { bigint, bigserial, boolean, date, integer, jsonb, numeric, pgTable, primaryKey, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Esquema de AyudaYa en Drizzle (documentación tipada). La fuente de verdad del DDL (CHECKs, índices, FKs)
// es scripts/migrate.mjs, que corre en cada build. Si agregás una columna, sumala en los dos lugares.

// ---------- better-auth ----------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('member'), // superadmin | member
  mustChangePassword: boolean('mustChangePassword').notNull().default(false),
  tempPasswordExpiresAt: timestamp('tempPasswordExpiresAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// ---------- hogares ----------
export const perfilHogar = pgTable('perfil_hogar', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  celular: text('celular').notNull(),
  barrio: text('barrio').notNull(),
  direccion: text('direccion').notNull(),
  indicaciones: text('indicaciones'),
  aceptaDatosAt: timestamp('acepta_datos_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------- planes, prestadores (client) y onboarding ----------
export const plan = pgTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  features: jsonb('features').notNull().default([]),
  monthlyPriceCents: bigint('monthly_price_cents', { mode: 'number' }).notNull().default(0),
  commissionPct: numeric('commission_pct').notNull().default('15'),
  currency: text('currency').notNull().default('ARS'),
  trialDays: integer('trial_days').notNull().default(0),
  active: boolean('active').notNull().default(true),
})

export const client = pgTable('client', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  taxId: text('tax_id'),
  city: text('city').notNull().default('Mar del Plata'),
  phone: text('phone'),
  contactEmail: text('contact_email'),
  rubros: text('rubros').array().notNull(),
  zonas: text('zonas').array().notNull(),
  matriculaTipo: text('matricula_tipo'),
  matriculaNumero: text('matricula_numero'),
  verificacion: text('verificacion').notNull().default('pendiente'), // pendiente | verificado | observado
  verificadoAt: timestamp('verificado_at', { withTimezone: true }),
  data: jsonb('data').notNull().default({}),
  planId: text('plan_id').references(() => plan.id),
  monthlyPriceCents: bigint('monthly_price_cents', { mode: 'number' }).notNull().default(0),
  commissionPct: numeric('commission_pct').notNull().default('15'),
  currency: text('currency').notNull().default('ARS'),
  status: text('status').notNull().default('active'), // trial | active | past_due | paused | cancelled
  trialEndsAt: date('trial_ends_at'),
  billingDay: integer('billing_day'),
  nextDueDate: date('next_due_date'),
  isDemo: boolean('is_demo').notNull().default(false),
})

export const clientMember = pgTable(
  'client_member',
  {
    clientId: uuid('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('owner'), // owner | staff
  },
  (t) => [primaryKey({ columns: [t.clientId, t.userId] })],
)

export const clientInvite = pgTable('client_invite', {
  token: text('token').primaryKey(),
  kind: text('kind').notNull(), // personal | campaign
  email: text('email'),
  label: text('label'),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
})

export const clientApplication = pgTable('client_application', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviteToken: text('invite_token').references(() => clientInvite.token),
  resumeKey: text('resume_key').notNull(),
  email: text('email').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  step: integer('step').notNull().default(1),
  data: jsonb('data').notNull().default({}),
  requestedPlanId: text('requested_plan_id').references(() => plan.id),
  status: text('status').notNull().default('draft'), // draft | pending_review | changes_requested | approved | rejected
  reviewReason: text('review_reason'),
  clientId: uuid('client_id').references(() => client.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
})

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  period: text('period').notNull(), // YYYY-MM (liquidación de comisiones del mes)
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('ARS'),
  status: text('status').notNull().default('pending'), // pending | paid | overdue | void
  method: text('method'),
  dueDate: date('due_date').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
})

export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  template: text('template'),
  status: text('status').notNull().default('queued'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
})

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorUserId: text('actor_user_id'),
  actorRole: text('actor_role'),
  clientId: uuid('client_id'),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: text('entity_id'),
  detail: jsonb('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------- negocio ----------
export const servicio = pgTable('servicio', {
  codigo: text('codigo').primaryKey(), // PL-01, GA-03, EL-04…
  rubro: text('rubro').notNull(), // plomeria | gas | electricidad
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  precio: integer('precio').notNull(), // pesos, mano de obra
  activo: boolean('activo').notNull().default(true),
  orden: integer('orden').notNull().default(0),
})

export const pedido = pgTable('pedido', {
  id: uuid('id').primaryKey().defaultRandom(),
  numero: serial('numero').unique(),
  clienteUserId: text('cliente_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  servicioCodigo: text('servicio_codigo')
    .notNull()
    .references(() => servicio.codigo),
  servicioNombre: text('servicio_nombre').notNull(),
  rubro: text('rubro').notNull(),
  precioCerrado: integer('precio_cerrado').notNull(),
  problema: text('problema').notNull(),
  barrio: text('barrio').notNull(),
  direccion: text('direccion').notNull(),
  contactoNombre: text('contacto_nombre').notNull(),
  contactoCelular: text('contacto_celular').notNull(),
  dia: date('dia').notNull(),
  franja: text('franja').notNull(), // 8-12 | 12-16 | 16-20
  estado: text('estado').notNull().default('nuevo'), // nuevo | asignado | en_curso | terminado | cancelado
  origen: text('origen').notNull().default('tarifario'), // asistente_ia | palabras_clave | tarifario
  prestadorId: uuid('prestador_id').references(() => client.id, { onDelete: 'set null' }),
  comisionPct: numeric('comision_pct'),
  comisionMonto: integer('comision_monto'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  asignadoAt: timestamp('asignado_at', { withTimezone: true }),
  aceptadoAt: timestamp('aceptado_at', { withTimezone: true }),
  enCursoAt: timestamp('en_curso_at', { withTimezone: true }),
  terminadoAt: timestamp('terminado_at', { withTimezone: true }),
  canceladoAt: timestamp('cancelado_at', { withTimezone: true }),
  canceladoPor: text('cancelado_por'),
  motivoCancelacion: text('motivo_cancelacion'),
})

export const presupuestoAdicional = pgTable('presupuesto_adicional', {
  id: uuid('id').primaryKey().defaultRandom(),
  pedidoId: uuid('pedido_id')
    .notNull()
    .references(() => pedido.id, { onDelete: 'cascade' }),
  prestadorId: uuid('prestador_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  monto: integer('monto').notNull(),
  detalle: text('detalle').notNull(),
  estado: text('estado').notNull().default('pendiente'), // pendiente | aprobado | rechazado
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  respondidoAt: timestamp('respondido_at', { withTimezone: true }),
})

export const calificacion = pgTable('calificacion', {
  pedidoId: uuid('pedido_id')
    .primaryKey()
    .references(() => pedido.id, { onDelete: 'cascade' }),
  prestadorId: uuid('prestador_id').references(() => client.id, { onDelete: 'set null' }),
  clienteUserId: text('cliente_user_id').references(() => user.id, { onDelete: 'set null' }),
  puntaje: integer('puntaje').notNull(), // 1 a 5
  comentario: text('comentario'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const evento = pgTable('evento', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tipo: text('tipo').notNull(), // visita | inicio_asistente | sugerencia | pedido_enviado
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  pedidoId: uuid('pedido_id').references(() => pedido.id, { onDelete: 'set null' }),
  datos: jsonb('datos'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
