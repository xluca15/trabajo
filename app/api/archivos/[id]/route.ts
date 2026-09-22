import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { esUuid } from "@/lib/consultas";
import { db } from "@/lib/db";
import { archivos } from "@/lib/db/schema";

export async function GET(request: Request, ctx: RouteContext<"/api/archivos/[id]">) {
  if (!(await auth.api.getSession({ headers: await headers() }))) {
    return new Response("No autorizado", { status: 401 });
  }
  const { id } = await ctx.params;
  if (!esUuid(id)) return new Response("No encontrado", { status: 404 });
  const [archivo] = await db.select().from(archivos).where(eq(archivos.id, id));
  if (!archivo) return new Response("No encontrado", { status: 404 });
  // Solo PDF e imágenes se muestran en el navegador; cualquier otra cosa (ej. un .html subido) se descarga.
  const seguroParaVer = /^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(archivo.tipoMime);
  const descargar = !seguroParaVer || new URL(request.url).searchParams.has("descargar");
  return new Response(new Uint8Array(archivo.contenido) as BodyInit, {
    headers: {
      "Content-Type": archivo.tipoMime,
      "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
