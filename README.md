# Tech Store

Tienda online SPA educativa construida con React 18, TypeScript y Vite.
Incluye autenticación, perfiles y roles, catálogo, carrito persistente,
checkout simulado con control transaccional de stock, historial de órdenes,
administración y carga de imágenes en un bucket S3 privado.

## Requisitos

- Node.js 22 o posterior.
- npm.
- Proyecto Firebase con Authentication y Firestore.
- Proyecto Vercel para publicar la SPA y las funciones de `api/`.
- Bucket S3 privado para las imágenes de productos.

## Instalación local

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Comandos de verificación:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
```

Las funciones serverless de `api/` se ejecutan mediante Vercel (por ejemplo,
`vercel dev`); el servidor de Vite por sí solo no implementa esas rutas.

## Variables de entorno

Copiá los nombres de [.env.example](./.env.example) a `.env.local` y configurá
los valores localmente. No guardes secretos en Git, en variables `VITE_*` ni en
el código del navegador.

| Variable | Uso | Dónde configurarla |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración pública del cliente Firebase | `.env.local` y Vercel |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de Firebase Authentication | `.env.local` y Vercel |
| `VITE_FIREBASE_PROJECT_ID` | Proyecto Firebase del cliente | `.env.local` y Vercel |
| `VITE_FIREBASE_APP_ID` | Aplicación Firebase del cliente | `.env.local` y Vercel |
| `FIREBASE_ADMIN_PROJECT_ID` | Proyecto para Firebase Admin SDK | `.env.local` y Vercel, solo server |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Cuenta de servicio de Firebase Admin | `.env.local` y Vercel, solo server |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave privada de Firebase Admin | `.env.local` y Vercel, solo server |
| `AWS_REGION` | Región del bucket | `.env.local` y Vercel, solo server |
| `AWS_S3_BUCKET` | Nombre del bucket privado | `.env.local` y Vercel, solo server |
| `AWS_ACCESS_KEY_ID` | Identidad IAM restringida para imágenes | `.env.local` y Vercel, solo server |
| `AWS_SECRET_ACCESS_KEY` | Secreto de esa identidad IAM | `.env.local` y Vercel, solo server |

En Vercel, marcá las variables de servidor para Production, Preview y
Development según el entorno. Pegá `FIREBASE_ADMIN_PRIVATE_KEY` como clave
multilínea o con `\n` escapados. No compartas archivos `.env*` reales ni los
incluyas en capturas o bitácoras.

## Arquitectura

- `src/`: aplicación React; las páginas secundarias se cargan de forma diferida
  por ruta y el bundle de dependencias se divide en chunks.
- `src/services/`: integraciones de cliente con Firebase y llamadas serverless.
- `api/`: endpoints Vercel para checkout, cambios de estado y acceso a imágenes.
- `server/`: lógica de servidor con Firebase Admin SDK y AWS SDK.
- `firestore.rules`: reglas cliente; las funciones de servidor usan Admin SDK y
  deben validar autorización y datos por separado.
- `vercel.json`: salida Vite en `dist/` y fallback SPA para rutas del cliente.
- `.github/workflows/ci.yml`: tests, lint, build y auditoría de dependencias de
  producción en cada push a `main` y pull request.

El checkout vuelve a leer carrito, productos, precios y stock dentro de una
transacción de Firestore. El identificador del intento hace que los reintentos
de red devuelvan la misma orden en lugar de duplicarla. Cancelar una orden
restaura stock en una transacción y el cambio de estado es idempotente.

Las imágenes se suben con un POST presignado de corta duración. El navegador
guarda `/api/product-image?key=...` en el producto; la función obtiene el objeto
del bucket privado y solo acepta claves bajo `products/` con UUID y extensión
permitida. Las URL antiguas de S3 compatibles se sirven mediante el mismo proxy.

## Firebase y seguridad de datos

1. Habilitá Email/Password y Google en Firebase Authentication.
2. Agregá los dominios local y de producción a **Authentication → Settings →
   Authorized domains**.
3. Publicá `firestore.rules` en Firestore. Los usuarios solo pueden crear su
   perfil como `customer`; el rol `admin` debe asignarse mediante un proceso
   confiable de administración. Los pedidos solo se escriben desde el backend.
4. Asegurá que el backend tenga una cuenta de servicio con privilegios mínimos.
   Admin SDK no queda limitado por las reglas de Firestore, por eso cada endpoint
   comprueba identidad, rol y datos recibidos.

## AWS S3

Mantené el bucket privado y no habilites acceso público. La identidad IAM de
Vercel solo necesita `s3:PutObject` y `s3:GetObject` sobre
`arn:aws:s3:::NOMBRE-DEL-BUCKET/products/*`; no requiere permisos de listado.
El bucket debe usar bloqueo de acceso público.

Adaptá [s3-cors.example.json](./s3-cors.example.json) sustituyendo el dominio de
ejemplo por el origen exacto de producción y cargá la configuración en
**S3 → Permissions → Cross-origin resource sharing (CORS)**. Conservá
`localhost:5173` solo si se necesita subir imágenes desde desarrollo. No uses
`*` como origen permitido. CORS habilita el POST desde el navegador; no otorga
permisos al bucket.

La subida requiere una ruta serverless disponible. Para probarla localmente,
usá Vercel CLI con las variables de entorno locales configuradas. La
visualización necesita que `GET /api/product-image` pueda leer el objeto con la
identidad IAM del backend.

## Tests

Vitest y React Testing Library ejecutan la suite con `npm test`. Los tests deben
mantener Firebase, Firebase Admin y AWS aislados mediante mocks; nunca deben
usar una cuenta ni un bucket de producción. Los escenarios críticos incluyen
compras concurrentes, stock insuficiente, reintentos con el mismo identificador,
cancelación/restauración de stock, permisos de administrador y autorización de
subidas.

Las reglas se pueden probar con Firebase Emulator Suite y
`@firebase/rules-unit-testing`; antes de publicar cambios, comprobá que clientes
no puedan elevar su rol ni escribir órdenes directamente.

## Deploy en GitHub y Vercel

1. Subí el repositorio a GitHub y conectalo a Vercel desde **Add New → Project**.
   Este checkout local aún debe vincularse con un remoto GitHub.
2. Elegí la rama `main`. Vercel detectará `vercel.json`; el build ejecuta
   `npm run build` y publica `dist/`.
3. Cargá las variables de entorno en Vercel sin exponer valores en el repositorio.
4. Configurá en Firebase el dominio `*.vercel.app` que corresponda y el dominio
   propio final. Actualizá el origen exacto de S3 CORS con ese dominio.
5. Esperá a que el workflow **CI** apruebe tests, lint, build y audit de
   dependencias de producción antes de integrar cambios.
6. Completá un deploy de Preview y luego Production. Confirmá manualmente
   registro, Google, login, persistencia del carrito, checkout, stock, historial,
   administración y subida/visualización de imágenes.

La vinculación GitHub–Vercel, las credenciales de Firebase/AWS, el dominio
autorizado y la prueba de producción requieren acceso a esas cuentas; no se
configuran desde este repositorio.

## Bitácora de uso de IA

Las siguientes entradas describen consultas y cambios efectivamente realizados
durante el desarrollo:

### Entrada 1 — Tailwind y componente Button

- **Fecha:** 01/10/2026.
- **Herramienta:** ChatGPT.
- **Consulta:** configuración de Tailwind, estilos mobile first y componente
  Button tipado y reutilizable; también se consultó por un error de importación.
- **Resultado y decisión:** se centralizaron variantes `primary` y `secondary`
  en Button y se mantuvieron las acciones del contador en App.
- **Validación y aprendizaje:** el build de Vite/TypeScript terminó correctamente.
  Los imports estáticos se declaran en el nivel superior y las props facilitan la
  reutilización.
- **Evidencia:** `src/components/ui/Button.tsx`, `src/App.tsx` y
  `vite.config.ts`.

### Entrada 2 — Imágenes privadas de productos

- **Fecha:** 09/10/2026.
- **Herramienta:** Copilot en VS Code.
- **Consulta:** conectar las imágenes subidas a S3 privado con catálogo,
  detalle y formulario de administración.
- **Resultado y decisión:** la carga entrega una URL interna de proxy; las
  páginas comparten ProductImage y las URL S3 heredadas permitidas se traducen
  al mismo endpoint. Se conserva un mensaje visible ante fallos de carga.
- **Validación:** tests del servicio/componente y build de producción.
- **Evidencia:** `src/services/imageService.ts`,
  `src/components/products/ProductImage.tsx` y
  `api/product-image.ts`.

### Entrada 3 — Carga diferida de páginas

- **Fecha:** 09/10/2026.
- **Herramienta:** Copilot en VS Code.
- **Consulta:** reducir el bundle inicial de la SPA sin cambiar las rutas.
- **Resultado y decisión:** se aplicó `React.lazy` a páginas de cliente y admin,
  con un estado de carga accesible compartido.
- **Validación:** build de producción y tests de navegación.
- **Evidencia:** `src/App.tsx` y los chunks generados por Vite.

### Entrada 4 — Reglas y pipeline de despliegue

- **Fecha:** 09/10/2026.
- **Herramienta:** Copilot en VS Code.
- **Consulta:** documentar controles de acceso y automatizar comprobaciones de
  pull requests.
- **Resultado y decisión:** se añadieron reglas Firestore por usuario/rol y un
  workflow de GitHub Actions para tests, lint, build y auditoría de dependencias
  de producción.
- **Validación:** comprobación de sintaxis, suite Vitest y build local.
- **Evidencia:** `firestore.rules`, `.github/workflows/ci.yml` y `vercel.json`.

### Entrada 5 — Configuración operativa de producción

- **Fecha:** 09/10/2026.
- **Herramienta:** Copilot en VS Code.
- **Consulta:** dejar documentados los pasos de Firebase, AWS S3, Vercel y
  GitHub sin incluir secretos.
- **Resultado y decisión:** se documentaron variables, permisos IAM mínimos,
  CORS con origen exacto y los pasos manuales que dependen de acceso externo.
- **Validación:** revisión de nombres de variables contra `.env.example`.
- **Evidencia:** este README y `s3-cors.example.json`.
