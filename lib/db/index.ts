import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

function crearPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL en el entorno");
  const pool = new Pool({ connectionString, max: 5 });
  // En Vercel cierra las conexiones ociosas antes de que la función se suspenda (fuera de Vercel no hace nada).
  attachDatabasePool(pool);
  return pool;
}

// En desarrollo el hot reload re-evalúa este módulo: reusamos el pool.
const pool = globalForDb.pool ?? crearPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
