import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "AyudaYa · Servicios para el hogar",
  description: "Contanos qué problema tenés y los profesionales verificados te ofertan su precio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap"
        />
      </head>
      <body>
        <Header />
        <div className="cinta" aria-hidden />
        {children}
        <footer className="pie">
          <div className="wrap">AyudaYa · Servicios para el hogar · Piloto 2026</div>
        </footer>
        <TabBar />
      </body>
    </html>
  );
}
