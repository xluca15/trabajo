// Constantes compartidas entre servidor y navegador (sin dependencias de la base).
export const TIPOS_DOCUMENTO = ["presupuesto", "materiales", "informe"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ESTADOS_PRESUPUESTO = ["borrador", "enviado", "aceptado", "rechazado"] as const;
export type EstadoPresupuesto = (typeof ESTADOS_PRESUPUESTO)[number];
