import type { EstadoPresupuesto, TipoDocumento } from "@/lib/tipos";
import { NOMBRE_ESTADO } from "@/lib/documentos";

const ESTILO_TIPO: Record<TipoDocumento, string> = {
  presupuesto: "bg-marca-suave text-marca-oscuro",
  materiales: "bg-amber-50 text-amber-800",
  informe: "bg-emerald-50 text-emerald-800",
};

const CORTO_TIPO: Record<TipoDocumento, string> = {
  presupuesto: "Presupuesto",
  materiales: "Materiales",
  informe: "Informe",
};

export function InsigniaTipo({ tipo }: { tipo: TipoDocumento }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${ESTILO_TIPO[tipo]}`}>
      {CORTO_TIPO[tipo]}
    </span>
  );
}

const ESTILO_ESTADO: Record<EstadoPresupuesto, string> = {
  borrador: "bg-slate-100 text-slate-700",
  enviado: "bg-sky-50 text-sky-800",
  aceptado: "bg-emerald-50 text-emerald-800",
  rechazado: "bg-red-50 text-red-800",
};

export function InsigniaEstado({ estado, importado }: { estado: EstadoPresupuesto | null; importado?: boolean }) {
  if (!estado) {
    return importado ? (
      <span className="inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-xs text-apagado ring-1 ring-borde ring-inset">
        Importado
      </span>
    ) : null;
  }
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${ESTILO_ESTADO[estado]}`}>
      {NOMBRE_ESTADO[estado]}
    </span>
  );
}
