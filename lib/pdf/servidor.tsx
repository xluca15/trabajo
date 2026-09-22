import "server-only";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { registrarFuentes } from "./comun";
import { DocumentoPdf, type DatosDocumentoPdf } from "./plantillas";

const RECURSOS = path.join(process.cwd(), "public", "pdf");

export async function generarPdf(datos: DatosDocumentoPdf): Promise<Buffer> {
  registrarFuentes(path.join(RECURSOS, "fonts"));
  return renderToBuffer(<DocumentoPdf datos={datos} logo={path.join(RECURSOS, "logo-leo-calderas.png")} />);
}
