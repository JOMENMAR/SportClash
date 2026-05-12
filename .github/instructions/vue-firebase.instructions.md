---
description: "Use when editing Vue components or Firestore service layer in SportClash. Keywords: Vue 3, Vite, Tailwind, BasePage, leaguesFirestore, LeagueDetail, Firebase Auth, Firestore queries."
applyTo: "src/**/*.vue, src/services/**/*.js"
---
# Vue + Firebase (SportClash)

## Estructura
- Componentes: `src/components/`.
- Acceso a Firestore: `src/services/leaguesFirestore.js` y servicios afines.

## Reglas
- No usar Vue Router: navegación se hace desde `src/App.vue` (pantallas/steps).
- Mantener el estilo Tailwind existente; evitar introducir nuevos tokens de diseño.
- Validaciones de UX que también se refuercen en rules cuando aplique (p. ej. motivo obligatorio en rechazo).

## Firestore en el cliente
- Queries deben alinearse con `firestore.rules`.
- Si una query falla por rules, ajustar primero la query o rules; no “workarounds” con lecturas masivas.
