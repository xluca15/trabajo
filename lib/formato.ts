const numero = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "$ 1.250.000" (como en los presupuestos de Leo). */
export function formatearPesos(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return "$ —";
  return `$ ${numero.format(valor)}`;
}

/** "2026-06-09" → "09/06/2026". */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Fecha de hoy en Argentina como "YYYY-MM-DD". */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

/** "Válvula" → "valvula" (para buscar sin importar tildes ni mayúsculas). */
export function sinAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
