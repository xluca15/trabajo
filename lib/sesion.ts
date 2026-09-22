import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Devuelve la sesión o redirige a /login. Usar en páginas, route handlers y server actions. */
export async function requerirSesion() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/login");
  return sesion;
}
