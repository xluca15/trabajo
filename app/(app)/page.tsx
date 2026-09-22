import Link from "next/link";
import { Search } from "lucide-react";
import { cambiarEstado, crearDocumentoRapido } from "@/app/acciones";
import { InsigniaEstado, InsigniaTipo } from "@/components/insignias";
import { listarClientes, presupuestosEnviados, totalesGenerales, ultimosDocumentos } from "@/lib/consultas";
import { formatearNumero } from "@/lib/documentos";
import { formatearFecha, formatearPesos } from "@/lib/formato";

export default async function PaginaInicio() {
  const [totales, enviados, ultimos, clientes] = await Promise.all([
    totalesGenerales(),
    presupuestosEnviados(),
    ultimosDocumentos(),
    listarClientes(),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form action={crearDocumentoRapido} className="tarjeta space-y-3 p-5">
          <h2 className="font-semibold">Nuevo documento</h2>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <select name="clienteId" required className="campo" defaultValue="" aria-label="Cliente">
              <option value="" disabled>
                Elegí el cliente…
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select name="tipo" className="campo" defaultValue="presupuesto" aria-label="Tipo de documento">
              <option value="presupuesto">Presupuesto</option>
              <option value="materiales">Lista de materiales</option>
              <option value="informe">Informe técnico</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link href="/clientes/nuevo" className="-my-2 py-2 text-sm text-marca hover:underline">
              + Cliente nuevo
            </Link>
            <button type="submit" className="btn-primario">
              Crear
            </button>
          </div>
        </form>

        <div className="tarjeta space-y-3 p-5">
          <h2 className="font-semibold">Buscar cliente</h2>
          <form action="/clientes" role="search" className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-apagado" />
            <input name="q" type="search" placeholder="Nombre, localidad o contacto…" className="campo pl-9" aria-label="Buscar cliente" />
          </form>
          <dl className="grid grid-cols-4 gap-2 pt-1 text-center">
            {[
              ["Clientes", totales.clientes],
              ["Presupuestos", totales.presupuestos],
              ["Informes", totales.informes],
              ["Listas", totales.materiales],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="rounded-lg bg-fondo px-1 py-2">
                <dd className="text-lg font-semibold tabular-nums">{valor}</dd>
                <dt className="text-xs text-apagado">{rotulo}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">
          Presupuestos enviados, esperando respuesta{" "}
          <span className="font-normal text-apagado">({enviados.length})</span>
        </h2>
        {enviados.length === 0 ? (
          <p className="tarjeta p-5 text-sm text-apagado">
            Ninguno. Cuando mandes un presupuesto, marcalo como “Enviado” y va a aparecer acá hasta que lo aceptes o rechaces.
          </p>
        ) : (
          <ul className="tarjeta divide-y divide-borde overflow-hidden">
            {enviados.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link href={`/documentos/${d.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="font-medium">N.º {formatearNumero(d.tipo, d.numero)}</span> · {d.clienteNombre}
                  <span className="block text-sm text-apagado">
                    {formatearFecha(d.fecha)} {d.total != null && `· ${formatearPesos(d.total)}`}
                  </span>
                </Link>
                <div className="flex gap-2">
                  <form action={cambiarEstado.bind(null, d.id, "aceptado")}>
                    <button className="btn-secundario text-emerald-700">Aceptado</button>
                  </form>
                  <form action={cambiarEstado.bind(null, d.id, "rechazado")}>
                    <button className="btn-secundario text-peligro">Rechazado</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Últimos documentos</h2>
        <ul className="tarjeta divide-y divide-borde overflow-hidden">
          {ultimos.map((d) => (
            <li key={d.id}>
              <Link href={`/documentos/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                <InsigniaTipo tipo={d.tipo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-medium">N.º {formatearNumero(d.tipo, d.numero)}</span> · {d.clienteNombre}
                  </p>
                  <p className="truncate text-sm text-apagado">
                    {d.fecha ? formatearFecha(d.fecha) : "Sin fecha"}
                    {d.titulo ? ` · ${d.titulo}` : ""}
                  </p>
                </div>
                <InsigniaEstado estado={d.estado} importado={d.origen === "importado"} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
