# SportClash — Copilot Instructions

## Contexto rápido
- Proyecto: SportClash (frontend) con Vue 3 + Vite + Tailwind.
- Backend: Firebase (Auth + Firestore). Este repo contiene el frontend.
- Navegación: NO hay Vue Router; `src/App.vue` actúa como “step machine”.
- UI: layout común con `src/components/BasePage.vue`; toasts globales; modales reutilizables.

## Arquitectura
- Mantén la lógica de datos en `src/services/` (no mezclar acceso a Firestore dentro de componentes salvo wiring).
- Respeta el modelo descrito en `README.md` y `ARCHITECTURE.md` (si hay dudas, leer antes de cambiar colecciones/campos).

## Firestore + Reglas
- Cambios en reglas deben ser “query-safe”: si una pantalla usa `where(...)`, las rules deben permitir esa query (o ajustar la query).
- `leagueHistory` es de escritura **backend-only**. El frontend sólo lee.
- Si se cambia el contrato de `leagueHistory`, también se actualizan las queries en `src/services/leaguesFirestore.js` y los tests.

## Estilo de cambios
- Cambios mínimos y enfocados (evitar refactors grandes si no hacen falta).
- Mantener UX/visual existente (Tailwind ya definido; no introducir colores/temas nuevos sin pedirlo).
- Mensajes y UI en español.

## Build & Validación
- Dev: `npm run dev`
- Build: `npm run build`
- Rules tests (emulador): `npm run test:rules`

## Convenios
- Roles: `owner/admin/moderator/member`.
- Anti-trampa: admin/mod no moderan sus propios puntos; owner sí (siempre que el producto no diga lo contrario).
- Cada ejercicio/solicitud de puntos vale 1.
