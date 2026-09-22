"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function FormLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function ingresar(formData: FormData) {
    setEnviando(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("clave")),
      rememberMe: true,
    });
    if (error) {
      setError(error.status === 401 ? "Email o clave incorrectos." : "No se pudo ingresar. Probá de nuevo.");
      setEnviando(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form action={ingresar} className="space-y-4">
      <div>
        <label htmlFor="email" className="rotulo">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
      </div>
      <div>
        <label htmlFor="clave" className="rotulo">
          Clave
        </label>
        <input id="clave" name="clave" type="password" autoComplete="current-password" required className="campo" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-peligro">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="btn-primario w-full py-2.5">
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
