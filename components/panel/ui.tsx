import type { ReactNode } from 'react'

// Piezas visuales compartidas por los paneles internos (prestadores y plataforma).

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> {eyebrow}
          </div>
        )}
        <h1 className="display mt-2 text-[30px] font-extrabold sm:text-[38px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, description, children, className = '' }: { title?: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[22px] border border-border bg-card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-lg font-bold tracking-[-0.035em]">{title}</h2>}
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}

export function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <article className="rounded-[20px] border border-border bg-card p-4 sm:p-5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="mt-3 text-[29px] font-bold leading-none tracking-[-0.06em]">{value}</p>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
    </article>
  )
}

const STATUS_STYLES: Record<string, string> = {
  trial: 'bg-[#e9f1ff] text-[#3d67b5]',
  active: 'bg-[#e7f5ef] text-[#347a5d]',
  past_due: 'bg-[#fff4d9] text-[#9a6d19]',
  paused: 'bg-[#fdeaea] text-[#b23b3b]',
  cancelled: 'bg-muted text-muted-foreground',
  draft: 'bg-[#fff4d9] text-[#9a6d19]',
  published: 'bg-[#e7f5ef] text-[#347a5d]',
  pending_review: 'bg-[#e9f1ff] text-[#3d67b5]',
  changes_requested: 'bg-[#fff4d9] text-[#9a6d19]',
  approved: 'bg-[#e7f5ef] text-[#347a5d]',
  rejected: 'bg-[#fdeaea] text-[#b23b3b]',
  sent: 'bg-[#e7f5ef] text-[#347a5d]',
  outbox_only: 'bg-muted text-muted-foreground',
  failed: 'bg-[#fdeaea] text-[#b23b3b]',
  queued: 'bg-[#e9f1ff] text-[#3d67b5]',
  paid: 'bg-[#e7f5ef] text-[#347a5d]',
  pending: 'bg-[#e9f1ff] text-[#3d67b5]',
  overdue: 'bg-[#fdeaea] text-[#b23b3b]',
  void: 'bg-muted text-muted-foreground',
  pendiente: 'bg-[#fff4d9] text-[#9a6d19]',
  verificado: 'bg-[#e7f5ef] text-[#347a5d]',
  observado: 'bg-[#fdeaea] text-[#b23b3b]',
}

export const STATUS_LABELS: Record<string, string> = {
  trial: 'En prueba',
  active: 'Activo',
  past_due: 'Pago vencido',
  paused: 'Pausado',
  cancelled: 'Dado de baja',
  draft: 'Borrador',
  published: 'Publicado',
  pending_review: 'Pendiente de revisión',
  changes_requested: 'Con cambios pedidos',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  sent: 'Enviado',
  outbox_only: 'Solo outbox',
  failed: 'Falló',
  queued: 'En cola',
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  void: 'Anulado',
  pendiente: 'Verificación pendiente',
  verificado: 'Verificado',
  observado: 'Verificación observada',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-top ${className}`}>{children}</td>
}
