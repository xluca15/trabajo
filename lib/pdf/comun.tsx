import { Font, Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Styles } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { EMPRESA } from "../empresa";

// Medidas y colores tomados de las plantillas .docx de Leo (_General/*.docx).
// Los tamaños de Word vienen en medios puntos: sz 38 → 19 pt, sz 18 → 9 pt, etc.
export const COLOR = {
  azul: "#2F74B7",
  celeste: "#EAF3FA",
  fondoCaja: "#F7FAFC",
  texto: "#1F2328",
  gris: "#69757D",
  pie: "#646464",
  linea: "#D5E3F0",
};

let fuentesRegistradas = false;

/**
 * Caladea es métricamente igual a Cambria (la fuente de las plantillas) y es libre.
 * `base` es una carpeta en disco (servidor) o una URL (navegador).
 */
export function registrarFuentes(base: string) {
  if (fuentesRegistradas) return;
  fuentesRegistradas = true;
  const src = (archivo: string) => `${base.replace(/\/$/, "")}/${archivo}`;
  Font.register({
    family: "Caladea",
    fonts: [
      { src: src("Caladea-Regular.ttf") },
      { src: src("Caladea-Bold.ttf"), fontWeight: "bold" },
      { src: src("Caladea-Italic.ttf"), fontStyle: "italic" },
      { src: src("Caladea-BoldItalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
    ],
  });
  // Sin esto react-pdf corta palabras en español con reglas del inglés.
  Font.registerHyphenationCallback((palabra) => [palabra]);
}

export const estilos = StyleSheet.create({
  pagina: {
    fontFamily: "Caladea",
    fontSize: 10,
    color: COLOR.texto,
    paddingTop: 34,
    paddingBottom: 56,
    paddingHorizontal: 40,
    lineHeight: 1.3,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logo: { width: 184, height: 95 },
  tituloDoc: { fontSize: 19, fontWeight: "bold", color: COLOR.azul, lineHeight: 1.1 },
  numeroDoc: { fontSize: 11, fontWeight: "bold", marginTop: 3 },
  fechaDoc: { fontSize: 9 },
  filaEmpresa: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: COLOR.azul,
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  seccion: { fontSize: 10, fontWeight: "bold", color: COLOR.azul, marginTop: 14, marginBottom: 6 },
  etiqueta: { fontSize: 8, fontWeight: "bold", color: COLOR.azul },
  caja: { backgroundColor: COLOR.fondoCaja, paddingVertical: 6, paddingHorizontal: 8 },
  firma: { alignItems: "flex-end", marginTop: 22, fontSize: 9 },
  pie: {
    position: "absolute",
    bottom: 26,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: COLOR.pie,
  },
});

export function Encabezado(props: { titulo: string; numero: string; fecha: string; logo: string }) {
  return (
    <View style={estilos.encabezado} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, no de HTML */}
      <Image src={props.logo} style={estilos.logo} />
      <View style={{ alignItems: "flex-end", paddingTop: 4 }}>
        <Text style={estilos.tituloDoc}>{props.titulo}</Text>
        <Text style={estilos.numeroDoc}>N.º {props.numero}</Text>
        <Text style={estilos.fechaDoc}>Fecha: {props.fecha}</Text>
      </View>
    </View>
  );
}

export function FilaEmpresa() {
  return (
    <View style={estilos.filaEmpresa}>
      <View>
        <Text style={{ fontWeight: "bold" }}>{EMPRESA.rubro}</Text>
        <Text style={{ fontWeight: "bold" }}>{EMPRESA.email}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text>Tel.: {EMPRESA.telefono}</Text>
        <Text>{EMPRESA.servicio}</Text>
      </View>
    </View>
  );
}

export function Pie({ texto }: { texto: string }) {
  return (
    <Text style={estilos.pie} fixed>
      {EMPRESA.rubro}
      {"  •  "}
      {texto}
    </Text>
  );
}

export function TituloSeccion({ children }: { children: ReactNode }) {
  return (
    <Text style={estilos.seccion} minPresenceAhead={40}>
      {children}
    </Text>
  );
}

/** Grilla de 2 columnas con rótulo celeste arriba y valor abajo (informe y lista de materiales). */
export function GrillaDatos({ filas }: { filas: [string, string][][] }) {
  return (
    <View>
      {filas.map((fila, i) => (
        <View key={i} wrap={false}>
          <View style={{ flexDirection: "row", backgroundColor: COLOR.celeste }}>
            {fila.map(([rotulo]) => (
              <Text key={rotulo} style={[estilos.etiqueta, { flex: 1, paddingVertical: 4, paddingHorizontal: 6 }]}>
                {rotulo}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", marginBottom: 2 }}>
            {fila.map(([rotulo, valor]) => (
              <Text key={rotulo} style={{ flex: 1, fontSize: 9.5, paddingVertical: 5, paddingHorizontal: 6 }}>
                {valor || " "}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Texto con saltos de línea respetados (cada línea es un párrafo). */
export function Parrafos({ texto, estilo }: { texto: string; estilo?: Styles[string] }) {
  const lineas = texto.split(/\r?\n/);
  return (
    <View>
      {lineas.map((linea, i) => (
        <Text key={i} style={estilo}>
          {linea || " "}
        </Text>
      ))}
    </View>
  );
}

export function FirmaElaboro({ titular, rubro }: { titular: string; rubro: string }) {
  return (
    <View style={estilos.firma} wrap={false}>
      <Text>Elaboró:</Text>
      <Text style={{ fontSize: 10, fontWeight: "bold" }}>{titular}</Text>
      <Text style={{ fontSize: 8 }}>{rubro}</Text>
    </View>
  );
}
