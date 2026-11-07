# AyudaYa v2.2

MVP de **AyudaYa** · Taller Emprendedor · Universidad CAECE (Mar del Plata) · comisión viernes · 2do cuatrimestre 2026.

AyudaYa conecta hogares de **Mar del Plata** con **plomeros, gasistas y electricistas verificados**, a **precio cerrado** según un tarifario público. El cliente **no paga comisión ni recargo**: AyudaYa cobra una **comisión del 15% al prestador** solo por los trabajos terminados.

- **App publicada:** https://ayuda-ya-gamma.vercel.app
- **Landing del curso:** https://ucaece-t-e-tm-viernes-luigi-nati.github.io/landing/
- **Docentes:** Luis Miguel Orviz y Natalia Tonon García
- **Historia:** la entrega v2.1 del equipo (HTML + Next.js con Supabase) quedó en el historial de git (tag `v2.1`). La v2.2 (tag `v2.2`) la reemplaza por Neon + roles + onboarding de prestadores.

## Roles y superficies

Las tres superficies **nunca se muestran juntas**. La portada solo muestra la parte de hogares; no hay links a los paneles internos.

| Rol | Quién | Rutas | Cómo se entra |
|---|---|---|---|
| **Hogar** (cliente) | Vecinos que piden un servicio | `/`, `/ingresar`, `/pedido/nuevo`, `/pedido/[id]`, `/mis-pedidos`, `/completar-datos` | Registro público (nombre, mail, celular, barrio, dirección) |
| **Prestador** (cliente B2B, "empresa") | Plomeros, gasistas, electricistas | `/empresa/...` ("Panel de prestadores") | Solo por **link de invitación** → wizard de alta → aprobación del equipo → mail con usuario y contraseña temporal |
| **Superadmin** | Equipo AyudaYa | `/plataforma/...` | Emails de `SUPERADMIN_EMAILS`, "Primer ingreso" con link de un solo uso |

`/empresa/*` y `/plataforma/*` devuelven **404 real** sin sesión o sin rol (proxy + guards en cada layout, página y server action), tienen `noindex` y están bloqueadas en `robots.txt`.

### Qué hace cada uno

- **Hogar:** portada con el diseño del equipo (hero "precio cerrado", lo que resolvemos, asistente, tarifario desde la base, cómo funciona, por qué AyudaYa, FAQ). El **asistente** (`/api/asistente`) usa la API de Claude con el prompt de la sección 10 del CLAUDE.md del equipo y sugiere un código del tarifario; sin clave o si falla, usa la alternativa por palabras clave. Pedido con precio cerrado, barrio, dirección, día y franja (8–12, 12–16, 16–20), seguimiento (nuevo → asignado → en curso → terminado / cancelado), aprobar o rechazar presupuestos adicionales y calificar de 1 a 5. Siempre está la alternativa "pedir por WhatsApp".
- **Prestador:** pedidos asignados (aceptar / rechazar; la dirección y el celular del cliente se ven al aceptar), marcar en curso y terminado, proponer presupuesto adicional, calificaciones, resumen de comisiones por mes y liquidaciones, perfil (zonas y disponibilidad).
- **Superadmin:** métricas de las hipótesis del MVP, pedidos con **asignación manual** (solo prestadores verificados, activos, del rubro y la zona), tarifario (alta y edición), solicitudes de alta (aprobar / pedir cambios / rechazar), prestadores (verificación, pausar / activar, condiciones, **registro manual de pagos de liquidaciones**), invitaciones, mails y auditoría.

### Alta de prestadores

1. El equipo crea una invitación en `/plataforma/invitaciones` (personal por mail, 14 días, un uso; o link de campaña reutilizable).
2. El prestador completa el wizard `/empresa/alta/[token]` (se guarda en cada paso): cuenta → datos (DNI, CUIT, condición fiscal) → características (rubros, matrícula —gasista matriculado obligatorio para gas—, barrios, experiencia, días y franjas, urgencias, vehículo, herramientas, seguro) → condiciones (sin abono, 15% de comisión, día de pago) → revisión y envío.
3. Mails: aviso al equipo y "recibimos tu solicitud". El equipo aprueba (mail con usuario, contraseña temporal de 72 h, comisión, liquidación mensual y día de pago), pide cambios (mail con link para corregir) o rechaza (mail con motivo).
4. En el primer ingreso el prestador tiene que cambiar la contraseña.

### Comisiones (modelo intermediario)

- Cada pedido terminado guarda su comisión: 15% del precio final (precio cerrado + adicionales aprobados). Si el equipo le dio días de prueba, los trabajos de ese período no pagan comisión.
- El cron diario (`/api/cron/vencimientos`, `vercel.json`) emite a principio de mes la **liquidación del mes anterior**, que vence el día de pago elegido; avisa 3 días antes, la marca vencida (`past_due`) y a los `PAUSE_AFTER_DAYS` días pausa la cuenta (`paused`: no recibe pedidos nuevos y el panel queda en solo lectura).
- El pago lo registra a mano el superadmin; si no quedan deudas vencidas, la cuenta se reactiva.

## Cómo está armado

| Pieza | Qué es |
|---|---|
| Next.js 16 (App Router, `cacheComponents`) | La app (`app/`) |
| better-auth | Registro e ingreso con correo y contraseña (tablas en Neon) |
| Neon + `pg` | Base de datos Postgres |
| Drizzle | Esquema tipado (`lib/schema.ts`) |
| `scripts/migrate.mjs` | Crea/actualiza las tablas en cada build (idempotente) y carga el tarifario |
| Tailwind CSS | Estilos (colores y tipografías del diseño del equipo) |
| nodemailer | Mails por SMTP; todos quedan en `email_outbox` |
| API de Claude | Asistente (opcional) |

```
app/
  page.tsx                  portada pública (hogares)
  ingresar/ completar-datos/ pedido/ mis-pedidos/   cuenta y pedidos del hogar
  empresa/                  panel de prestadores (oculto): ingresar, cambiar-clave, alta/[token], (panel)/...
  plataforma/               equipo AyudaYa (oculto): ingresar, (panel)/...
  api/asistente             sugerencia de servicio (Claude + palabras clave)
  api/evento                métricas anónimas (visita, inicio del asistente)
  api/cron/vencimientos     liquidaciones de comisiones
lib/                        auth, guards, permisos, mails, tarifario, pedidos, cobros
proxy.ts                    404 real para rutas internas y redirecciones del hogar
data/tarifario.json         tarifario base (PL-01 … EL-04)
```

**Tablas:** `user`, `session`, `account`, `verification` (better-auth) · `perfil_hogar` · `plan`, `client` (prestador), `client_member`, `client_invite`, `client_application`, `payment` (liquidaciones), `email_outbox`, `audit_log` · `servicio`, `pedido`, `presupuesto_adicional`, `calificacion`, `evento`.

## Variables de entorno

Ver `.env.example`. En Vercel hacen falta: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, `SUPERADMIN_EMAILS`, `SUPERADMIN_NOTIFY_EMAILS`, `MAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_WHATSAPP` y, opcionales, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `PAUSE_AFTER_DAYS`, `SEED_DEMO`. **Nunca** se suben claves al repo: es público.

## Trabajar en tu PC

Necesitás Node.js 20.9+ y Git.

```bash
git clone https://github.com/ucaece-t-e-tm-viernes-luigi-nati/ayuda-ya.git
cd ayuda-ya
npm install
cp .env.example .env.local   # completá DATABASE_URL, BETTER_AUTH_SECRET, etc.
npm run db:migrate           # crea las tablas y carga el tarifario
npm run dev                  # http://localhost:3000
```

Primer superadmin: entrá a `/plataforma/ingresar` → "Primer ingreso" con un mail de `SUPERADMIN_EMAILS`. Sin SMTP, el link aparece en los logs del servidor.

## Cómo se publica

1. Cada push a `main` → Vercel corre `npm run build` (primero `scripts/migrate.mjs`, después `next build`) y publica en producción.
2. Otra rama → preview con URL propia.
3. Fotos: `node scripts/images-to-webp.mjs <carpeta>` las convierte a WebP < 200 KB en `public/img` (se omiten la del tomacorriente estadounidense y la de la llave de gas ilegible).

## Limitaciones conocidas

- El límite de consultas al asistente y a `/api/evento` es en memoria por instancia (se reinicia en cada cold start de Vercel): frena abusos obvios, no es un límite global.
- El cobro de comisiones es manual (registro del superadmin); Mercado Pago queda para una etapa posterior.
- Los precios del tarifario son los del equipo (sección 9.2); falta confirmarlos con los prestadores del piloto.

## Equipo

Repo de la organización `ucaece-t-e-tm-viernes-luigi-nati`. El equipo `equipo-ayuda-ya` tiene permiso de **admin** sobre este repo.

> Demo académica con datos de ejemplo, sin fines comerciales.
