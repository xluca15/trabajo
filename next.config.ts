import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
