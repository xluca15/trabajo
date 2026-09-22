"use client";

import { Upload } from "lucide-react";
import { useActionState, useRef } from "react";
import type { EstadoFormulario } from "@/app/acciones";

export function SubirArchivos({
  accion,
}: {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, enviar, enviando] = useActionState(async (anterior: EstadoFormulario, datos: FormData) => {
    const resultado = await accion(anterior, datos);
    if (!resultado?.error) formulario.current?.reset();
    return resultado;
  }, undefined);

  return (
    <form ref={formulario} action={enviar} className="space-y-2">
      <label className="btn-secundario cursor-pointer">
        <Upload className="size-4" />
        {enviando ? "Subiendo…" : "Subir archivos"}
        <input
          type="file"
          name="archivos"
          multiple
          className="sr-only"
          disabled={enviando}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </label>
      <p className="text-xs text-apagado">PDF, fotos, planillas… hasta 4 MB cada uno.</p>
      {estado?.error && (
        <p role="alert" className="text-sm text-peligro">
          {estado.error}
        </p>
      )}
    </form>
  );
}
