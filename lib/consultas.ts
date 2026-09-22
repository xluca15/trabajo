import "server-only";
import { and, desc, eq, getTableColumns, ilike, isNull, max, or, sql } from "drizzle-orm";
import { db } from "./db";
import { archivos, clientes, documentos, type TipoDocumento } from "./db/schema";

// Columnas de documentos sin el contenido (para listados).
const { contenido: _contenido, ...columnasListado } = getTableColumns(documentos);

export async function listarClientes(busqueda?: string) {
  const texto = busqueda?.trim();
  const filtro = texto
    ? or(
        ilike(clientes.nombre, `%${texto}%`),
        ilike(clientes.razonSocial, `%${texto}%`),
        ilike(clientes.localidad, `%${texto}%`),
        ilike(clientes.contacto, `%${texto}%`),
      )
    : undefined;
  return db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      localidad: clientes.localidad,
      telefono: clientes.telefono,
      contacto: clientes.contacto,
      cantidadDocumentos: sql<number>`count(${documentos.id})::int`,
      ultimaFecha: sql<string | null>`max(${documentos.fecha})`,
    })
    .from(clientes)
    .leftJoin(documentos, eq(documentos.clienteId, clientes.id))
    .where(filtro)
    .groupBy(clientes.id)
    .orderBy(sql`lower(${clientes.nombre})`);
}

export async function obtenerCliente(id: string) {
  if (!esUuid(id)) return null;
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
  return cliente ?? null;
}

export async function documentosDeCliente(clienteId: string) {
  return db
    .select(columnasListado)
    .from(documentos)
    .where(eq(documentos.clienteId, clienteId))
    .orderBy(desc(sql`coalesce(${documentos.fecha}, '1900-01-01')`), desc(documentos.numero), desc(documentos.createdAt));
}

/** Archivos subidos a mano (los PDFs originales de documentos importados se ven desde su documento). */
export async function archivosSueltosDeCliente(clienteId: string) {
  return db
    .select({
      id: archivos.id,
      nombre: archivos.nombre,
      tipoMime: archivos.tipoMime,
      tamano: archivos.tamano,
      createdAt: archivos.createdAt,
    })
    .from(archivos)
    .where(and(eq(archivos.clienteId, clienteId), isNull(archivos.documentoId)))
    .orderBy(desc(archivos.createdAt));
}

export async function obtenerDocumento(id: string) {
  if (!esUuid(id)) return null;
  const [fila] = await db
    .select({ documento: documentos, cliente: clientes })
    .from(documentos)
    .innerJoin(clientes, eq(clientes.id, documentos.clienteId))
    .where(eq(documentos.id, id));
  return fila ?? null;
}

export async function archivosDeDocumento(documentoId: string) {
  return db
    .select({ id: archivos.id, nombre: archivos.nombre, tipoMime: archivos.tipoMime, tamano: archivos.tamano })
    .from(archivos)
    .where(eq(archivos.documentoId, documentoId))
    .orderBy(archivos.nombre);
}

export async function siguienteNumero(tipo: TipoDocumento) {
  const [fila] = await db
    .select({ maximo: max(documentos.numero) })
    .from(documentos)
    .where(eq(documentos.tipo, tipo));
  return (fila?.maximo ?? 0) + 1;
}

export async function ultimosDocumentos(limite = 8) {
  return db
    .select({ ...columnasListado, clienteNombre: clientes.nombre })
    .from(documentos)
    .innerJoin(clientes, eq(clientes.id, documentos.clienteId))
    .orderBy(desc(documentos.updatedAt))
    .limit(limite);
}

export async function presupuestosEnviados() {
  return db
    .select({ ...columnasListado, clienteNombre: clientes.nombre })
    .from(documentos)
    .innerJoin(clientes, eq(clientes.id, documentos.clienteId))
    .where(and(eq(documentos.tipo, "presupuesto"), eq(documentos.estado, "enviado")))
    .orderBy(desc(documentos.fecha));
}

export async function totalesGenerales() {
  const [fila] = await db
    .select({
      clientes: sql<number>`(select count(*)::int from ${clientes})`,
      presupuestos: sql<number>`count(*) filter (where ${documentos.tipo} = 'presupuesto')::int`,
      informes: sql<number>`count(*) filter (where ${documentos.tipo} = 'informe')::int`,
      materiales: sql<number>`count(*) filter (where ${documentos.tipo} = 'materiales')::int`,
    })
    .from(documentos);
  return fila;
}

export function esUuid(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

/**
 * Ítems de presupuesto más usados (incluye los importados), para agregarlos con un clic.
 * Agrupa variantes que solo difieren en mayúsculas o en el punto final y muestra la más usada.
 */
export async function itemsFrecuentes(limite = 60) {
  const filas = await db.execute<{ texto: string; veces: number }>(sql`
    select mode() within group (order by texto) as texto, count(*)::int as veces
    from ${documentos}, jsonb_array_elements_text(${documentos.contenido} -> 'items') as texto
    where ${documentos.tipo} = 'presupuesto' and length(texto) between 8 and 400
    group by lower(regexp_replace(texto, '[[:space:].]+$', ''))
    order by veces desc, texto
    limit ${limite}
  `);
  return filas.rows;
}
