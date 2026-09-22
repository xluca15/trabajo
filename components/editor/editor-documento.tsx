"use client";

import { Copy, Download, Eye, Pencil, Share2, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { duplicarDocumento, eliminarDocumento, guardarDocumento } from "@/app/acciones";
import { BotonConfirmar } from "@/components/boton-confirmar";
import {
  NOMBRE_ESTADO,
  NOMBRE_TIPO,
  formatearNumero,
  nombreArchivoPdf,
  type ContenidoInforme,
  type ContenidoMateriales,
  type ContenidoPorTipo,
  type ContenidoPresupuesto,
} from "@/lib/documentos";
import { ESTADOS_PRESUPUESTO, type EstadoPresupuesto, type TipoDocumento } from "@/lib/tipos";
import { Campo } from "./campos";
import { SeccionInforme, SeccionMateriales, SeccionPresupuesto } from "./secciones";

const VistaPrevia = dynamic(() => import("./vista-previa"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-apagado">Cargando…</div>,
});

export type DocumentoEditable = {
  id: string;
  tipo: TipoDocumento;
  numero: number | null;
  fecha: string | null;
  titulo: string | null;
  estado: EstadoPresupuesto | null;
  contenido: ContenidoPorTipo[TipoDocumento];
};

type Guardado = "guardado" | "pendiente" | "guardando" | "error";

const TEXTO_GUARDADO: Record<Guardado, string> = {
  guardado: "Guardado",
  pendiente: "Cambios sin guardar…",
  guardando: "Guardando…",
  error: "No se pudo guardar",
};

/** Descarga un archivo del servidor sin salir de la página. */
function bajarArchivo(url: string) {
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "";
  enlace.click();
}

export function EditorDocumento({
  inicial,
  cliente,
  frecuentes,
}: {
  inicial: DocumentoEditable;
  cliente: { id: string; nombre: string };
  frecuentes: { texto: string; veces: number }[];
}) {
  const [doc, setDoc] = useState(inicial);
  const [guardado, setGuardado] = useState<Guardado>("guardado");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<"editar" | "vista">("editar");
  const [ocupado, setOcupado] = useState(false);

  const puedeCompartir = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function" && typeof navigator.canShare === "function",
    () => false,
  );

  // Autoguardado: cada cambio reprograma el guardado; los guardados nunca se pisan entre sí.
  const ultimo = useRef(doc);
  const sucio = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enCurso = useRef<Promise<void> | null>(null);

  async function guardarAhora() {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    while (enCurso.current) await enCurso.current;
    if (!sucio.current) return;
    sucio.current = false;
    const { numero, fecha, titulo, estado, contenido } = ultimo.current;
    setGuardado("guardando");
    const tarea = guardarDocumento(inicial.id, { numero, fecha, titulo, estado, contenido })
      .then((resultado) => {
        if (resultado.error) {
          sucio.current = true;
          setMensajeError(resultado.error);
          setGuardado("error");
        } else {
          setMensajeError(null);
          setGuardado(sucio.current ? "pendiente" : "guardado");
        }
      })
      .catch(() => {
        sucio.current = true;
        setMensajeError("Sin conexión. Se reintenta con el próximo cambio.");
        setGuardado("error");
      });
    enCurso.current = tarea;
    await tarea;
    enCurso.current = null;
  }

  function cambiar(parcial: Partial<DocumentoEditable>) {
    const siguiente = { ...ultimo.current, ...parcial };
    ultimo.current = siguiente;
    setDoc(siguiente);
    sucio.current = true;
    setGuardado("pendiente");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => void guardarAhora(), 800);
  }

  useEffect(() => {
    const avisar = (e: BeforeUnloadEvent) => {
      if (sucio.current || enCurso.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", avisar);
    return () => {
      window.removeEventListener("beforeunload", avisar);
      // Si se navega a otra pantalla con cambios pendientes, se guardan igual.
      if (sucio.current) void guardarAhora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/desmontar
  }, []);

  const nombreArchivo = nombreArchivoPdf(doc.tipo, doc.numero, cliente.nombre);
  const rutaPdf = `/api/documentos/${inicial.id}/pdf`;

  async function descargar() {
    await guardarAhora();
    bajarArchivo(`${rutaPdf}?descargar`);
  }

  async function compartir() {
    setOcupado(true);
    try {
      await guardarAhora();
      const respuesta = await fetch(rutaPdf);
      const archivo = new File([await respuesta.blob()], nombreArchivo, { type: "application/pdf" });
      if (navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: `${NOMBRE_TIPO[doc.tipo]} ${formatearNumero(doc.tipo, doc.numero)}` });
      } else {
        bajarArchivo(`${rutaPdf}?descargar`);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMensajeError("No se pudo compartir el PDF.");
    } finally {
      setOcupado(false);
    }
  }

  const datosPdf = {
    tipo: doc.tipo,
    numero: doc.numero,
    fecha: doc.fecha,
    titulo: doc.titulo,
    cliente: { nombre: cliente.nombre },
    contenido: doc.contenido,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/clientes/${cliente.id}`} className="text-sm text-apagado hover:text-tinta">
            ← {cliente.nombre}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {NOMBRE_TIPO[doc.tipo]} N.º {formatearNumero(doc.tipo, doc.numero)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm ${guardado === "error" ? "text-peligro" : "text-apagado"}`}
            role="status"
            aria-live="polite"
            title={mensajeError ?? undefined}
          >
            {TEXTO_GUARDADO[guardado]}
          </span>
          {puedeCompartir && (
            <button type="button" className="btn-secundario" onClick={compartir} disabled={ocupado}>
              <Share2 className="size-4" /> Compartir
            </button>
          )}
          <button type="button" className="btn-primario" onClick={descargar}>
            <Download className="size-4" /> Descargar PDF
          </button>
        </div>
      </div>
      {mensajeError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-peligro">
          {mensajeError}
        </p>
      )}

      <div className="flex rounded-lg bg-white p-1 ring-1 ring-borde lg:hidden" role="tablist">
        {(
          [
            ["editar", "Editar", Pencil],
            ["vista", "Vista previa", Eye],
          ] as const
        ).map(([valor, texto, Icono]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={pestana === valor}
            onClick={() => setPestana(valor)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${
              pestana === valor ? "bg-marca text-white" : "text-apagado"
            }`}
          >
            <Icono className="size-4" /> {texto}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`space-y-4 ${pestana === "editar" ? "" : "hidden lg:block"}`}>
          <section className="tarjeta grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <Campo rotulo="Número">
              {(id) => (
                <input
                  id={id}
                  className="campo"
                  inputMode="numeric"
                  value={doc.numero ?? ""}
                  onChange={(e) => {
                    const digitos = e.target.value.replace(/\D/g, "");
                    cambiar({ numero: digitos ? Number(digitos) : null });
                  }}
                />
              )}
            </Campo>
            <Campo rotulo="Fecha">
              {(id) => (
                <input
                  id={id}
                  type="date"
                  className="campo"
                  value={doc.fecha ?? ""}
                  onChange={(e) => cambiar({ fecha: e.target.value || null })}
                />
              )}
            </Campo>
            <Campo
              rotulo="Referencia (opcional)"
              className="sm:col-span-2"
              ayuda={
                doc.tipo === "presupuesto"
                  ? "Aparece debajo del cliente. Ej.: Service caldera principal"
                  : "Para reconocerlo en la lista de documentos."
              }
            >
              {(id) => (
                <input
                  id={id}
                  className="campo"
                  value={doc.titulo ?? ""}
                  onChange={(e) => cambiar({ titulo: e.target.value })}
                />
              )}
            </Campo>
            {doc.tipo === "presupuesto" && (
              <Campo rotulo="Estado" className="sm:col-span-2">
                {(id) => (
                  <select
                    id={id}
                    className="campo"
                    value={doc.estado ?? "borrador"}
                    onChange={(e) => cambiar({ estado: e.target.value as EstadoPresupuesto })}
                  >
                    {ESTADOS_PRESUPUESTO.map((e) => (
                      <option key={e} value={e}>
                        {NOMBRE_ESTADO[e]}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}
          </section>

          {doc.tipo === "presupuesto" && (
            <SeccionPresupuesto
              contenido={doc.contenido as ContenidoPresupuesto}
              onChange={(contenido) => cambiar({ contenido })}
              frecuentes={frecuentes}
            />
          )}
          {doc.tipo === "materiales" && (
            <SeccionMateriales
              contenido={doc.contenido as ContenidoMateriales}
              onChange={(contenido) => cambiar({ contenido })}
            />
          )}
          {doc.tipo === "informe" && (
            <SeccionInforme contenido={doc.contenido as ContenidoInforme} onChange={(contenido) => cambiar({ contenido })} />
          )}

          <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <form action={duplicarDocumento.bind(null, inicial.id, undefined)}>
              <button type="submit" className="btn-secundario" onClick={() => void guardarAhora()}>
                <Copy className="size-4" /> Duplicar
              </button>
            </form>
            <BotonConfirmar accion={() => eliminarDocumento(inicial.id)} pregunta="¿Eliminar este documento?">
              <Trash2 className="size-4" /> Eliminar
            </BotonConfirmar>
          </section>
        </div>

        <div className={pestana === "vista" ? "" : "hidden lg:block"}>
          <div className="tarjeta sticky top-20 h-[75dvh] overflow-hidden lg:h-[calc(100dvh-7rem)]">
            {/* Queda montada aunque esté oculta: al volver a la pestaña se ve al instante y se actualiza sola. */}
            <VistaPrevia datos={datosPdf} />
          </div>
        </div>
      </div>
    </div>
  );
}
