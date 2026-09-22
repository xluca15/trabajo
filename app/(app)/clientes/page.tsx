import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";
import { listarClientes } from "@/lib/consultas";
import { formatearFecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Clientes" };

export default async function PaginaClientes({ searchParams }: PageProps<"/clientes">) {
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const lista = await listarClientes(busqueda);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <Link href="/clientes/nuevo" className="btn-primario">
          <Plus className="size-4" /> Nuevo cliente
        </Link>
      </div>

      <form role="search" className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-apagado" />
        <input
          name="q"
          type="search"
          defaultValue={busqueda}
          placeholder="Buscar por nombre, localidad o contacto…"
          className="campo pl-9"
          aria-label="Buscar clientes"
        />
      </form>

      {lista.length === 0 ? (
        <div className="tarjeta p-10 text-center text-apagado">
          {busqueda ? `No hay clientes que coincidan con “${busqueda}”.` : "Todavía no hay clientes."}
        </div>
      ) : (
        <ul className="tarjeta divide-y divide-borde overflow-hidden">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-fondo">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.nombre}</p>
                  <p className="truncate text-sm text-apagado">
                    {[c.localidad, c.contacto, c.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  <p>
                    {c.cantidadDocumentos} {c.cantidadDocumentos === 1 ? "documento" : "documentos"}
                  </p>
                  {c.ultimaFecha && <p className="text-apagado">Último: {formatearFecha(c.ultimaFecha)}</p>}
                </div>
                <ChevronRight className="size-4 shrink-0 text-apagado" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-apagado">
        {lista.length} {lista.length === 1 ? "cliente" : "clientes"}
      </p>
    </div>
  );
}
