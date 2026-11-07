// Crea/actualiza las tablas en Neon. Corre antes de cada build (ver "build" en package.json).
// Es idempotente: se puede correr muchas veces sin romper nada.
//   - Sin DATABASE_URL: se saltea (build local sin base).
//   - Tarifario (PL-01 … EL-04) y plan "Piloto" (sin abono, 15% de comisión): se cargan siempre si no existen.
//   - SEED_DEMO=true: además carga 3 prestadores y 6 pedidos de demostración (idempotente).
import { readFileSync } from 'node:fs'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.log('[migrate] Sin DATABASE_URL: se saltea la migración.')
  process.exit(0)
}

const tarifario = JSON.parse(readFileSync(new URL('../data/tarifario.json', import.meta.url), 'utf8'))

const schema = [
  // ---------- better-auth ----------
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS session_user_idx ON "session"("userId")`,
  `CREATE INDEX IF NOT EXISTS account_user_idx ON "account"("userId")`,
  `CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification"("identifier")`,

  // ---------- roles ----------
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'member'`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tempPasswordExpiresAt" timestamp`,

  // ---------- hogares (usuario público) ----------
  `CREATE TABLE IF NOT EXISTS perfil_hogar (
    user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    celular text NOT NULL,
    barrio text NOT NULL,
    direccion text NOT NULL,
    indicaciones text,
    acepta_datos_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  // ---------- planes y prestadores (client) ----------
  `CREATE TABLE IF NOT EXISTS plan (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    features jsonb NOT NULL DEFAULT '[]',
    monthly_price_cents bigint NOT NULL DEFAULT 0,
    commission_pct numeric(5,2) NOT NULL DEFAULT 15,
    currency text NOT NULL DEFAULT 'ARS',
    trial_days int NOT NULL DEFAULT 0,
    limits jsonb NOT NULL DEFAULT '{}',
    sort int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS client (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    legal_name text,
    tax_id text,
    city text NOT NULL DEFAULT 'Mar del Plata',
    phone text,
    contact_email text,
    rubros text[] NOT NULL DEFAULT '{}',
    zonas text[] NOT NULL DEFAULT '{}',
    matricula_tipo text,
    matricula_numero text,
    verificacion text NOT NULL DEFAULT 'pendiente' CHECK (verificacion IN ('pendiente','verificado','observado')),
    verificado_at timestamptz,
    data jsonb NOT NULL DEFAULT '{}',
    plan_id text REFERENCES plan(id),
    monthly_price_cents bigint NOT NULL DEFAULT 0,
    commission_pct numeric(5,2) NOT NULL DEFAULT 15,
    currency text NOT NULL DEFAULT 'ARS',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial','active','past_due','paused','cancelled')),
    trial_ends_at date,
    billing_day int CHECK (billing_day BETWEEN 1 AND 28),
    next_due_date date,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS client_status_idx ON client(status, next_due_date)`,
  `CREATE INDEX IF NOT EXISTS client_rubros_idx ON client USING gin (rubros)`,
  `CREATE INDEX IF NOT EXISTS client_zonas_idx ON client USING gin (zonas)`,
  `CREATE TABLE IF NOT EXISTS client_member (
    client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','staff')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (client_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS client_member_user_idx ON client_member(user_id)`,

  // ---------- alta de prestadores por link ----------
  `CREATE TABLE IF NOT EXISTS client_invite (
    token text PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('personal','campaign')),
    email text,
    label text,
    max_uses int,
    uses int NOT NULL DEFAULT 0,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_by text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS client_application (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_token text REFERENCES client_invite(token),
    resume_key text NOT NULL,
    email text NOT NULL,
    contact_name text,
    phone text,
    email_verified_at timestamptz,
    step int NOT NULL DEFAULT 1,
    data jsonb NOT NULL DEFAULT '{}',
    requested_plan_id text REFERENCES plan(id),
    terms_accepted_at timestamptz,
    status text NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','pending_review','changes_requested','approved','rejected')),
    review_reason text,
    reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    submitted_at timestamptz,
    client_id uuid REFERENCES client(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS client_application_status_idx ON client_application(status, submitted_at)`,
  `CREATE INDEX IF NOT EXISTS client_application_token_idx ON client_application(invite_token)`,

  // ---------- liquidaciones de comisiones (pagos registrados a mano) ----------
  `CREATE TABLE IF NOT EXISTS payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount_cents bigint NOT NULL,
    currency text NOT NULL DEFAULT 'ARS',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','void')),
    method text,
    due_date date NOT NULL,
    paid_at timestamptz,
    notes text,
    registered_by text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, period)
  )`,
  `CREATE INDEX IF NOT EXISTS payment_status_idx ON payment(status, due_date)`,

  // ---------- mails y auditoría ----------
  `CREATE TABLE IF NOT EXISTS email_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email text NOT NULL,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    template text,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','outbox_only')),
    error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS email_outbox_created_idx ON email_outbox(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id bigserial PRIMARY KEY,
    actor_user_id text,
    actor_role text,
    client_id uuid,
    action text NOT NULL,
    entity text,
    entity_id text,
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS audit_log_client_idx ON audit_log(client_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC)`,

  // ---------- negocio: tarifario, pedidos, presupuestos, calificaciones, eventos ----------
  `CREATE TABLE IF NOT EXISTS servicio (
    codigo text PRIMARY KEY CHECK (codigo ~ '^[A-Z]{2}-[0-9]{2}$'),
    rubro text NOT NULL CHECK (rubro IN ('plomeria','gas','electricidad')),
    nombre text NOT NULL,
    descripcion text NOT NULL DEFAULT '',
    precio int NOT NULL CHECK (precio > 0),
    activo boolean NOT NULL DEFAULT true,
    orden int NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS servicio_rubro_idx ON servicio(rubro, orden)`,
  `CREATE TABLE IF NOT EXISTS pedido (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero serial UNIQUE,
    cliente_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    servicio_codigo text NOT NULL REFERENCES servicio(codigo),
    servicio_nombre text NOT NULL,
    rubro text NOT NULL,
    precio_cerrado int NOT NULL CHECK (precio_cerrado > 0),
    problema text NOT NULL,
    barrio text NOT NULL,
    direccion text NOT NULL,
    contacto_nombre text NOT NULL,
    contacto_celular text NOT NULL,
    dia date NOT NULL,
    franja text NOT NULL CHECK (franja IN ('8-12','12-16','16-20')),
    estado text NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo','asignado','en_curso','terminado','cancelado')),
    origen text NOT NULL DEFAULT 'tarifario' CHECK (origen IN ('asistente_ia','palabras_clave','tarifario')),
    prestador_id uuid REFERENCES client(id) ON DELETE SET NULL,
    comision_pct numeric(5,2),
    comision_monto int,
    created_at timestamptz NOT NULL DEFAULT now(),
    asignado_at timestamptz,
    aceptado_at timestamptz,
    en_curso_at timestamptz,
    terminado_at timestamptz,
    cancelado_at timestamptz,
    cancelado_por text,
    motivo_cancelacion text,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS pedido_cliente_idx ON pedido(cliente_user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS pedido_prestador_idx ON pedido(prestador_id, estado)`,
  `CREATE INDEX IF NOT EXISTS pedido_estado_idx ON pedido(estado, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS pedido_terminado_idx ON pedido(prestador_id, terminado_at) WHERE estado = 'terminado'`,
  `CREATE TABLE IF NOT EXISTS presupuesto_adicional (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    prestador_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    monto int NOT NULL CHECK (monto > 0),
    detalle text NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
    created_by text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    respondido_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS presupuesto_pedido_idx ON presupuesto_adicional(pedido_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS calificacion (
    pedido_id uuid PRIMARY KEY REFERENCES pedido(id) ON DELETE CASCADE,
    prestador_id uuid REFERENCES client(id) ON DELETE SET NULL,
    cliente_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
    puntaje int NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
    comentario text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS calificacion_prestador_idx ON calificacion(prestador_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS evento (
    id bigserial PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo IN ('visita','inicio_asistente','sugerencia','pedido_enviado')),
    user_id text REFERENCES "user"(id) ON DELETE SET NULL,
    pedido_id uuid REFERENCES pedido(id) ON DELETE SET NULL,
    datos jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS evento_tipo_idx ON evento(tipo, created_at DESC)`,
]

// ---------- datos de demo (SEED_DEMO=true) ----------
// [slug, nombre, rubros, zonas, matrícula tipo, matrícula número, celular]
const demoPrestadores = [
  ['demo-plomeria-ruiz', 'Plomería Ruiz (demo)', ['plomeria'], ['Centro', 'La Perla', 'Constitución', 'Chauvín', 'Güemes'], 'sin_matricula', null, '2235550101'],
  ['demo-gas-sosa', 'Gasista Sosa (demo)', ['gas', 'plomeria'], ['Centro', 'Constitución', 'Los Troncos', 'Playa Grande', 'La Perla'], 'gasista', 'MP-4521', '2235550102'],
  ['demo-electricidad-luna', 'Electricidad Luna (demo)', ['electricidad'], ['Centro', 'Güemes', 'San Carlos', 'Constitución', 'La Perla'], 'electricista', 'APSE-1180', '2235550103'],
]
// [número de demo, código, barrio, estado, prestador slug, días atrás, puntaje]
const demoPedidos = [
  [1, 'PL-04', 'La Perla', 'terminado', 'demo-plomeria-ruiz', 12, 5],
  [2, 'EL-03', 'Güemes', 'terminado', 'demo-electricidad-luna', 9, 4],
  [3, 'GA-02', 'Constitución', 'en_curso', 'demo-gas-sosa', 2, null],
  [4, 'PL-02', 'Centro', 'asignado', 'demo-plomeria-ruiz', 1, null],
  [5, 'EL-02', 'Constitución', 'nuevo', null, 0, null],
  [6, 'GA-01', 'Los Troncos', 'cancelado', null, 5, null],
]

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const sql of schema) await pool.query(sql)

  await pool.query(
    `INSERT INTO plan (id, name, description, features, monthly_price_cents, commission_pct, currency, trial_days, sort)
     VALUES ('piloto', 'Piloto AyudaYa', 'Sin abono mensual: AyudaYa cobra una comisión del 15% solo sobre los trabajos terminados.',
             '["Sin abono mensual","15% de comisión por trabajo terminado","Liquidación mensual"]'::jsonb, 0, 15, 'ARS', 0, 1)
     ON CONFLICT (id) DO NOTHING`,
  )

  for (const [i, s] of tarifario.entries()) {
    await pool.query(
      `INSERT INTO servicio (codigo, rubro, nombre, descripcion, precio, orden) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (codigo) DO NOTHING`,
      [s.codigo, s.rubro, s.nombre, s.descripcion, s.precio, i + 1],
    )
  }

  // Superadmin: solo cuentas verificadas (creadas por el "primer ingreso" de /plataforma) cuyo email está en
  // SUPERADMIN_EMAILS. Nadie puede registrarse como superadmin desde el registro público.
  const superadmins = (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (superadmins.length) {
    await pool.query(
      `UPDATE "user" SET role = 'superadmin' WHERE lower(email) = ANY($1) AND "emailVerified" = true AND role <> 'superadmin'`,
      [superadmins],
    )
  }
  await pool.query(`UPDATE "user" SET role = 'member' WHERE role = 'superadmin' AND NOT (lower(email) = ANY($1))`, [superadmins])

  if (process.env.SEED_DEMO === 'true') {
    for (const [slug, name, rubros, zonas, matTipo, matNum, phone] of demoPrestadores) {
      await pool.query(
        `INSERT INTO client (slug, name, phone, rubros, zonas, matricula_tipo, matricula_numero, verificacion, verificado_at, plan_id,
                             commission_pct, status, billing_day, next_due_date, is_demo, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'verificado', now(), 'piloto', 15, 'active', 10,
                 (date_trunc('month', current_date) + interval '1 month' + interval '9 days')::date, true,
                 '{"experiencia":8,"franjas":["8-12","12-16","16-20"]}'::jsonb)
         ON CONFLICT (slug) DO NOTHING`,
        [slug, name, phone, rubros, zonas, matTipo, matNum],
      )
    }
    // Hogar de demo (sin contraseña: no puede iniciar sesión; solo sirve para tener pedidos de ejemplo).
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified") VALUES ('demo-hogar', 'Hogar de demostración', 'hogar.demo@ayudaya.invalid', false)
       ON CONFLICT (id) DO NOTHING`,
    )
    await pool.query(
      `INSERT INTO perfil_hogar (user_id, celular, barrio, direccion) VALUES ('demo-hogar', '2235550199', 'La Perla', 'Calle de demostración 123')
       ON CONFLICT (user_id) DO NOTHING`,
    )
    for (const [n, codigo, barrio, estado, slug, diasAtras, puntaje] of demoPedidos) {
      const id = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
      const exists = await pool.query(`SELECT 1 FROM pedido WHERE id = $1`, [id])
      if (exists.rowCount) continue
      const s = tarifario.find((t) => t.codigo === codigo)
      await pool.query(
        `INSERT INTO pedido (id, cliente_user_id, servicio_codigo, servicio_nombre, rubro, precio_cerrado, problema, barrio, direccion,
                             contacto_nombre, contacto_celular, dia, franja, estado, origen, prestador_id, comision_pct, comision_monto,
                             created_at, asignado_at, aceptado_at, en_curso_at, terminado_at, cancelado_at, cancelado_por)
         SELECT $1::uuid, 'demo-hogar', $2::text, $3::text, $4::text, $5::int, 'Pedido de demostración', $6::text, 'Calle de demostración 123',
                'Hogar de demostración', '2235550199', (current_date - make_interval(days => $7::int))::date, '12-16', $8::text, 'tarifario', c.id,
                CASE WHEN c.id IS NOT NULL THEN 15 END,
                CASE WHEN $8::text = 'terminado' THEN round($5::int * 0.15)::int END,
                now() - make_interval(days => $7::int, hours => 3),
                CASE WHEN c.id IS NOT NULL THEN now() - make_interval(days => $7::int, hours => 2) END,
                CASE WHEN $8::text IN ('en_curso','terminado') THEN now() - make_interval(days => $7::int, hours => 1) END,
                CASE WHEN $8::text IN ('en_curso','terminado') THEN now() - make_interval(days => $7::int) END,
                CASE WHEN $8::text = 'terminado' THEN now() - make_interval(days => $7::int) + interval '2 hours' END,
                CASE WHEN $8::text = 'cancelado' THEN now() - make_interval(days => $7::int) END,
                CASE WHEN $8::text = 'cancelado' THEN 'cliente' END
           FROM (SELECT 1) x LEFT JOIN client c ON c.slug = $9::text`,
        [id, codigo, s.nombre, s.rubro, s.precio, barrio, diasAtras, estado, slug],
      )
      if (puntaje) {
        await pool.query(
          `INSERT INTO calificacion (pedido_id, prestador_id, cliente_user_id, puntaje, comentario)
           SELECT id, prestador_id, cliente_user_id, $2, 'Muy buena atención (demo).' FROM pedido WHERE id = $1
           ON CONFLICT (pedido_id) DO NOTHING`,
          [id, puntaje],
        )
      }
    }
    console.log('[migrate] Datos de demo cargados (SEED_DEMO=true).')
  }

  console.log(`[migrate] OK (${schema.length} sentencias de esquema, ${tarifario.length} servicios en el tarifario base).`)
} finally {
  await pool.end()
}
