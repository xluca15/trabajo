<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proyecto: CRM Leo Calderas

- Código, nombres y textos de la UI en español rioplatense (clientes, documentos, `crearDocumento`, "Guardá", etc.).
- Datos: Drizzle sobre Postgres (Neon en producción, `pnpm db:local` con PGlite en desarrollo). Esquema en `lib/db/schema.ts`; después de cambiarlo, `pnpm db:generate` y `pnpm db:migrate`.
- Lo que se importa en el navegador no puede depender de `lib/db` ni de `server-only`: las constantes compartidas van en `lib/tipos.ts`.
- Las plantillas PDF (`lib/pdf/`) replican los `.docx` de Leo; revisar cambios con `pnpm pdf:muestras <carpeta>` y mirando el resultado.
- Verificación: `pnpm typecheck && pnpm lint && pnpm build`.
