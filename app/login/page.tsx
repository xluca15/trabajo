import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FormLogin } from "./form-login";
import logo from "@/public/pdf/logo-leo-calderas.png";

export const metadata: Metadata = { title: "Ingresar" };

export default async function PaginaLogin() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Image src={logo} alt="Leo Calderas" priority className="mx-auto mb-8 h-auto w-44 rounded-lg" />
        <div className="tarjeta p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Ingresar</h1>
          <p className="mt-1 mb-5 text-sm text-apagado">Clientes, presupuestos e informes.</p>
          <FormLogin />
        </div>
      </div>
    </main>
  );
}
