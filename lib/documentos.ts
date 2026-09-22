import { z } from "zod";
import { sinAcentos } from "./formato";
import type { EstadoPresupuesto, TipoDocumento } from "./tipos";

// Contenido editable de cada tipo de documento (se guarda en documentos.contenido).

export const contenidoPresupuesto = z.object({
  items: z.array(z.string()),
  totalEtiqueta: z.string(),
  total: z.number().nullable(),
  observaciones: z.string(),
  condicionesPago: z.array(z.string()),
});

export const itemMaterial = z.object({
  descripcion: z.string(),
  cantidad: z.string(),
  unidad: z.string(),
  observaciones: z.string(),
});

export const contenidoMateriales = z.object({
  obra: z.string(),
  solicitadoPor: z.string(),
  items: z.array(itemMaterial),
  observaciones: z.string(),
});

export const contenidoInforme = z.object({
  equipo: z.string(),
  ubicacion: z.string(),
  contacto: z.string(),
  motivo: z.string(),
  descripcion: z.string(),
  observaciones: z.string(),
  trabajosRealizados: z.string(),
  recomendaciones: z.string(),
});

export type ContenidoPresupuesto = z.infer<typeof contenidoPresupuesto>;
export type ItemMaterial = z.infer<typeof itemMaterial>;
export type ContenidoMateriales = z.infer<typeof contenidoMateriales>;
export type ContenidoInforme = z.infer<typeof contenidoInforme>;

export type ContenidoPorTipo = {
  presupuesto: ContenidoPresupuesto;
  materiales: ContenidoMateriales;
  informe: ContenidoInforme;
};

export const esquemaContenido = {
  presupuesto: contenidoPresupuesto,
  materiales: contenidoMateriales,
  informe: contenidoInforme,
} satisfies { [T in TipoDocumento]: z.ZodType<ContenidoPorTipo[T]> };

export const ETIQUETA_TOTAL_POR_DEFECTO = "COSTO TOTAL DEL TRABAJO";
export const CONDICIONES_PAGO_POR_DEFECTO = [
  "50% al momento de aceptar el presupuesto.",
  "50% al finalizar el trabajo.",
];

export function itemMaterialVacio(): ItemMaterial {
  return { descripcion: "", cantidad: "", unidad: "", observaciones: "" };
}

export function contenidoInicial<T extends TipoDocumento>(
  tipo: T,
  cliente: { direccion?: string | null; localidad?: string | null; contacto?: string | null },
): ContenidoPorTipo[T] {
  const porTipo: ContenidoPorTipo = {
    presupuesto: {
      items: [""],
      totalEtiqueta: ETIQUETA_TOTAL_POR_DEFECTO,
      total: null,
      observaciones: "",
      condicionesPago: [...CONDICIONES_PAGO_POR_DEFECTO],
    },
    materiales: {
      obra: "",
      solicitadoPor: "",
      items: [itemMaterialVacio()],
      observaciones: "",
    },
    informe: {
      equipo: "",
      ubicacion: [cliente.direccion, cliente.localidad].filter(Boolean).join(", "),
      contacto: cliente.contacto ?? "",
      motivo: "",
      descripcion: "",
      observaciones: "",
      trabajosRealizados: "",
      recomendaciones: "",
    },
  };
  return porTipo[tipo];
}

/** Lee el contenido guardado tolerando documentos viejos o incompletos. */
export function leerContenido<T extends TipoDocumento>(tipo: T, valor: unknown): ContenidoPorTipo[T] {
  const base = contenidoInicial(tipo, {});
  const combinado = { ...base, ...(typeof valor === "object" && valor ? valor : {}) };
  const resultado = esquemaContenido[tipo].safeParse(combinado);
  return (resultado.success ? resultado.data : base) as ContenidoPorTipo[T];
}

export const NOMBRE_TIPO: Record<TipoDocumento, string> = {
  presupuesto: "Presupuesto",
  materiales: "Lista de materiales",
  informe: "Informe técnico",
};

export const NOMBRE_TIPO_PLURAL: Record<TipoDocumento, string> = {
  presupuesto: "Presupuestos",
  materiales: "Listas de materiales",
  informe: "Informes técnicos",
};

export const NOMBRE_ESTADO: Record<EstadoPresupuesto, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
};

/** Los presupuestos van sin ceros ("N.º 86"); informes y listas con tres cifras ("N.º 015"), como en las plantillas. */
export function formatearNumero(tipo: TipoDocumento, numero: number | null): string {
  if (numero == null) return "—";
  return tipo === "presupuesto" ? String(numero) : String(numero).padStart(3, "0");
}

/** Nombre de archivo para descargar: "presupuesto-86-natu-sur.pdf". */
export function nombreArchivoPdf(tipo: TipoDocumento, numero: number | null, cliente: string): string {
  const slug = sinAcentos(cliente)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return [tipo, numero ?? "sin-numero", slug].filter(Boolean).join("-") + ".pdf";
}
