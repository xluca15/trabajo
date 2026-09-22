import type { NextConfig } from "next";
import { ipsLocales } from "./lib/red-local";

const nextConfig: NextConfig = {
  // En desarrollo, permite abrir la app desde el celular con la IP de la PC (ej. http://192.168.0.18:3000).
  allowedDevOrigins: ipsLocales(),
  experimental: {
    // Subida de archivos a la ficha del cliente (Vercel corta en 4.5 MB por request).
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Las fuentes y el logo de los PDFs se leen del disco en el servidor.
  outputFileTracingIncludes: {
    "/api/documentos/**": ["./public/pdf/**/*"],
  },
};

export default nextConfig;
