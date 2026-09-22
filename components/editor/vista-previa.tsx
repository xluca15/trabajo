"use client";

import { pdf } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { registrarFuentes } from "@/lib/pdf/comun";
import { DocumentoPdf, type DatosDocumentoPdf } from "@/lib/pdf/plantillas";

registrarFuentes("/pdf/fonts");

let workerIniciado = false;
function iniciarWorker() {
  if (workerIniciado) return;
  workerIniciado = true;
  GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
    type: "module",
  });
}

/** Dibuja cada página del PDF en un canvas del ancho indicado (nítido en pantallas de alta densidad). */
async function dibujarPaginas(datos: Uint8Array, ancho: number, cancelado: () => boolean) {
  const tarea = getDocument({ data: datos });
  const documento = await tarea.promise;
  try {
    const lienzos: HTMLCanvasElement[] = [];
    for (let n = 1; n <= documento.numPages; n++) {
      const pagina = await documento.getPage(n);
      const escala = ancho / pagina.getViewport({ scale: 1 }).width;
      const densidad = window.devicePixelRatio || 1;
      const viewport = pagina.getViewport({ scale: escala * densidad });
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.floor(viewport.width);
      lienzo.height = Math.floor(viewport.height);
      lienzo.style.width = `${ancho}px`;
      lienzo.style.height = `${Math.floor(viewport.height / densidad)}px`;
      lienzo.className = "block bg-white shadow-md";
      lienzo.setAttribute("aria-label", `Página ${n} de ${documento.numPages}`);
      await pagina.render({ canvas: lienzo, viewport }).promise;
      if (cancelado()) return null;
      lienzos.push(lienzo);
    }
    return lienzos;
  } finally {
    void tarea.destroy();
  }
}

/**
 * Vista previa en vivo: genera en el navegador el mismo PDF que baja el servidor y lo dibuja con pdf.js.
 * La versión nueva se arma fuera de pantalla y reemplaza a la anterior de una sola vez:
 * no parpadea ni pierde la posición de scroll.
 */
export default function VistaPrevia({ datos }: { datos: DatosDocumentoPdf }) {
  const hojas = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [estado, setEstado] = useState<"inicial" | "listo" | "actualizando" | "error">("inicial");
  const clave = JSON.stringify(datos);

  useEffect(() => {
    const elemento = hojas.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => setAncho(Math.floor(entrada.contentRect.width)));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!ancho) return;
    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setEstado((actual) => (actual === "inicial" ? actual : "actualizando"));
      try {
        iniciarWorker();
        const blob = await pdf(<DocumentoPdf datos={JSON.parse(clave)} logo="/pdf/logo-leo-calderas.png" />).toBlob();
        if (cancelado) return;
        const lienzos = await dibujarPaginas(new Uint8Array(await blob.arrayBuffer()), ancho, () => cancelado);
        if (!lienzos || cancelado) return;
        hojas.current?.replaceChildren(...lienzos);
        setEstado("listo");
      } catch (error) {
        console.error(error);
        if (!cancelado) setEstado("error");
      }
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [clave, ancho]);

  return (
    <div className="relative h-full bg-slate-200/70">
      <div className="h-full overflow-y-auto p-3 sm:p-5">
        {/* Los canvas se insertan a mano: React no renderiza hijos acá. */}
        <div ref={hojas} className="mx-auto flex max-w-[820px] flex-col gap-4" />
      </div>
      {estado === "inicial" && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-apagado">Generando vista previa…</p>
      )}
      {/* Solo aparece si la actualización tarda (el delay aplica al mostrarse, no al ocultarse). */}
      <p
        aria-hidden
        className={`pointer-events-none absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-apagado shadow-sm transition-opacity duration-200 ${
          estado === "actualizando" ? "opacity-100 delay-500" : "opacity-0"
        }`}
      >
        Actualizando…
      </p>
      {estado === "error" && (
        <p className="absolute inset-x-3 top-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-peligro">
          No se pudo generar la vista previa. Probá descargar el PDF.
        </p>
      )}
    </div>
  );
}
