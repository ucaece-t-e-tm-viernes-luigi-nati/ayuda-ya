import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-2 text-4xl font-extrabold">No encontramos esta página</h1>
      <p className="lead mt-2">Puede que el link esté mal escrito o que ya no esté disponible.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Ir a AyudaYa
      </Link>
    </main>
  )
}
