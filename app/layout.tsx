import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Leo Calderas", template: "%s · Leo Calderas" },
  description: "Clientes, presupuestos, listas de materiales e informes de Leo Calderas.",
  applicationName: "Leo Calderas",
  // Instalada en el iPhone ("Agregar a inicio") abre a pantalla completa, como una app.
  appleWebApp: { capable: true, title: "Leo Calderas", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#2f74b7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
