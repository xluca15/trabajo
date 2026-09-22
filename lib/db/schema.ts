import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ESTADOS_PRESUPUESTO, TIPOS_DOCUMENTO, type EstadoPresupuesto, type TipoDocumento } from "../tipos";

// ---------------------------------------------------------------------------
// Better Auth (tablas estándar: user, session, account, verification)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export { TIPOS_DOCUMENTO, ESTADOS_PRESUPUESTO, type TipoDocumento, type EstadoPresupuesto };

export const clientes = pgTable(
  "clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    razonSocial: text("razon_social"),
    cuit: text("cuit"),
    contacto: text("contacto"),
    telefono: text("telefono"),
    email: text("email"),
    direccion: text("direccion"),
    localidad: text("localidad"),
    notas: text("notas"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("clientes_nombre_idx").on(sql`lower(${t.nombre})`)],
);

export const documentos = pgTable(
  "documentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: TIPOS_DOCUMENTO }).notNull(),
    numero: integer("numero"),
    fecha: date("fecha"),
    titulo: text("titulo"),
    estado: text("estado", { enum: ESTADOS_PRESUPUESTO }),
    // Contenido editable según el tipo (ver lib/documentos.ts). Null en importados sin texto.
    contenido: jsonb("contenido"),
    total: numeric("total", { precision: 14, scale: 2, mode: "number" }),
    // "importado": vino de la carpeta de Leo y su PDF original está en `archivos`.
    origen: text("origen", { enum: ["app", "importado"] }).default("app").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("documentos_cliente_idx").on(t.clienteId),
    index("documentos_tipo_numero_idx").on(t.tipo, t.numero),
  ],
);

export const archivos = pgTable(
  "archivos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    documentoId: uuid("documento_id").references(() => documentos.id, { onDelete: "set null" }),
    nombre: text("nombre").notNull(),
    tipoMime: text("tipo_mime").notNull(),
    tamano: integer("tamano").notNull(),
    contenido: bytea("contenido").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("archivos_cliente_idx").on(t.clienteId), index("archivos_documento_idx").on(t.documentoId)],
);

export type Cliente = typeof clientes.$inferSelect;
export type Documento = typeof documentos.$inferSelect;
export type Archivo = typeof archivos.$inferSelect;
