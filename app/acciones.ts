"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siguienteNumero, obtenerCliente, obtenerDocumento, esUuid } from "@/lib/consultas";
import { db } from "@/lib/db";
import { archivos, clientes, documentos, ESTADOS_PRESUPUESTO, TIPOS_DOCUMENTO, type TipoDocumento } from "@/lib/db/schema";
import { contenidoInicial, esquemaContenido, leerContenido } from "@/lib/documentos";
import { hoyISO } from "@/lib/formato";
import { requerirSesion } from "@/lib/sesion";

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

const textoOpcional = z
  .string()
  .trim()
  .transform((v) => v || null);

const datosCliente = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  razonSocial: textoOpcional,
  cuit: textoOpcional,
  contacto: textoOpcional,
  telefono: textoOpcional,
  email: textoOpcional,
  direccion: textoOpcional,
  localidad: textoOpcional,
  notas: textoOpcional,
});

export type EstadoFormulario = { error?: string } | undefined;

function leerFormularioCliente(formData: FormData) {
  const campos = Object.fromEntries(Object.keys(datosCliente.shape).map((k) => [k, formData.get(k) ?? ""]));
  return datosCliente.safeParse(campos);
}

export async function crearCliente(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirSesion();
  const datos = leerFormularioCliente(formData);
  if (!datos.success) return { error: datos.error.issues[0].message };
  const [cliente] = await db.insert(clientes).values(datos.data).returning({ id: clientes.id });
  redirect(`/clientes/${cliente.id}`);
}

export async function actualizarCliente(
  id: string,
  _: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requerirSesion();
  const datos = leerFormularioCliente(formData);
  if (!datos.success) return { error: datos.error.issues[0].message };
  await db
    .update(clientes)
    .set({ ...datos.data, updatedAt: new Date() })
    .where(eq(clientes.id, id));
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function eliminarCliente(id: string) {
  await requerirSesion();
  await db.delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/clientes");
  redirect("/clientes");
}

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

export async function crearDocumento(clienteId: string, tipo: TipoDocumento) {
  await requerirSesion();
  if (!TIPOS_DOCUMENTO.includes(tipo)) throw new Error("Tipo de documento inválido");
  const cliente = await obtenerCliente(clienteId);
  if (!cliente) throw new Error("Cliente no encontrado");
  const [documento] = await db
    .insert(documentos)
    .values({
      clienteId,
      tipo,
      numero: await siguienteNumero(tipo),
      fecha: hoyISO(),
      estado: tipo === "presupuesto" ? "borrador" : null,
      contenido: contenidoInicial(tipo, cliente),
    })
    .returning({ id: documentos.id });
  redirect(`/documentos/${documento.id}`);
}

const datosDocumento = z.object({
  numero: z.number().int().positive().nullable(),
  fecha: z.iso.date().nullable(),
  titulo: z.string().trim().max(200).nullable(),
  estado: z.enum(ESTADOS_PRESUPUESTO).nullable(),
  contenido: z.unknown(),
});

export type DatosDocumento = z.input<typeof datosDocumento>;

/** Autoguardado del editor. Devuelve un error legible en vez de tirar excepción. */
export async function guardarDocumento(id: string, entrada: DatosDocumento): Promise<{ error?: string }> {
  await requerirSesion();
  const fila = await obtenerDocumento(id);
  if (!fila) return { error: "El documento ya no existe" };
  if (fila.documento.origen === "importado") return { error: "Los documentos importados no se editan: duplicalo." };

  const datos = datosDocumento.safeParse(entrada);
  if (!datos.success) return { error: "Hay datos inválidos (revisá número y fecha)" };
  const tipo = fila.documento.tipo;
  const contenido = esquemaContenido[tipo].safeParse(datos.data.contenido);
  if (!contenido.success) return { error: "El contenido tiene un formato inválido" };

  await db
    .update(documentos)
    .set({
      numero: datos.data.numero,
      fecha: datos.data.fecha,
      titulo: datos.data.titulo || null,
      estado: tipo === "presupuesto" ? (datos.data.estado ?? "borrador") : null,
      contenido: contenido.data,
      total: tipo === "presupuesto" && "total" in contenido.data ? contenido.data.total : null,
      updatedAt: new Date(),
    })
    .where(eq(documentos.id, id));
  return {};
}

export async function cambiarEstado(id: string, estado: (typeof ESTADOS_PRESUPUESTO)[number]) {
  await requerirSesion();
  if (!ESTADOS_PRESUPUESTO.includes(estado)) throw new Error("Estado inválido");
  const fila = await obtenerDocumento(id);
  if (!fila || fila.documento.tipo !== "presupuesto") throw new Error("Documento no encontrado");
  await db.update(documentos).set({ estado, updatedAt: new Date() }).where(eq(documentos.id, id));
  revalidatePath(`/clientes/${fila.cliente.id}`);
  revalidatePath("/");
}

/** Crea un documento nuevo (con número nuevo y fecha de hoy) a partir de otro. Sirve también con los importados. */
export async function duplicarDocumento(id: string, clienteDestinoId?: string) {
  await requerirSesion();
  const fila = await obtenerDocumento(id);
  if (!fila) throw new Error("Documento no encontrado");
  const destino = clienteDestinoId && esUuid(clienteDestinoId) ? clienteDestinoId : fila.cliente.id;
  const tipo = fila.documento.tipo;
  const [nuevo] = await db
    .insert(documentos)
    .values({
      clienteId: destino,
      tipo,
      numero: await siguienteNumero(tipo),
      fecha: hoyISO(),
      titulo: fila.documento.titulo,
      estado: tipo === "presupuesto" ? "borrador" : null,
      contenido: leerContenido(tipo, fila.documento.contenido),
      total: fila.documento.total,
    })
    .returning({ id: documentos.id });
  redirect(`/documentos/${nuevo.id}`);
}

export async function eliminarDocumento(id: string) {
  await requerirSesion();
  const fila = await obtenerDocumento(id);
  if (!fila) redirect("/clientes");
  // El PDF original de un importado se borra con su documento.
  await db.delete(archivos).where(eq(archivos.documentoId, id));
  await db.delete(documentos).where(eq(documentos.id, id));
  revalidatePath(`/clientes/${fila.cliente.id}`);
  redirect(`/clientes/${fila.cliente.id}`);
}

// ---------------------------------------------------------------------------
// Archivos sueltos del cliente
// ---------------------------------------------------------------------------

const TAMANO_MAXIMO = 4 * 1024 * 1024;

export async function subirArchivos(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirSesion();
  if (!(await obtenerCliente(clienteId))) return { error: "Cliente no encontrado" };
  const subidos = formData.getAll("archivos").filter((a): a is File => a instanceof File && a.size > 0);
  if (!subidos.length) return { error: "Elegí al menos un archivo" };
  const grande = subidos.find((a) => a.size > TAMANO_MAXIMO);
  if (grande) return { error: `"${grande.name}" pesa más de 4 MB` };

  for (const archivo of subidos) {
    await db.insert(archivos).values({
      clienteId,
      nombre: archivo.name,
      tipoMime: archivo.type || "application/octet-stream",
      tamano: archivo.size,
      contenido: Buffer.from(await archivo.arrayBuffer()),
    });
  }
  revalidatePath(`/clientes/${clienteId}`);
  return {};
}

export async function eliminarArchivo(id: string) {
  await requerirSesion();
  if (!esUuid(id)) return;
  const [borrado] = await db.delete(archivos).where(eq(archivos.id, id)).returning({ clienteId: archivos.clienteId });
  if (borrado) revalidatePath(`/clientes/${borrado.clienteId}`);
}

/** Para el formulario rápido de la pantalla de inicio (cliente + tipo elegidos en selects). */
export async function crearDocumentoRapido(formData: FormData) {
  const clienteId = String(formData.get("clienteId") ?? "");
  const tipo = String(formData.get("tipo") ?? "") as TipoDocumento;
  await crearDocumento(clienteId, tipo);
}
