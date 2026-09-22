import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";

/**
 * URL pública de la app. En Vercel no hace falta configurarla: se toma el dominio de producción
 * (o el de cada preview). En local sale de BETTER_AUTH_URL.
 */
function urlBase() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return undefined;
}

export const auth = betterAuth({
  baseURL: urlBase(),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Nadie puede registrarse desde la web: los usuarios se crean con `pnpm usuario:crear`.
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días: Leo no tiene que loguearse todo el tiempo
  },
  plugins: [nextCookies()],
});
