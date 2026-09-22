import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText, Mail, MapPin, Paperclip, Pencil, Phone, Wrench } from "lucide-react";
import { crearDocumento, eliminarArchivo, subirArchivos } from "@/app/acciones";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { InsigniaEstado, InsigniaTipo } from "@/components/insignias";
import { SubirArchivos } from "@/components/subir-archivos";
import { archivosSueltosDeCliente, documentosDeCliente, obtenerCliente } from "@/lib/consultas";
import { TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/db/schema";
import { formatearNumero, NOMBRE_TIPO_PLURAL } from "@/lib/documentos";
import { formatearFecha, formatearPesos } from "@/lib/formato";

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const cliente = await obtenerCliente((await params).id);
  return { title: cliente?.nombre ?? "Cliente" };
}

const NUEVOS: { tipo: TipoDocumento; texto: string; icono: typeof FileText }[] = [
  { tipo: "presupuesto", texto: "Presupuesto", icono: FileText },
  { tipo: "materiales", texto: "Lista de materiales", icono: ClipboardList },
  { tipo: "informe", texto: "Informe técnico", icono: Wrench },
];

function tamanoLegible(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function PaginaCliente({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const { tipo: filtro } = await searchParams;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const [todos, sueltos] = await Promise.all([documentosDeCliente(id), archivosSueltosDeCliente(id)]);
  const tipoFiltro = TIPOS_DOCUMENTO.find((t) => t === filtro);
  const docs = tipoFiltro ? todos.filter((d) => d.tipo === tipoFiltro) : todos;
  const cuenta = (t: TipoDocumento) => todos.filter((d) => d.tipo === t).length;

  const direccion = [cliente.direccion, cliente.localidad].filter(Boolean).join(", ");
  const datos = [
    cliente.contacto && { icono: null, rotulo: "Contacto", valor: cliente.contacto },
    cliente.telefono && { icono: Phone, rotulo: "Teléfono", valor: cliente.telefono, href: `tel:${cliente.telefono.replace(/[^\d+]/g, "")}` },
    cliente.email && { icono: Mail, rotulo: "Email", valor: cliente.email, href: `mailto:${cliente.email}` },
    direccion && { icono: MapPin, rotulo: "Dirección", valor: direccion, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` },
    cliente.razonSocial && { icono: null, rotulo: "Razón social", valor: cliente.razonSocial },
    cliente.cuit && { icono: null, rotulo: "CUIT", valor: cliente.cuit },
  ].filter(Boolean) as { icono: typeof Phone | null; rotulo: string; valor: string; href?: string }[];

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-apagado hover:text-tinta">
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nombre}</h1>
          {cliente.razonSocial && cliente.razonSocial !== cliente.nombre && (
            <p className="text-apagado">{cliente.razonSocial}</p>
          )}
        </div>
        <Link href={`/clientes/${id}/editar`} className="btn-secundario">
          <Pencil className="size-4" /> Editar datos
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="tarjeta p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold">Nuevo documento</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {NUEVOS.map(({ tipo, texto, icono: Icono }) => (
                <form key={tipo} action={crearDocumento.bind(null, id, tipo)}>
                  <button type="submit" className="btn-secundario w-full justify-start py-3">
                    <Icono className="size-4 text-marca" /> {texto}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar documentos">
              <Link
                href={`/clientes/${id}`}
                role="tab"
                aria-selected={!tipoFiltro}
                className={`rounded-full px-3 py-1 text-sm ${!tipoFiltro ? "bg-tinta text-white" : "bg-white text-apagado ring-1 ring-borde hover:text-tinta"}`}
              >
                Todos ({todos.length})
              </Link>
              {TIPOS_DOCUMENTO.map((t) => (
                <Link
                  key={t}
                  href={`/clientes/${id}?tipo=${t}`}
                  role="tab"
                  aria-selected={tipoFiltro === t}
                  className={`rounded-full px-3 py-1 text-sm ${tipoFiltro === t ? "bg-tinta text-white" : "bg-white text-apagado ring-1 ring-borde hover:text-tinta"}`}
                >
                  {NOMBRE_TIPO_PLURAL[t]} ({cuenta(t)})
                </Link>
              ))}
            </div>

            {docs.length === 0 ? (
              <div className="tarjeta p-8 text-center text-apagado">Todavía no hay documentos acá.</div>
            ) : (
              <ul className="tarjeta divide-y divide-borde overflow-hidden">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-fondo">
                    <Link href={`/documentos/${d.id}`} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <InsigniaTipo tipo={d.tipo} />
                        <span className="font-medium">N.º {formatearNumero(d.tipo, d.numero)}</span>
                        <InsigniaEstado estado={d.estado} importado={d.origen === "importado"} />
                      </div>
                      <p className="mt-1 truncate text-sm text-apagado">
                        {d.fecha ? formatearFecha(d.fecha) : "Sin fecha"}
                        {d.titulo ? ` · ${d.titulo}` : ""}
                      </p>
                    </Link>
                    {d.tipo === "presupuesto" && d.total != null && (
                      <span className="hidden font-medium tabular-nums sm:block">{formatearPesos(d.total)}</span>
                    )}
                    <a
                      href={`/api/documentos/${d.id}/pdf`}
                      target="_blank"
                      className="btn-fantasma px-2"
                      title="Ver PDF"
                    >
                      <FileText className="size-4" />
                      <span className="sr-only">Ver PDF</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="tarjeta p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold">Datos</h2>
            {datos.length === 0 ? (
              <p className="text-sm text-apagado">
                Sin datos de contacto.{" "}
                <Link href={`/clientes/${id}/editar`} className="text-marca underline">
                  Agregar
                </Link>
              </p>
            ) : (
              <dl className="space-y-3 text-sm">
                {datos.map(({ icono: Icono, rotulo, valor, href }) => (
                  <div key={rotulo}>
                    <dt className="text-xs text-apagado">{rotulo}</dt>
                    <dd className="flex items-center gap-1.5 break-words">
                      {Icono && <Icono className="size-3.5 shrink-0 text-apagado" />}
                      {href ? (
                        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} className="text-marca hover:underline">
                          {valor}
                        </a>
                      ) : (
                        valor
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {cliente.notas && (
              <div className="mt-4 border-t border-borde pt-3">
                <p className="text-xs text-apagado">Notas</p>
                <p className="text-sm whitespace-pre-line">{cliente.notas}</p>
              </div>
            )}
          </section>

          <section className="tarjeta p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="size-4" /> Archivos
            </h2>
            {sueltos.length > 0 && (
              <ul className="mb-4 space-y-2">
                {sueltos.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <a href={`/api/archivos/${a.id}`} target="_blank" className="min-w-0 flex-1 truncate text-marca hover:underline">
                      {a.nombre}
                    </a>
                    <span className="shrink-0 text-xs text-apagado">{tamanoLegible(a.tamano)}</span>
                    <BotonConfirmar accion={eliminarArchivo.bind(null, a.id)} className="btn-fantasma px-1.5 text-xs" pregunta="¿Borrar?" confirmar="Borrar">
                      ✕<span className="sr-only">Borrar {a.nombre}</span>
                    </BotonConfirmar>
                  </li>
                ))}
              </ul>
            )}
            <SubirArchivos accion={subirArchivos.bind(null, id)} />
          </section>
        </aside>
      </div>
    </div>
  );
}
