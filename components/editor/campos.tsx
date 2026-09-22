"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";

export function Campo({
  rotulo,
  children,
  className,
  ayuda,
}: {
  rotulo: string;
  children: (id: string) => ReactNode;
  className?: string;
  ayuda?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      {children(id)}
      {ayuda && <p className="mt-1 text-xs text-apagado">{ayuda}</p>}
    </div>
  );
}

/** Textarea que crece con el contenido (con CSS donde se puede; en Safari, ajustando el alto a mano). */
export function AreaTexto({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const area = ref.current;
    if (!area || CSS.supports("field-sizing", "content")) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={2} {...props} className={`campo field-sizing-content min-h-16 resize-y ${className}`} />;
}

const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

/** Importe en pesos: muestra "1.250.000" y guarda 1250000. Acepta coma decimal. */
export function InputMonto({
  id,
  valor,
  onChange,
}: {
  id: string;
  valor: number | null;
  onChange: (valor: number | null) => void;
}) {
  const [texto, setTexto] = useState(valor == null ? "" : numero.format(valor));
  const [enfocado, setEnfocado] = useState(false);

  function interpretar(entrada: string) {
    const limpio = entrada.replace(/[^\d,]/g, "");
    const [entero, decimales] = limpio.split(",");
    if (!entero && !decimales) return null;
    const n = Number(`${entero || "0"}.${(decimales ?? "").slice(0, 2) || "0"}`);
    return Number.isFinite(n) ? n : null;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-apagado">$</span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        className="campo pl-7 text-right font-semibold tabular-nums"
        value={enfocado ? texto : valor == null ? "" : numero.format(valor)}
        placeholder="0"
        onFocus={() => {
          setTexto(valor == null ? "" : numero.format(valor));
          setEnfocado(true);
        }}
        onBlur={() => setEnfocado(false)}
        onChange={(e) => {
          const limpio = e.target.value.replace(/[^\d.,]/g, "");
          const valorNuevo = interpretar(limpio);
          // Mientras escribe se muestran los puntos de miles, sin tocar lo que está después de la coma.
          const [entero, ...resto] = limpio.replace(/\./g, "").split(",");
          const conPuntos = entero ? numero.format(Number(entero)) : "";
          setTexto(resto.length ? `${conPuntos},${resto.join("").slice(0, 2)}` : conPuntos);
          onChange(valorNuevo);
        }}
      />
    </div>
  );
}

/** Botones de mover/borrar para las filas de una lista editable. */
export function ControlesFila({
  indice,
  total,
  onMover,
  onBorrar,
  etiqueta,
}: {
  indice: number;
  total: number;
  onMover: (desde: number, hasta: number) => void;
  onBorrar: (indice: number) => void;
  etiqueta: string;
}) {
  return (
    <div className="-mr-1 flex shrink-0 flex-col sm:mr-0 sm:gap-0.5">
      <button
        type="button"
        className="rounded-md p-2 text-apagado hover:bg-fondo hover:text-tinta disabled:opacity-30 sm:p-1"
        disabled={indice === 0}
        onClick={() => onMover(indice, indice - 1)}
        title="Subir"
      >
        <ArrowUp className="size-5 sm:size-3.5" />
        <span className="sr-only">Subir {etiqueta}</span>
      </button>
      <button
        type="button"
        className="rounded-md p-2 text-apagado hover:bg-fondo hover:text-tinta disabled:opacity-30 sm:p-1"
        disabled={indice === total - 1}
        onClick={() => onMover(indice, indice + 1)}
        title="Bajar"
      >
        <ArrowDown className="size-5 sm:size-3.5" />
        <span className="sr-only">Bajar {etiqueta}</span>
      </button>
      <button
        type="button"
        className="rounded-md p-2 text-apagado hover:bg-red-50 hover:text-peligro sm:p-1"
        onClick={() => onBorrar(indice)}
        title="Quitar"
      >
        <X className="size-5 sm:size-3.5" />
        <span className="sr-only">Quitar {etiqueta}</span>
      </button>
    </div>
  );
}

export function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  if (hasta < 0 || hasta >= lista.length) return lista;
  const copia = [...lista];
  const [elemento] = copia.splice(desde, 1);
  copia.splice(hasta, 0, elemento);
  return copia;
}
