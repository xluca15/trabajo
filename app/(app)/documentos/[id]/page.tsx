import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Download, FileText, Trash2 } from "lucide-react";
import { duplicarDocumento, eliminarDocumento } from "@/app/acciones";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { EditorDocumento } from "@/components/editor/editor-documento";
import { archivosDeDocumento, itemsFrecuentes, obtenerDocumento } from "@/lib/consultas";
import { formatearNumero, leerContenido, NOMBRE_TIPO } from "@/lib/documentos";
import { formatearFecha, formatearPesos } from "@/lib/formato";

export async function generateMetadata({ params }: PageProps<"/documentos/[id]">): Promise<Metadata> {
  const fila = await obtenerDocumento((await params).id);
  if (!fila) return { title: "Documento" };
  const { documento, cliente } = fila;
  return { title: `${NOMBRE_TIPO[documento.tipo]} ${formatearNumero(documento.tipo, documento.numero)} · ${cliente.nombre}` };
}

export default async function PaginaDocumento({ params }: PageProps<"/documentos/[id]">) {
  const { id } = await params;
  const fila = await obtenerDocumento(id);
  if (!fila) notFound();
  const { documento, cliente } = fila;

  if (documento.origen === "importado") {
    const adjuntos = await archivosDeDocumento(id);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href={`/clientes/${cliente.id}`} className="text-sm text-apagado hover:text-tinta">
              ← {cliente.nombre}
            </Link>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {NOMBRE_TIPO[documento.tipo]} N.º {formatearNumero(documento.tipo, documento.numero)}
            </h1>
            <p className="text-sm text-apagado">
              {documento.fecha ? formatearFecha(documento.fecha) : "Sin fecha"}
              {documento.total != null && ` · ${formatearPesos(documento.total)}`}
              {documento.titulo && ` · ${documento.titulo}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={duplicarDocumento.bind(null, id, undefined)}>
              <button type="submit" className="btn-primario">
                <Copy className="size-4" /> Usar como base para uno nuevo
              </button>
            </form>
            <a href={`/api/documentos/${id}/pdf?descargar`} className="btn-secundario">
              <Download className="size-4" /> Descargar
            </a>
          </div>
        </div>
        <p className="rounded-lg bg-marca-suave px-4 py-3 text-sm text-marca-oscuro">
          Este documento vino de la carpeta de Leo: se muestra el PDF original tal cual. Para hacer uno parecido, usalo
          como base: se crea uno nuevo con el texto ya cargado, número nuevo y fecha de hoy.
        </p>
        <div className="tarjeta h-[75dvh] overflow-hidden">
          <iframe src={`/api/documentos/${id}/pdf#view=FitH`} title="PDF original" className="size-full" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap gap-3 text-sm">
            {adjuntos.map((a) => (
              <li key={a.id}>
                <a href={`/api/archivos/${a.id}?descargar`} className="inline-flex items-center gap-1 text-marca hover:underline">
                  <FileText className="size-4" /> {a.nombre}
                </a>
              </li>
            ))}
          </ul>
          <BotonConfirmar accion={eliminarDocumento.bind(null, id)} pregunta="¿Eliminar este documento y su PDF?">
            <Trash2 className="size-4" /> Eliminar
          </BotonConfirmar>
        </div>
      </div>
    );
  }

  const frecuentes = documento.tipo === "presupuesto" ? await itemsFrecuentes() : [];
  return (
    <EditorDocumento
      inicial={{
        id: documento.id,
        tipo: documento.tipo,
        numero: documento.numero,
        fecha: documento.fecha,
        titulo: documento.titulo,
        estado: documento.estado,
        contenido: leerContenido(documento.tipo, documento.contenido),
      }}
      cliente={{ id: cliente.id, nombre: cliente.nombre }}
      frecuentes={frecuentes}
    />
  );
}
