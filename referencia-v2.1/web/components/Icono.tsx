const P: Record<string, React.ReactNode> = {
  electricidad: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  plomeria: <path d="M12 2.7s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9 12 2.7 12 2.7z" />,
  gas: <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-2 1-3.5 2-5 .5 2 2 2.5 2 2.5C10 9 11 5 12 2z" />,
  aire: <path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2" />,
  pintura: <><rect x="3" y="3" width="14" height="6" rx="1.5" /><path d="M17 6h3v6H11v3M11 15v6" /></>,
  albanileria: <path d="M3 4h18v16H3zM3 10h18M3 15h18M9 4v6M15 10v5M9 15v5" />,
  carpinteria: <path d="M14 4l6 6-3 3-6-6zM12 8 4 16l4 4 8-8" />,
  cerrajeria: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3M17 6l3 3M14 9l2 2" /></>,
  electrodomesticos: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M5 7h14" /><circle cx="12" cy="14" r="4" /></>,
  otro: <path d="M12 5v14M5 12h14" />,
  lupa: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  escudo: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3zM9 12l2 2 4-4" />,
  estrella: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  inicio: <path d="M3 11 12 3l9 8M5 10v10h14V10" />,
  pedidos: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
};
export default function Icono({ n }: { n: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden>{P[n] ?? P.otro}</svg>;
}
