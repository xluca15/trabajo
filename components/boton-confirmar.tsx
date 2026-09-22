"use client";

import { useState, useTransition, type ReactNode } from "react";

/** Botón de dos pasos para acciones destructivas (sin ventanas emergentes del navegador). */
export function BotonConfirmar({
  accion,
  children,
  pregunta = "¿Seguro?",
  confirmar = "Sí, eliminar",
  className = "btn-peligro",
}: {
  accion: () => Promise<unknown>;
  children: ReactNode;
  pregunta?: string;
  confirmar?: string;
  className?: string;
}) {
  const [preguntando, setPreguntando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (!preguntando) {
    return (
      <button type="button" className={className} onClick={() => setPreguntando(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-peligro">{pregunta}</span>
      <button
        type="button"
        className="btn bg-peligro text-white hover:bg-red-800"
        disabled={pendiente}
        onClick={() => iniciar(async () => void (await accion()))}
      >
        {pendiente ? "Eliminando…" : confirmar}
      </button>
      <button type="button" className="btn-secundario" disabled={pendiente} onClick={() => setPreguntando(false)}>
        Cancelar
      </button>
    </span>
  );
}
