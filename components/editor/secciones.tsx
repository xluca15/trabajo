"use client";

import { Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  itemMaterialVacio,
  type ContenidoInforme,
  type ContenidoMateriales,
  type ContenidoPresupuesto,
  type ItemMaterial,
} from "@/lib/documentos";
import { sinAcentos } from "@/lib/formato";
import { AreaTexto, Campo, ControlesFila, InputMonto, mover } from "./campos";

function Bloque({ titulo, children, accion }: { titulo: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <section className="tarjeta p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Presupuesto
// ---------------------------------------------------------------------------

export function SeccionPresupuesto({
  contenido,
  onChange,
  frecuentes,
}: {
  contenido: ContenidoPresupuesto;
  onChange: (c: ContenidoPresupuesto) => void;
  frecuentes: { texto: string; veces: number }[];
}) {
  const cambiar = (parcial: Partial<ContenidoPresupuesto>) => onChange({ ...contenido, ...parcial });
  const items = contenido.items;

  function agregarItem(texto = "") {
    // Si el último ítem está vacío, se usa ese en vez de agregar otro.
    if (texto && items.length && !items[items.length - 1].trim()) {
      cambiar({ items: [...items.slice(0, -1), texto] });
    } else {
      cambiar({ items: [...items, texto] });
    }
  }

  return (
    <>
      <Bloque titulo="Detalle del trabajo">
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-marca tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <AreaTexto
                aria-label={`Ítem ${i + 1}`}
                value={item}
                placeholder="Describí el trabajo a realizar…"
                onChange={(e) => cambiar({ items: items.map((it, j) => (j === i ? e.target.value : it)) })}
              />
              <ControlesFila
                indice={i}
                total={items.length}
                etiqueta={`ítem ${i + 1}`}
                onMover={(desde, hasta) => cambiar({ items: mover(items, desde, hasta) })}
                onBorrar={(j) => cambiar({ items: items.filter((_, k) => k !== j) })}
              />
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-secundario" onClick={() => agregarItem()}>
            <Plus className="size-4" /> Agregar ítem
          </button>
        </div>
        {frecuentes.length > 0 && (
          <TextosFrecuentes frecuentes={frecuentes} usados={items} onElegir={(t) => agregarItem(t)} />
        )}
      </Bloque>

      <Bloque titulo="Total">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <Campo rotulo="Texto" ayuda="Ej.: Costo del mantenimiento, Costo del servis de cada caldera">
            {(id) => (
              <input
                id={id}
                className="campo"
                value={contenido.totalEtiqueta}
                onChange={(e) => cambiar({ totalEtiqueta: e.target.value })}
              />
            )}
          </Campo>
          <Campo rotulo="Importe">
            {(id) => <InputMonto id={id} valor={contenido.total} onChange={(total) => cambiar({ total })} />}
          </Campo>
        </div>
      </Bloque>

      <Bloque titulo="Observaciones">
        <AreaTexto
          aria-label="Observaciones"
          value={contenido.observaciones}
          placeholder="Ej.: De haber algún repuesto por suplantar, éste correrá por cuenta de la empresa."
          onChange={(e) => cambiar({ observaciones: e.target.value })}
        />
        {!contenido.observaciones && (
          <button
            type="button"
            className="mt-2 text-sm text-marca hover:underline"
            onClick={() =>
              cambiar({ observaciones: "De haber algún repuesto por suplantar, éste correrá por cuenta de la empresa." })
            }
          >
            + “De haber algún repuesto por suplantar…”
          </button>
        )}
      </Bloque>

      <Bloque titulo="Condiciones de pago">
        <ul className="space-y-2">
          {contenido.condicionesPago.map((condicion, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-apagado">•</span>
              <input
                aria-label={`Condición ${i + 1}`}
                className="campo"
                value={condicion}
                onChange={(e) =>
                  cambiar({ condicionesPago: contenido.condicionesPago.map((c, j) => (j === i ? e.target.value : c)) })
                }
              />
              <button
                type="button"
                className="btn-fantasma px-3 sm:px-2"
                onClick={() => cambiar({ condicionesPago: contenido.condicionesPago.filter((_, j) => j !== i) })}
                title="Quitar"
              >
                ✕<span className="sr-only">Quitar condición {i + 1}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-secundario mt-3"
          onClick={() => cambiar({ condicionesPago: [...contenido.condicionesPago, ""] })}
        >
          <Plus className="size-4" /> Agregar condición
        </button>
      </Bloque>
    </>
  );
}

function TextosFrecuentes({
  frecuentes,
  usados,
  onElegir,
}: {
  frecuentes: { texto: string; veces: number }[];
  usados: string[];
  onElegir: (texto: string) => void;
}) {
  const [filtro, setFiltro] = useState("");
  const visibles = useMemo(() => {
    const f = sinAcentos(filtro);
    return frecuentes.filter(({ texto }) => sinAcentos(texto).includes(f));
  }, [filtro, frecuentes]);

  return (
    <details className="group mt-4 rounded-lg border border-borde">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-marca select-none">
        Textos frecuentes <span className="text-apagado">({frecuentes.length})</span>
      </summary>
      <div className="border-t border-borde p-3">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-apagado" />
          <input
            type="search"
            className="campo py-1.5 pl-8 sm:text-sm"
            placeholder="Filtrar…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar textos frecuentes"
          />
        </div>
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {visibles.map(({ texto, veces }) => {
            const usado = usados.includes(texto);
            return (
              <li key={texto}>
                <button
                  type="button"
                  onClick={() => onElegir(texto)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-marca-suave"
                >
                  {usado ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Plus className="mt-0.5 size-4 shrink-0 text-marca" />
                  )}
                  <span className="flex-1">{texto}</span>
                  <span className="shrink-0 text-xs text-apagado" title="Veces usado">
                    ×{veces}
                  </span>
                </button>
              </li>
            );
          })}
          {visibles.length === 0 && <li className="px-2 py-1.5 text-sm text-apagado">Nada coincide.</li>}
        </ul>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Lista de materiales
// ---------------------------------------------------------------------------

export function SeccionMateriales({
  contenido,
  onChange,
}: {
  contenido: ContenidoMateriales;
  onChange: (c: ContenidoMateriales) => void;
}) {
  const cambiar = (parcial: Partial<ContenidoMateriales>) => onChange({ ...contenido, ...parcial });
  const items = contenido.items;
  const cambiarItem = (i: number, parcial: Partial<ItemMaterial>) =>
    cambiar({ items: items.map((it, j) => (j === i ? { ...it, ...parcial } : it)) });

  return (
    <>
      <Bloque titulo="Datos">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Obra / trabajo">
            {(id) => (
              <input id={id} className="campo" value={contenido.obra} onChange={(e) => cambiar({ obra: e.target.value })} />
            )}
          </Campo>
          <Campo rotulo="Solicitado por">
            {(id) => (
              <input
                id={id}
                className="campo"
                value={contenido.solicitadoPor}
                onChange={(e) => cambiar({ solicitadoPor: e.target.value })}
              />
            )}
          </Campo>
        </div>
      </Bloque>

      <Bloque titulo="Detalle de materiales">
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border border-borde p-2.5 sm:border-0 sm:p-0">
              <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-marca tabular-nums">{i + 1}</span>
              <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,2fr)_64px_96px_minmax(0,1fr)]">
                <AreaTexto
                  aria-label={`Material ${i + 1}`}
                  placeholder="Descripción del material"
                  className="min-h-10"
                  rows={1}
                  value={item.descripcion}
                  onChange={(e) => cambiarItem(i, { descripcion: e.target.value })}
                />
                <input
                  aria-label={`Cantidad ${i + 1}`}
                  placeholder="Cant."
                  className="campo"
                  value={item.cantidad}
                  onChange={(e) => cambiarItem(i, { cantidad: e.target.value })}
                />
                <input
                  aria-label={`Unidad ${i + 1}`}
                  placeholder="Unidad"
                  className="campo"
                  list="unidades"
                  value={item.unidad}
                  onChange={(e) => cambiarItem(i, { unidad: e.target.value })}
                />
                <input
                  aria-label={`Observaciones ${i + 1}`}
                  placeholder="Observaciones"
                  className="campo"
                  value={item.observaciones}
                  onChange={(e) => cambiarItem(i, { observaciones: e.target.value })}
                />
              </div>
              <ControlesFila
                indice={i}
                total={items.length}
                etiqueta={`material ${i + 1}`}
                onMover={(desde, hasta) => cambiar({ items: mover(items, desde, hasta) })}
                onBorrar={(j) => cambiar({ items: items.filter((_, k) => k !== j) })}
              />
            </li>
          ))}
        </ol>
        <datalist id="unidades">
          {["u", "m", "kg", "l", "juego", "par", "caja", "rollo"].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <button
          type="button"
          className="btn-secundario mt-3"
          onClick={() => cambiar({ items: [...items, itemMaterialVacio()] })}
        >
          <Plus className="size-4" /> Agregar material
        </button>
      </Bloque>

      <Bloque titulo="Observaciones generales">
        <AreaTexto
          aria-label="Observaciones generales"
          placeholder="Aclaraciones, proveedor sugerido, plazos de entrega…"
          value={contenido.observaciones}
          onChange={(e) => cambiar({ observaciones: e.target.value })}
        />
      </Bloque>
    </>
  );
}

// ---------------------------------------------------------------------------
// Informe técnico
// ---------------------------------------------------------------------------

const CAMPOS_INFORME: { campo: keyof ContenidoInforme; rotulo: string; ayuda: string }[] = [
  { campo: "motivo", rotulo: "Motivo / objeto del informe", ayuda: "Motivo de la inspección, servicio o informe." },
  {
    campo: "descripcion",
    rotulo: "Descripción / estado actual",
    ayuda: "Estado de la instalación, equipo o trabajo observado.",
  },
  {
    campo: "observaciones",
    rotulo: "Observaciones",
    ayuda: "Anomalías, mediciones, condiciones encontradas, riesgos.",
  },
  { campo: "trabajosRealizados", rotulo: "Trabajos realizados", ayuda: "Tareas efectuadas durante la visita." },
  {
    campo: "recomendaciones",
    rotulo: "Recomendaciones / conclusiones",
    ayuda: "Recomendaciones técnicas, tareas pendientes, conclusión.",
  },
];

export function SeccionInforme({
  contenido,
  onChange,
}: {
  contenido: ContenidoInforme;
  onChange: (c: ContenidoInforme) => void;
}) {
  const cambiar = (parcial: Partial<ContenidoInforme>) => onChange({ ...contenido, ...parcial });
  return (
    <>
      <Bloque titulo="Datos">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Equipo / instalación">
            {(id) => (
              <input id={id} className="campo" value={contenido.equipo} onChange={(e) => cambiar({ equipo: e.target.value })} />
            )}
          </Campo>
          <Campo rotulo="Responsable / contacto">
            {(id) => (
              <input
                id={id}
                className="campo"
                value={contenido.contacto}
                onChange={(e) => cambiar({ contacto: e.target.value })}
              />
            )}
          </Campo>
          <Campo rotulo="Ubicación" className="sm:col-span-2">
            {(id) => (
              <input
                id={id}
                className="campo"
                value={contenido.ubicacion}
                onChange={(e) => cambiar({ ubicacion: e.target.value })}
              />
            )}
          </Campo>
        </div>
      </Bloque>
      <Bloque titulo="Informe">
        <div className="space-y-4">
          {CAMPOS_INFORME.map(({ campo, rotulo, ayuda }) => (
            <Campo key={campo} rotulo={rotulo}>
              {(id) => (
                <AreaTexto
                  id={id}
                  placeholder={ayuda}
                  className="min-h-20"
                  value={contenido[campo]}
                  onChange={(e) => cambiar({ [campo]: e.target.value })}
                />
              )}
            </Campo>
          ))}
        </div>
        <p className="mt-3 text-xs text-apagado">Las secciones que quedan vacías no salen en el PDF.</p>
      </Bloque>
    </>
  );
}
