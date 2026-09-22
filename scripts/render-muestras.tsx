/**
 * Genera PDFs de muestra de las 3 plantillas con datos reales de Leo, para revisar el diseño.
 *   pnpm pdf:muestras [carpeta-salida]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { registrarFuentes } from "../lib/pdf/comun";
import { DocumentoPdf, type DatosDocumentoPdf } from "../lib/pdf/plantillas";

const salida = process.argv[2] ?? "muestras-pdf";
const recursos = path.join(process.cwd(), "public", "pdf");

const muestras: DatosDocumentoPdf[] = [
  {
    tipo: "presupuesto",
    numero: 86,
    fecha: "2026-06-09",
    titulo: null,
    cliente: { nombre: "Natu Sur" },
    contenido: {
      items: [
        "Se realizará una extensión de cañería de vapor para alimentar lava lata de carrilera y lavadora nueva, con su entrada individual a cada bacha.",
      ],
      totalEtiqueta: "COSTO TOTAL DEL TRABAJO",
      total: 1250000,
      observaciones: "",
      condicionesPago: ["50% al momento de aceptar el presupuesto.", "50% al finalizar el trabajo."],
    },
  },
  {
    tipo: "presupuesto",
    numero: 40,
    fecha: "2024-11-26",
    titulo: "Service caldera principal",
    cliente: { nombre: "Nutreco" },
    contenido: {
      items: [
        "Se realizará el desarme completo de la caldera, con la limpieza interna y externa de la misma.",
        "Se dejará toda desarmada para que se realice su inspección anual.",
        "Se cambiarán todas las juntas de la caldera.",
        "Se recorrerá la entrada de agua limpiando las válvulas de retención.",
        "Se limpiarán los controles de nivel.",
        "Se realizará la limpieza del quemador.",
        "Desmontaje y montaje de válvulas de seguridad, luego de ser calibradas.",
        "Una vez realizada su inspección anual, se hará el cierre de la misma para realizarse la prueba hidráulica.",
        "Una vez constatado que no haya ninguna pérdida, se cerrarán sus tapas de humo y se procederá a su puesta en marcha.",
      ],
      totalEtiqueta: "Costo del mantenimiento",
      total: 1950000,
      observaciones: "De haber algún repuesto por suplantar, éste correrá por cuenta de la empresa.",
      condicionesPago: [
        "50% por adelantado.",
        "50% restante con un plazo máximo de 20 días desde que se haya terminado el trabajo.",
      ],
    },
  },
  {
    tipo: "materiales",
    numero: 1,
    fecha: "2026-04-14",
    titulo: null,
    cliente: { nombre: "Lavadero San José" },
    contenido: {
      obra: "Armado de caldera",
      solicitadoPor: "",
      items: [
        { descripcion: "Manómetro de 0 a 14 kg de 4”", cantidad: "2", unidad: "u", observaciones: "" },
        { descripcion: "Presostato para vapor 14 kg", cantidad: "3", unidad: "u", observaciones: "1 trabajo, 1 seguridad, 1 modulante" },
        { descripcion: "Controlador de nivel de agua", cantidad: "2", unidad: "u", observaciones: "" },
        { descripcion: "Bomba inyectora de agua", cantidad: "2", unidad: "u", observaciones: "" },
        { descripcion: "Retención de agua", cantidad: "4", unidad: "u", observaciones: "2 por bomba" },
        { descripcion: "Válvula de 3 cuerpos para vapor (entrada de agua a caldera)", cantidad: "1", unidad: "u", observaciones: "Por bomba" },
        { descripcion: "Válvula de 2 cuerpos para entrada de agua", cantidad: "1", unidad: "u", observaciones: "Por bomba" },
        { descripcion: "Nivel visible de agua", cantidad: "2", unidad: "u", observaciones: "" },
        { descripcion: "Válvula de 3 cuerpos para salida de vapor", cantidad: "1", unidad: "u", observaciones: "" },
        { descripcion: "Válvula de 3 cuerpos de vapor para la purga", cantidad: "1", unidad: "u", observaciones: "" },
        { descripcion: "Bujía de seguridad", cantidad: "1", unidad: "u", observaciones: "" },
      ],
      observaciones: "Los materiales corren por cuenta de la empresa.",
    },
  },
  {
    tipo: "informe",
    numero: 15,
    fecha: "2025-09-22",
    titulo: null,
    cliente: { nombre: "Edificio San Marcos" },
    contenido: {
      equipo: "Caldera de agua caliente",
      ubicacion: "Av. Colon 1712, Mar del Plata, Buenos Aires",
      contacto: "Administración Rivas",
      motivo: "Nos llamaron para analizar y ver si había una solución sobre la caldera que tiene una pérdida de agua.",
      descripcion: "Es una caldera antigua de formato seccional de fundición, la cual tiene una pérdida de agua entre dos secciones.",
      observaciones:
        "Se observó que la caldera al ser tan antigua no tiene una forma de reparación, ya que la misma no puede desarmarse para reemplazar la sección porque no se consigue el repuesto de la misma, y al ser fundición no se puede reparar el lugar de pérdida.",
      trabajosRealizados: "",
      recomendaciones:
        "Se recomienda cambiar el equipo por uno nuevo, ya que el mismo tiene que construirse en el lugar porque no hay espacio físico por el cual bajar un equipo nuevo.",
    },
  },
];

async function main() {
  registrarFuentes(path.join(recursos, "fonts"));
  mkdirSync(salida, { recursive: true });
  for (const datos of muestras) {
    const archivo = path.join(salida, `${datos.tipo}-${datos.numero}.pdf`);
    const pdf = await renderToBuffer(<DocumentoPdf datos={datos} logo={path.join(recursos, "logo-leo-calderas.png")} />);
    writeFileSync(archivo, pdf);
    console.log(`${archivo}  (${(pdf.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
