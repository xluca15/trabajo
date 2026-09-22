import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { archivosDeDocumento, obtenerDocumento } from "@/lib/consultas";
import { db } from "@/lib/db";
import { archivos } from "@/lib/db/schema";
import { nombreArchivoPdf } from "@/lib/documentos";
import { generarPdf } from "@/lib/pdf/servidor";
import { eq } from "drizzle-orm";

// GET /api/documentos/:id/pdf            → se ve en el navegador
// GET /api/documentos/:id/pdf?descargar  → se descarga
export async function GET(request: Request, ctx: RouteContext<"/api/documentos/[id]/pdf">) {
  if (!(await auth.api.getSession({ headers: await headers() }))) {
    return new Response("No autorizado", { status: 401 });
  }
  const { id } = await ctx.params;
  const fila = await obtenerDocumento(id);
  if (!fila) return new Response("No encontrado", { status: 404 });
  const { documento, cliente } = fila;
  const descargar = new URL(request.url).searchParams.has("descargar");

  let pdf: Uint8Array;
  let nombre = nombreArchivoPdf(documento.tipo, documento.numero, cliente.nombre);
  if (documento.origen === "importado") {
    // De los importados se entrega el PDF original de Leo, tal cual.
    const original = (await archivosDeDocumento(id)).find((a) => a.tipoMime === "application/pdf");
    if (!original) return new Response("El PDF original no está", { status: 404 });
    const [archivo] = await db.select().from(archivos).where(eq(archivos.id, original.id));
    pdf = new Uint8Array(archivo.contenido);
    nombre = archivo.nombre;
  } else {
    pdf = new Uint8Array(
      await generarPdf({
        tipo: documento.tipo,
        numero: documento.numero,
        fecha: documento.fecha,
        titulo: documento.titulo,
        cliente: { nombre: cliente.nombre },
        contenido: documento.contenido,
      }),
    );
  }

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
