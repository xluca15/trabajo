import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { TipoDocumento } from "../tipos";
import {
  formatearNumero,
  leerContenido,
  NOMBRE_TIPO,
  type ContenidoInforme,
  type ContenidoMateriales,
  type ContenidoPresupuesto,
} from "../documentos";
import { EMPRESA } from "../empresa";
import { formatearFecha, formatearPesos } from "../formato";
import {
  COLOR,
  Encabezado,
  estilos,
  FilaEmpresa,
  FirmaElaboro,
  GrillaDatos,
  Parrafos,
  Pie,
  TituloSeccion,
} from "./comun";

export type DatosDocumentoPdf = {
  tipo: TipoDocumento;
  numero: number | null;
  fecha: string | null;
  titulo: string | null;
  cliente: { nombre: string };
  contenido: unknown;
};

const TITULO_ENCABEZADO: Record<TipoDocumento, string> = {
  presupuesto: "PRESUPUESTO",
  materiales: "LISTA DE MATERIALES",
  informe: "INFORME TÉCNICO",
};

const TEXTO_PIE: Record<TipoDocumento, string> = {
  presupuesto: "Presupuestos y servicios técnicos",
  materiales: "Listas de materiales",
  informe: "Informes y servicios técnicos",
};

export function DocumentoPdf({ datos, logo }: { datos: DatosDocumentoPdf; logo: string }) {
  const titulo = `${NOMBRE_TIPO[datos.tipo]} ${formatearNumero(datos.tipo, datos.numero)} - ${datos.cliente.nombre}`;
  return (
    <Document title={titulo} author={EMPRESA.titular} creator="CRM Leo Calderas" producer="CRM Leo Calderas">
      <Page size="A4" style={estilos.pagina}>
        <Encabezado
          titulo={TITULO_ENCABEZADO[datos.tipo]}
          numero={formatearNumero(datos.tipo, datos.numero)}
          fecha={formatearFecha(datos.fecha)}
          logo={logo}
        />
        <FilaEmpresa />
        {datos.tipo === "presupuesto" && (
          <CuerpoPresupuesto datos={datos} contenido={leerContenido("presupuesto", datos.contenido)} />
        )}
        {datos.tipo === "materiales" && (
          <CuerpoMateriales datos={datos} contenido={leerContenido("materiales", datos.contenido)} />
        )}
        {datos.tipo === "informe" && (
          <CuerpoInforme datos={datos} contenido={leerContenido("informe", datos.contenido)} />
        )}
        <Pie texto={TEXTO_PIE[datos.tipo]} />
      </Page>
    </Document>
  );
}

function CuerpoPresupuesto({ datos, contenido }: { datos: DatosDocumentoPdf; contenido: ContenidoPresupuesto }) {
  const items = contenido.items.filter((item) => item.trim());
  const condiciones = contenido.condicionesPago.filter((c) => c.trim());
  return (
    <View>
      <View style={{ backgroundColor: COLOR.celeste, paddingVertical: 9, paddingHorizontal: 10 }} wrap={false}>
        <Text style={estilos.etiqueta}>CLIENTE</Text>
        <Text style={{ fontSize: 15, fontWeight: "bold", marginTop: 2 }}>{datos.cliente.nombre}</Text>
        {datos.titulo ? <Text style={{ fontSize: 10, color: COLOR.gris, marginTop: 1 }}>{datos.titulo}</Text> : null}
      </View>

      <TituloSeccion>DETALLE DEL TRABAJO</TituloSeccion>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 6 }} wrap={false}>
          <Text style={{ width: 40, paddingLeft: 6, fontWeight: "bold", color: COLOR.azul }}>
            {String(i + 1).padStart(2, "0")}
          </Text>
          <View style={{ flex: 1 }}>
            <Parrafos texto={item} />
          </View>
        </View>
      ))}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: COLOR.celeste,
          paddingVertical: 8,
          paddingHorizontal: 10,
          marginTop: 12,
        }}
        wrap={false}
      >
        <Text style={{ fontWeight: "bold", flex: 1, textTransform: "uppercase" }}>{contenido.totalEtiqueta}</Text>
        <Text style={{ fontSize: 15, fontWeight: "bold" }}>{formatearPesos(contenido.total)}</Text>
      </View>

      {contenido.observaciones.trim() ? (
        <View>
          <TituloSeccion>OBSERVACIONES</TituloSeccion>
          <View style={{ paddingHorizontal: 6 }}>
            <Parrafos texto={contenido.observaciones.trim()} />
          </View>
        </View>
      ) : null}

      {condiciones.length > 0 ? (
        <View wrap={false}>
          <TituloSeccion>CONDICIONES DE PAGO</TituloSeccion>
          {condiciones.map((condicion, i) => (
            <Text key={i} style={{ paddingHorizontal: 6, marginBottom: 2 }}>
              • {condicion}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={estilos.firma} wrap={false}>
        <Text>Saluda atentamente,</Text>
        <Text style={{ fontSize: 10, fontWeight: "bold" }}>{EMPRESA.titular}</Text>
      </View>
    </View>
  );
}

const COLUMNAS_MATERIALES = [
  { rotulo: "ÍTEM", ancho: "7%" },
  { rotulo: "DESCRIPCIÓN DEL MATERIAL", ancho: "52%" },
  { rotulo: "CANTIDAD", ancho: "11.5%" },
  { rotulo: "UNIDAD", ancho: "11.5%" },
  { rotulo: "OBSERVACIONES", ancho: "18%" },
] as const;

function CuerpoMateriales({ datos, contenido }: { datos: DatosDocumentoPdf; contenido: ContenidoMateriales }) {
  const items = contenido.items.filter((item) => Object.values(item).some((v) => v.trim()));
  const celda = { paddingVertical: 4, paddingHorizontal: 5 };
  return (
    <View>
      <GrillaDatos
        filas={[
          [
            ["CLIENTE", datos.cliente.nombre],
            ["OBRA / TRABAJO", contenido.obra || datos.titulo || ""],
          ],
          [
            ["FECHA", formatearFecha(datos.fecha)],
            ["SOLICITADO POR", contenido.solicitadoPor],
          ],
        ]}
      />

      <TituloSeccion>DETALLE DE MATERIALES</TituloSeccion>
      <View style={{ flexDirection: "row", backgroundColor: COLOR.celeste }} fixed>
        {COLUMNAS_MATERIALES.map((col) => (
          <Text key={col.rotulo} style={[estilos.etiqueta, celda, { width: col.ancho }]}>
            {col.rotulo}
          </Text>
        ))}
      </View>
      {items.map((item, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", fontSize: 9, borderBottomWidth: 0.5, borderBottomColor: COLOR.linea }}
          wrap={false}
        >
          <Text style={[celda, { width: COLUMNAS_MATERIALES[0].ancho }]}>{i + 1}</Text>
          <Text style={[celda, { width: COLUMNAS_MATERIALES[1].ancho }]}>{item.descripcion}</Text>
          <Text style={[celda, { width: COLUMNAS_MATERIALES[2].ancho }]}>{item.cantidad}</Text>
          <Text style={[celda, { width: COLUMNAS_MATERIALES[3].ancho }]}>{item.unidad}</Text>
          <Text style={[celda, { width: COLUMNAS_MATERIALES[4].ancho }]}>{item.observaciones}</Text>
        </View>
      ))}

      {contenido.observaciones.trim() ? (
        <View wrap={false}>
          <TituloSeccion>OBSERVACIONES GENERALES</TituloSeccion>
          <View style={estilos.caja}>
            <Parrafos texto={contenido.observaciones.trim()} estilo={{ fontSize: 9.5 }} />
          </View>
        </View>
      ) : null}

      <FirmaElaboro titular={EMPRESA.titular} rubro={EMPRESA.rubroFirma} />
    </View>
  );
}

const SECCIONES_INFORME: { campo: keyof ContenidoInforme; titulo: string }[] = [
  { campo: "motivo", titulo: "MOTIVO / OBJETO DEL INFORME" },
  { campo: "descripcion", titulo: "DESCRIPCIÓN / ESTADO ACTUAL" },
  { campo: "observaciones", titulo: "OBSERVACIONES" },
  { campo: "trabajosRealizados", titulo: "TRABAJOS REALIZADOS" },
  { campo: "recomendaciones", titulo: "RECOMENDACIONES / CONCLUSIONES" },
];

function CuerpoInforme({ datos, contenido }: { datos: DatosDocumentoPdf; contenido: ContenidoInforme }) {
  return (
    <View>
      <GrillaDatos
        filas={[
          [
            ["CLIENTE", datos.cliente.nombre],
            ["EQUIPO / INSTALACIÓN", contenido.equipo],
          ],
          [
            ["UBICACIÓN", contenido.ubicacion],
            ["RESPONSABLE / CONTACTO", contenido.contacto],
          ],
        ]}
      />

      {SECCIONES_INFORME.filter(({ campo }) => contenido[campo].trim()).map(({ campo, titulo }) => (
        <View key={campo}>
          <TituloSeccion>{titulo}</TituloSeccion>
          <View style={estilos.caja}>
            <Parrafos texto={contenido[campo].trim()} />
          </View>
        </View>
      ))}

      <View wrap={false}>
        <FirmaElaboro titular={EMPRESA.titular} rubro={EMPRESA.rubroFirma} />
        <View style={[estilos.firma, { marginTop: 18 }]}>
          <Text>Firma / conformidad del cliente:</Text>
          <Text style={{ marginTop: 18 }}>____________________________</Text>
        </View>
      </View>
    </View>
  );
}
