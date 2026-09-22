"use client";

import { Camera, Upload } from "lucide-react";
import { useState, useTransition, type ChangeEvent } from "react";
import type { EstadoFormulario } from "@/app/acciones";

const LADO_MAXIMO = 2400;
const LIMITE = 4 * 1024 * 1024;

/**
 * Las fotos del celular pesan 3–8 MB: se pasan a JPEG de hasta 2400 px de lado (quedan en ~0.5–1 MB,
 * de sobra para ver una caldera). Si el navegador no puede leer la imagen, se sube el original.
 */
async function prepararArchivo(archivo: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(archivo.type) || archivo.size < 1.5 * 1024 * 1024) return archivo;
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const blob = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, "image/jpeg", 0.85));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

export function SubirArchivos({
  accion,
}: {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}) {
  const [subiendo, iniciar] = useTransition();
  const [progreso, setProgreso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function subir(evento: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (!archivos.length) return;
    setError(null);
    iniciar(async () => {
      const errores: string[] = [];
      // De a uno: Vercel no acepta más de 4.5 MB por pedido.
      for (const [i, original] of archivos.entries()) {
        setProgreso(archivos.length > 1 ? `Subiendo ${i + 1} de ${archivos.length}…` : "Subiendo…");
        const archivo = await prepararArchivo(original);
        if (archivo.size > LIMITE) {
          errores.push(`“${original.name}” pesa más de 4 MB`);
          continue;
        }
        const datos = new FormData();
        datos.append("archivos", archivo);
        try {
          const resultado = await accion(undefined, datos);
          if (resultado?.error) errores.push(resultado.error);
        } catch {
          errores.push(`No se pudo subir “${original.name}”. Revisá la conexión.`);
        }
      }
      setProgreso(null);
      setError(errores.length ? errores.join(" · ") : null);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className={`btn-secundario cursor-pointer ${subiendo ? "pointer-events-none opacity-50" : ""}`}>
          <Upload className="size-4" />
          {progreso ?? "Subir archivos"}
          <input type="file" multiple className="sr-only" disabled={subiendo} onChange={subir} />
        </label>
        {/* En el celular abre la cámara directo (para fotos de la instalación). */}
        <label className={`btn-secundario cursor-pointer sm:hidden ${subiendo ? "pointer-events-none opacity-50" : ""}`}>
          <Camera className="size-4" />
          Sacar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={subiendo}
            onChange={subir}
          />
        </label>
      </div>
      <p className="text-xs text-apagado">PDF, fotos, planillas… Las fotos se achican solas; el resto, hasta 4 MB.</p>
      {error && (
        <p role="alert" className="text-sm text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}
