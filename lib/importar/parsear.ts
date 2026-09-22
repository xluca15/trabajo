import type { TipoDocumento } from "../tipos";
import {
  CONDICIONES_PAGO_POR_DEFECTO,
  ETIQUETA_TOTAL_POR_DEFECTO,
  type ContenidoInforme,
  type ContenidoMateriales,
  type ContenidoPresupuesto,
  type ItemMaterial,
} from "../documentos";

// Lee el texto (pdftotext -layout) de los PDFs que Leo armaba en Word y rescata lo que se pueda.
// Es "mejor esfuerzo": el PDF original siempre queda guardado tal cual y es el que vale.

export type DocumentoParseado = {
  numero: number | null;
  fecha: string | null;
  titulo: string | null;
  total: number | null;
  contenido: ContenidoPresupuesto | ContenidoMateriales | ContenidoInforme;
};

const VIÑETA = /^\s*[*•]\s*/;
const MONTO = /\$\s*(\d[\d.,\s]*\d|\d)/;

function lineasDe(texto: string) {
  return texto.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
}

function normalizar(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function primeraMayuscula(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** "$1.250.000" · "$ 2,160.000" · "$152      .000" · "$30.894,59" → número. */
export function parsearMonto(s: string): number | null {
  const limpio = s.replace(/\s+/g, "");
  const conDecimales = limpio.match(/^(.*),(\d{2})$/);
  const entero = (conDecimales ? conDecimales[1] : limpio).replace(/[.,]/g, "");
  const n = Number(conDecimales ? `${entero}.${conDecimales[2]}` : entero);
  return Number.isFinite(n) && entero ? n : null;
}

export function parsearNumero(texto: string, nombreArchivo: string): number | null {
  const enTexto = texto.match(/\bn\s*\.?\s*[º°o]\s*\.?\s*:?\s*(\d{1,4})\b/i);
  if (enTexto) return Number(enTexto[1]);
  const base = nombreArchivo.replace(/\.(pdf|docx?)$/gi, "");
  const enNombre =
    base.match(/presupuesto[\s_-]*(\d{1,4})(?!\d)/i) ?? base.match(/[\s_-]n?(\d{1,4})$/i) ?? base.match(/(\d{1,4})/);
  return enNombre ? Number(enNombre[1]) : null;
}

export function parsearFecha(texto: string): string | null {
  // Con rótulo "Fecha:" en cualquier lado, o una fecha suelta en el encabezado (primeros renglones).
  const m =
    texto.match(/Fecha\s*:?\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/i) ??
    lineasDe(texto)
      .slice(0, 6)
      .join("\n")
      .match(/(?:^|\s)(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const dia = Number(d);
  const nMes = Number(mes);
  if (dia < 1 || dia > 31 || nMes < 1 || nMes > 12) return null;
  const anio = a.length === 2 ? `20${a}` : a;
  return `${anio}-${String(nMes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Separa el encabezado centrado (rótulo + nombre/asunto) del cuerpo.
 * El rótulo es un renglón solo como "PRESUPUESTO", "PRESUPUETO", "Lista de materiales", "MATERIALES".
 */
function separarEncabezado(lineas: string[], rotulo: RegExp) {
  const inicio = lineas.findIndex((l) => rotulo.test(l.trim()));
  if (inicio === -1) return { titulo: null, cuerpo: lineas };
  const partes: string[] = [];
  let i = inicio + 1;
  for (; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea.trim()) continue;
    // Los renglones del título están centrados (mucha sangría); el cuerpo arranca pegado al margen.
    if (VIÑETA.test(linea) || !/^\s{8,}/.test(linea) || MONTO.test(linea) || partes.length === 3) break;
    partes.push(normalizar(linea));
  }
  return { titulo: partes.length ? partes.join(" — ") : null, cuerpo: lineas.slice(i) };
}

/** Agrupa viñetas "*..." con sus renglones de continuación. */
function agruparViñetas(lineas: string[], separador: string): string[] {
  const items: string[] = [];
  let actual: string | null = null;
  for (const linea of lineas) {
    if (VIÑETA.test(linea)) {
      if (actual !== null) items.push(actual);
      actual = linea.replace(VIÑETA, "").trim();
    } else if (MONTO.test(linea) && linea.trim()) {
      // Un renglón suelto con precio ("Costo por tanque: $750.000") va como ítem aparte.
      if (actual !== null) items.push(actual);
      items.push(linea.trim());
      actual = null;
    } else if (actual !== null && linea.trim()) {
      actual += separador + linea.trim();
    }
  }
  if (actual !== null) items.push(actual);
  return items.map((i) => primeraMayuscula(separador === " " ? normalizar(i) : i.trim())).filter(Boolean);
}

const PALABRAS_TOTAL = /(costo|corto|valor|precio|total)/i;

export function parsearPresupuesto(texto: string, nombreArchivo: string): DocumentoParseado {
  const lineas = lineasDe(texto);
  const { titulo, cuerpo } = separarEncabezado(lineas, /^PRESUP[A-Z]*$/);
  const finCuerpo = cuerpo.findIndex((l) => /^\s*saluda/i.test(l));
  const util = finCuerpo === -1 ? cuerpo : cuerpo.slice(0, finCuerpo);

  // Total: renglones con "$" fuera de viñetas (preferentemente con "Costo", "Valor"...). Si uno solo dice
  // "Total", ese; si no, el primero (los demás suelen ser opciones o adicionales y quedan como texto).
  const conMonto = util.map((l, i) => ({ l, i })).filter(({ l }) => MONTO.test(l) && !VIÑETA.test(l));
  const candidatos = conMonto.some(({ l }) => PALABRAS_TOTAL.test(l))
    ? conMonto.filter(({ l }) => PALABRAS_TOTAL.test(l))
    : conMonto;
  const conPalabraTotal = candidatos.filter(({ l }) => /total/i.test(l));
  const renglonTotal = conPalabraTotal.length === 1 ? conPalabraTotal[0] : candidatos[0];

  let total: number | null = null;
  let etiqueta = ETIQUETA_TOTAL_POR_DEFECTO;
  if (renglonTotal) {
    const [antes, despues] = renglonTotal.l.split("$");
    total = parsearMonto(despues.replace(/[.\-\s]+$/, "").match(/[\d.,\s]+/)?.[0] ?? "");
    const limpia = normalizar(antes.replace(/[.…:\s]+$/, ""));
    if (limpia) etiqueta = limpia;
  }

  const antesDelTotal = renglonTotal ? util.slice(0, renglonTotal.i) : util;
  const despuesDelTotal = renglonTotal ? util.slice(renglonTotal.i + 1) : [];

  let items = agruparViñetas(antesDelTotal, " ");
  if (!items.length) {
    const parrafo = normalizar(antesDelTotal.join(" "));
    items = parrafo ? [primeraMayuscula(parrafo)] : renglonTotal && !PALABRAS_TOTAL.test(etiqueta) ? [etiqueta] : [];
  }

  // Después del total: notas ("De haber algún repuesto…", "No incluye IVA") y condiciones ("De aceptarse…", "Forma de pago").
  const observaciones: string[] = [];
  const condiciones: string[] = [];
  let ultimo: string[] | null = null;
  for (const linea of despuesDelTotal) {
    const t = linea.trim();
    if (!t) {
      ultimo = null;
      continue;
    }
    const esCondicion = /^(de acepta|forma de pago)/i.test(t);
    const esNota = /^(de haber|\(|no incluye|el precio|los materiales)/i.test(t);
    if (esCondicion) (ultimo = condiciones).push(t);
    else if (esNota || !ultimo) (ultimo = observaciones).push(t);
    else ultimo[ultimo.length - 1] += " " + t;
  }

  return {
    numero: parsearNumero(texto, nombreArchivo),
    fecha: parsearFecha(texto),
    titulo,
    total,
    contenido: {
      items,
      totalEtiqueta: etiqueta,
      total,
      observaciones: observaciones.map(normalizar).join("\n"),
      condicionesPago: condiciones.length ? condiciones.map(normalizar) : [...CONDICIONES_PAGO_POR_DEFECTO],
    },
  };
}

/** "5 - codos de 1’ para soldar" · "Manómetro de 4” x 2 unidades" → cantidad y descripción. */
function itemDeRenglon(texto: string): ItemMaterial {
  const item: ItemMaterial = { descripcion: texto.trim(), cantidad: "", unidad: "", observaciones: "" };
  const adelante = item.descripcion.match(/^(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*|\s+(?=[a-záéíóúñ]))(.+)$/is);
  if (adelante) {
    item.cantidad = adelante[1];
    item.descripcion = adelante[2].trim();
  } else {
    const atras = item.descripcion.match(/^(.+?)\s+x\s*(\d+)\s*(unidades|unidad|u\.?)?$/i);
    if (atras) {
      item.descripcion = atras[1].trim();
      item.cantidad = atras[2];
      if (atras[3]) item.unidad = "u";
    }
  }
  item.descripcion = primeraMayuscula(item.descripcion);
  return item;
}

export function parsearMateriales(texto: string): DocumentoParseado {
  const lineas = lineasDe(texto);
  const { titulo, cuerpo } = separarEncabezado(lineas, /^(lista de materiales|materiales a utilizar|materiales)$/i);
  const fin = cuerpo.findIndex((l) => /^\s*saluda/i.test(l));
  const util = fin === -1 ? cuerpo : cuerpo.slice(0, fin);

  const conViñetas = util.some((l) => VIÑETA.test(l));
  // Con viñetas, los renglones de abajo (medidas alineadas) quedan dentro del mismo ítem.
  const renglones = conViñetas ? agruparViñetas(util, "\n") : util.map((l) => l.trim()).filter(Boolean);

  return {
    numero: null,
    fecha: parsearFecha(texto),
    titulo,
    total: null,
    contenido: { obra: "", solicitadoPor: "", items: renglones.map(itemDeRenglon), observaciones: "" },
  };
}

const SECCIONES_INFORME: [keyof ContenidoInforme, RegExp][] = [
  ["motivo", /^MOTIVO/],
  ["descripcion", /^DESCRIPCI[ÓO]N/],
  ["observaciones", /^OBSERVACIONES/],
  ["trabajosRealizados", /^TRABAJOS REALIZADOS/],
  ["recomendaciones", /^RECOMENDACIONES/],
];

/** Informes hechos con la plantilla nueva (grilla de datos + secciones con título). */
export function parsearInforme(texto: string, nombreArchivo: string): DocumentoParseado {
  const lineas = lineasDe(texto);
  const contenido: ContenidoInforme = {
    equipo: "",
    ubicacion: "",
    contacto: "",
    motivo: "",
    descripcion: "",
    observaciones: "",
    trabajosRealizados: "",
    recomendaciones: "",
  };
  // El renglón siguiente a "CLIENTE   EQUIPO / INSTALACIÓN" trae los dos valores separados por espacios.
  const valoresDe = (rotulo: RegExp) => {
    const i = lineas.findIndex((l) => rotulo.test(l));
    if (i === -1) return [];
    return (lineas.slice(i + 1).find((l) => l.trim()) ?? "").trim().split(/\s{3,}/);
  };
  const [, equipo] = valoresDe(/CLIENTE\s+EQUIPO/);
  const [ubicacion, contacto] = valoresDe(/UBICACI[ÓO]N\s+RESPONSABLE/);
  contenido.equipo = equipo ?? "";
  contenido.ubicacion = ubicacion ?? "";
  contenido.contacto = contacto ?? "";

  let actual: keyof ContenidoInforme | null = null;
  for (const linea of lineas) {
    const t = linea.trim();
    if (/^Elabor[óo]/i.test(t)) break;
    const seccion = SECCIONES_INFORME.find(([, re]) => re.test(t));
    if (seccion) actual = seccion[0];
    else if (actual && t) contenido[actual] = normalizar(`${contenido[actual]} ${t}`);
  }
  return {
    numero: parsearNumero(texto, nombreArchivo),
    fecha: parsearFecha(texto),
    titulo: contenido.equipo || null,
    total: null,
    contenido,
  };
}

export function parsearDocumento(tipo: TipoDocumento, texto: string, nombreArchivo: string): DocumentoParseado {
  if (tipo === "presupuesto") return parsearPresupuesto(texto, nombreArchivo);
  if (tipo === "materiales") return parsearMateriales(texto);
  return parsearInforme(texto, nombreArchivo);
}
