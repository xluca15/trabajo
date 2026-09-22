"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/clientes", texto: "Clientes" },
];

export function Navegacion() {
  const ruta = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {ENLACES.map(({ href, texto }) => {
        const activo = href === "/" ? ruta === "/" : ruta.startsWith(href) || ruta.startsWith("/documentos");
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activo ? "bg-marca-suave text-marca-oscuro" : "text-apagado hover:bg-fondo hover:text-tinta"
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
