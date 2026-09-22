import type { MetadataRoute } from "next";

// Permite "Agregar a la pantalla de inicio" en el celular y abrirla como una app (sin barra del navegador).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leo Calderas",
    short_name: "Leo Calderas",
    description: "Clientes, presupuestos, listas de materiales e informes.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fa",
    theme_color: "#2f74b7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
