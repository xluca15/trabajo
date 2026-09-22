/**
 * Crea (o resetea la clave de) un usuario del CRM. El registro desde la web está deshabilitado.
 *   pnpm usuario:crear leo@ejemplo.com "Leonardo Lopez" 'una-clave-larga'
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";

const [email, nombre, clave] = process.argv.slice(2);
if (!email || !nombre || !clave) {
  console.error('Uso: pnpm usuario:crear <email> "<nombre>" <clave>');
  process.exit(1);
}
if (clave.length < 8) {
  console.error("La clave tiene que tener al menos 8 caracteres.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
// Instancia aparte con el registro habilitado, solo para este script.
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
});

async function main() {
  const [existente] = await db.select().from(schema.user).where(eq(schema.user.email, email.toLowerCase()));
  if (existente) {
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(clave);
    await ctx.internalAdapter.updatePassword(existente.id, hash);
    console.log(`Clave actualizada para ${email}`);
  } else {
    await auth.api.signUpEmail({ body: { email, name: nombre, password: clave } });
    console.log(`Usuario creado: ${email}`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
