import Link from 'next/link'

export function Brand({ href = '/', suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="flex items-baseline gap-2.5 no-underline">
      <b className="font-display text-2xl font-extrabold tracking-tight" style={{ fontStretch: '110%' }}>
        Ayuda<span className="text-primary">Ya</span>
      </b>
      {suffix && <small className="eyebrow hidden text-[11px] sm:inline">{suffix}</small>}
    </Link>
  )
}
