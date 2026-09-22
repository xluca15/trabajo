"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import type { Cliente } from "@/lib/db/schema";

type Accion = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

const CAMPOS: { nombre: keyof Cliente; rotulo: string; tipo?: string; ancho?: "completo"; auto?: string }[] = [
  { nombre: "nombre", rotulo: "Nombre *", ancho: "completo" },
  { nombre: "razonSocial", rotulo: "Razón social" },
  { nombre: "cuit", rotulo: "CUIT" },
  { nombre: "contacto", rotulo: "Contacto / responsable" },
  { nombre: "telefono", rotulo: "Teléfono", tipo: "tel", auto: "tel" },
  { nombre: "email", rotulo: "Email", tipo: "email", auto: "email" },
  { nombre: "localidad", rotulo: "Localidad" },
  { nombre: "direccion", rotulo: "Dirección", ancho: "completo", auto: "street-address" },
];

export function FormCliente({
  accion,
  cliente,
  volverA,
}: {
  accion: Accion;
  cliente?: Cliente;
  volverA: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  return (
    <form action={enviar} className="tarjeta space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div key={campo.nombre} className={campo.ancho === "completo" ? "sm:col-span-2" : undefined}>
            <label htmlFor={campo.nombre} className="rotulo">
              {campo.rotulo}
            </label>
            <input
              id={campo.nombre}
              name={campo.nombre}
              type={campo.tipo ?? "text"}
              autoComplete={campo.auto ?? "off"}
              defaultValue={(cliente?.[campo.nombre] as string | null) ?? ""}
              required={campo.nombre === "nombre"}
              className="campo"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="notas" className="rotulo">
            Notas
          </label>
          <textarea
            id="notas"
            name="notas"
            rows={4}
            defaultValue={cliente?.notas ?? ""}
            placeholder="Equipos que tiene (marca, modelo), horarios, cómo se paga…"
            className="campo"
          />
        </div>
      </div>
      {estado?.error && (
        <p role="alert" className="text-sm text-peligro">
          {estado.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Link href={volverA} className="btn-secundario">
          Cancelar
        </Link>
        <button type="submit" disabled={enviando} className="btn-primario">
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
