# CRM Leo Calderas

Clientes, presupuestos, listas de materiales e informes técnicos de Leo Calderas, con PDFs que siguen las plantillas de Leo (`_General/*.docx`).

- **Clientes**: ficha con datos de contacto, notas y archivos adjuntos.
- **Documentos**: presupuestos, listas de materiales e informes, con editor, vista previa en vivo y autoguardado. Descarga en PDF (A4, texto real, ~40 KB) y botón "Compartir" en el celular (WhatsApp, mail…).
- **Historial importado**: los PDFs viejos de la carpeta `Clientes/` quedan en la ficha de cada cliente. Cualquiera se puede usar como base para uno nuevo.
- **Textos frecuentes**: los ítems que Leo más repite en los presupuestos, para agregarlos con un clic.

Stack: Next.js 16 · Neon (Postgres) + Drizzle · Better Auth (email y clave) · @react-pdf/renderer.

## Puesta en marcha con Neon

1. Crear un proyecto en [Neon](https://neon.tech) y copiar la cadena de conexión *pooled* (Dashboard → Connect).
2. Crear `.env.local` a partir de `.env.example`:
   ```sh
   cp .env.example .env.local
   # completar DATABASE_URL y generar el secreto:
   openssl rand -base64 32   # → BETTER_AUTH_SECRET
   ```
3. Instalar y crear las tablas:
   ```sh
   pnpm install
   pnpm db:migrate
   ```
4. Crear el usuario de Leo (desde la web no se puede registrar nadie):
   ```sh
   pnpm usuario:crear leo@ejemplo.com "Leonardo Lopez" 'una-clave-larga'
   ```
   Correrlo de nuevo con el mismo email cambia la clave.
5. Importar la carpeta de clientes. Necesita `pdftotext`, del paquete poppler:
   ```sh
   pnpm importar "/home/celiz/Escritorio/Clientes" --prueba   # muestra qué haría, sin guardar
   pnpm importar "/home/celiz/Escritorio/Clientes"
   ```
   Se puede correr más de una vez: los archivos que ya están se saltean. Al final lista lo que conviene revisar, como números repetidos o números que no coinciden con el nombre del archivo.
6. `pnpm dev` y entrar a http://localhost:3000.

## Desarrollo sin Neon

Para probar sin tocar la base real hay un Postgres local en memoria/disco (PGlite):

```sh
pnpm db:local        # deja corriendo un Postgres en 127.0.0.1:54329 (datos en ./.pglite)
# en .env.local: DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres
pnpm db:migrate && pnpm usuario:crear prueba@local "Prueba" 'clave-de-prueba'
pnpm dev
```

## Deploy en Vercel

1. En [vercel.com/new](https://vercel.com/new), importar el repo de GitHub. Detecta Next.js y pnpm solo, no hay que tocar nada del build.
2. En **Environment Variables**, cargar estas dos, para *Production* y *Preview*:
   - `DATABASE_URL`: la misma de `.env.local` (Neon, *pooled*, con `sslmode=verify-full`).
   - `BETTER_AUTH_SECRET`: la misma de `.env.local` o una nueva (`openssl rand -base64 32`).

   `BETTER_AUTH_URL` no hace falta en Vercel: la app usa el dominio de producción del proyecto. Si después agregás un dominio propio, pasa a ser ese.
3. Deploy. Las funciones corren en São Paulo (`gru1`, en `vercel.json`), al lado de la base de Neon (`sa-east-1`).

Los usuarios y las migraciones se manejan desde la PC, con `.env.local` apuntando a Neon:
`pnpm usuario:crear …` y, si cambia el esquema, `pnpm db:migrate`.

## En el celular

- **Instalarla**: abrirla en el navegador del celular y elegir *Agregar a la pantalla de inicio* (en iPhone, desde Compartir en Safari). Abre a pantalla completa, como una app.
- **Compartir PDFs**: en el editor, *Compartir* manda el PDF directo por WhatsApp, mail, etc. Necesita HTTPS, así que anda en Vercel y no en `http://192.168…`.
- **Fotos**: en la ficha del cliente, *Sacar foto* abre la cámara. Las fotos se achican solas antes de subirse (una de 8 MB queda en ~700 KB).
- **Probar en desarrollo**: con `pnpm dev` corriendo, entrar desde el celular (en el mismo wifi) a `http://<IP de la PC>:3000`. `pnpm dev` muestra la IP en la línea *Network*. Las IPs locales ya están habilitadas para el login.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` · `pnpm lint` | Chequeos |
| `pnpm db:generate` | Genera una migración nueva después de cambiar `lib/db/schema.ts` |
| `pnpm db:migrate` | Aplica las migraciones pendientes |
| `pnpm db:local` | Postgres local de desarrollo (PGlite) |
| `pnpm usuario:crear` | Crea un usuario o le cambia la clave |
| `pnpm importar` | Importa la carpeta de clientes |
| `pnpm pdf:muestras [carpeta]` | Genera PDFs de ejemplo de las 3 plantillas, para revisar el diseño |

## Dónde está cada cosa

- `lib/pdf/`: plantillas PDF. Los colores y tamaños salen de los `.docx` de Leo. Se usa la fuente Caladea porque ocupa lo mismo que Cambria y es libre. La misma plantilla genera la vista previa en el navegador y el PDF en el servidor.
- `lib/documentos.ts`: qué campos tiene cada tipo de documento (esquemas zod), valores por defecto y numeración.
- `lib/empresa.ts`: datos de Leo que salen en los PDFs (teléfono, mail…).
- `lib/importar/parsear.ts`: lectura de los PDFs viejos. Es de mejor esfuerzo; el PDF original siempre se guarda tal cual.
- `app/acciones.ts`: server actions (clientes, documentos, archivos).
- Los archivos (PDFs importados y adjuntos) se guardan en la base (`archivos.contenido`), hasta 4 MB cada uno.
