/**
 * Importa la carpeta de clientes de Leo (una subcarpeta por cliente, con Presupuestos/, Materiales/, Informes/).
 *   pnpm importar "/home/celiz/Escritorio/Clientes"            → importa
 *   pnpm importar "/home/celiz/Escritorio/Clientes" --prueba   → muestra qué haría, sin tocar la base
 *
 * Se puede correr más de una vez: los archivos que ya están (mismo cliente y nombre) se saltean.
 * Necesita `pdftotext` (paquete poppler) para leer el texto de los PDFs.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import { parsearDocumento } from "../lib/importar/parsear";

const [carpeta, ...flags] = process.argv.slice(2);
const prueba = flags.includes("--prueba");
if (!carpeta) {
  console.error('Uso: pnpm importar "<carpeta de clientes>" [--prueba]');
  process.exit(1);
}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function tipoPorCarpeta(nombre: string): schema.TipoDocumento | null {
  if (/presupuesto/i.test(nombre)) return "presupuesto";
  if (/material/i.test(nombre)) return "materiales";
  if (/informe/i.test(nombre)) return "informe";
  return null;
}

function listarArchivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = path.join(dir, nombre);
    return statSync(ruta).isDirectory() ? listarArchivos(ruta) : [ruta];
  });
}

function textoDePdf(ruta: string): string {
  return execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", ruta, "-"], { encoding: "utf8" });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function buscarOCrearCliente(nombre: string) {
  const [existente] = await db
    .select()
    .from(schema.clientes)
    .where(sql`lower(${schema.clientes.nombre}) = lower(${nombre})`);
  if (existente) return { cliente: existente, nuevo: false };
  if (prueba) return { cliente: { id: "(nuevo)", nombre } as schema.Cliente, nuevo: true };
  const [cliente] = await db.insert(schema.clientes).values({ nombre }).returning();
  return { cliente, nuevo: true };
}

async function yaImportado(clienteId: string, nombre: string) {
  if (clienteId === "(nuevo)") return false;
  const [fila] = await db
    .select({ id: schema.archivos.id })
    .from(schema.archivos)
    .where(and(eq(schema.archivos.clienteId, clienteId), eq(schema.archivos.nombre, nombre)));
  return Boolean(fila);
}

async function main() {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
  } catch {
    console.error("Falta pdftotext. Instalalo con el paquete poppler (ej: sudo pacman -S poppler).");
    process.exit(1);
  }

  const resumen = { clientesNuevos: 0, documentos: 0, archivosSueltos: 0, salteados: 0 };
  const avisos: string[] = [];
  const numeros = new Map<string, string[]>();

  const carpetasCliente = readdirSync(carpeta)
    .filter((n) => !n.startsWith("_") && !n.startsWith(".") && statSync(path.join(carpeta, n)).isDirectory())
    .sort((a, b) => a.localeCompare(b, "es"));

  for (const nombreCliente of carpetasCliente) {
    const { cliente, nuevo } = await buscarOCrearCliente(nombreCliente);
    if (nuevo) resumen.clientesNuevos++;
    console.log(`\n${cliente.nombre}${nuevo ? " (nuevo)" : ""}`);

    // PDFs primero, así un .docx con el mismo nombre se adjunta a su documento.
    const archivos = listarArchivos(path.join(carpeta, nombreCliente)).sort((a, b) =>
      Number(a.toLowerCase().endsWith(".pdf")) === Number(b.toLowerCase().endsWith(".pdf"))
        ? a.localeCompare(b)
        : a.toLowerCase().endsWith(".pdf")
          ? -1
          : 1,
    );
    const documentoPorBase = new Map<string, string>();

    for (const ruta of archivos) {
      const nombre = path.basename(ruta);
      const extension = path.extname(nombre).toLowerCase();
      const tipoMime = MIME[extension];
      if (!tipoMime) {
        avisos.push(`${nombreCliente}/${nombre}: tipo de archivo no soportado, no se importó`);
        continue;
      }
      if (await yaImportado(cliente.id, nombre)) {
        resumen.salteados++;
        continue;
      }
      const contenido = readFileSync(ruta);
      const base = path.join(path.dirname(ruta), path.basename(nombre, path.extname(nombre)));
      const tipo = tipoPorCarpeta(path.basename(path.dirname(ruta)));

      let documentoId: string | null = documentoPorBase.get(base) ?? null;
      if (tipo && extension === ".pdf") {
        const datos = parsearDocumento(tipo, textoDePdf(ruta), nombre);
        const numeroEnNombre = nombre.match(/(\d{1,4})/g)?.map(Number) ?? [];
        if (datos.numero != null && numeroEnNombre.length && !numeroEnNombre.includes(datos.numero)) {
          avisos.push(`${nombreCliente}/${nombre}: el PDF dice N.º ${datos.numero} (el nombre del archivo dice otro)`);
        }
        if (datos.numero != null) {
          const clave = `${tipo}-${datos.numero}`;
          numeros.set(clave, [...(numeros.get(clave) ?? []), `${nombreCliente}/${nombre}`]);
        }
        console.log(
          `  ${tipo.padEnd(11)} N.º ${String(datos.numero ?? "—").padEnd(4)} ${datos.fecha ?? "sin fecha "}  ${
            datos.total != null ? `$ ${datos.total.toLocaleString("es-AR")}` : ""
          }  ${nombre}`,
        );
        if (!prueba) {
          const [documento] = await db
            .insert(schema.documentos)
            .values({
              clienteId: cliente.id,
              tipo,
              numero: datos.numero,
              fecha: datos.fecha,
              titulo: datos.titulo,
              total: datos.total,
              contenido: datos.contenido,
              origen: "importado",
              estado: null,
            })
            .returning({ id: schema.documentos.id });
          documentoId = documento.id;
          documentoPorBase.set(base, documento.id);
        }
        resumen.documentos++;
      } else {
        console.log(`  archivo     ${nombre}${documentoId ? " (adjunto a su documento)" : ""}`);
        resumen.archivosSueltos++;
      }

      if (!prueba) {
        await db.insert(schema.archivos).values({
          clienteId: cliente.id,
          documentoId,
          nombre,
          tipoMime,
          tamano: contenido.length,
          contenido,
        });
      }
    }
  }

  for (const [clave, rutas] of numeros) {
    if (rutas.length > 1) avisos.push(`N.º repetido (${clave}): ${rutas.join(" · ")}`);
  }

  console.log(`\n${prueba ? "PRUEBA (no se guardó nada)" : "Listo"}:`, resumen);
  if (avisos.length) console.log(`\nPara revisar:\n- ${avisos.join("\n- ")}`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
