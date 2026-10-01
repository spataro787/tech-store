# Tech Store

Proyecto educativo de una tienda online SPA, desarrollado paso a paso
con React 18, TypeScript y Vite.

## Objetivo

Permitir que clientes consulten productos y realicen compras simuladas,
y que administradores gestionen productos y órdenes.

## Tecnologías instaladas

- React 18.3.1
- TypeScript
- Vite
- ESLint

## Servicios y herramientas previstos

- React Router y Tailwind CSS
- Firebase Authentication y Firestore
- AWS S3
- Vercel Serverless Functions
- Vitest y React Testing Library

## Ejecutar en desarrollo

Desde la carpeta del proyecto:

```bash
npm install
npm run dev

### Entrada 2 — Tailwind y componente Button reutilizable

**Fecha:** 01/10/2026.

**Herramienta:** ChatGPT.

**Consulta:** Cómo configurar Tailwind, acomodar la pantalla y crear
un botón reutilizable con props tipadas. También consulté por un
error al importar el componente.

**Ayuda recibida:** Configuración de Tailwind con su plugin de Vite,
explicación de estilos mobile first y creación de Button con
variantes primary y secondary.

**Decisión tomada:** Concentrar los estilos de los botones en Button
y mantener el estado y las acciones del contador en App.

**Problema resuelto:** El import de Button estaba dentro de la
función App. Se movió al inicio del archivo y se eliminó un botón
duplicado.

**Validación:** npm run build terminó correctamente, ejecutando
la comprobación de TypeScript y el build de Vite.

**Aprendizaje:** Los imports estáticos se declaran en el nivel
superior del archivo. Las props permiten reutilizar un componente
con distintas acciones y estilos.

**Evidencia:** src/components/ui/Button.tsx, src/App.tsx,
vite.config.ts y salida del build compartida en la conversación.