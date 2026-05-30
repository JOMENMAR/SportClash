# SportClash

SportClash es una app web para competir con tus colegas en **ligas mensuales**: cada vez que haces deporte registras un **punto** (como solicitud), y los roles de moderación de la liga lo **aprueban o rechazan** para mantener el ranking limpio.

Este repo es el **frontend** (Vue 3 + Vite + Tailwind) y usa **AWS Cognito Hosted UI** (OAuth2 + PKCE) para autenticación.

El backend es propio en **AWS** (REST + WebSocket).

## Estado actual (qué ya está hecho)

- Auth vía Cognito Hosted UI (el tipo de login/proveedores se configura en Cognito).
- Onboarding de perfil: pantalla de completar datos y persistencia de `profileCompleted` en backend (con fallback en `localStorage`).
- Ligas: crear (pública/privada), listar (“Mis ligas”), abrir una liga.
  - Nota: la entrada se hace por **solicitud** y aprobación.
- Interior de liga (pantalla tipo dashboard):
  - Roles: `owner`, `admin`, `member`.
  - Gestión de miembros: expulsar, cambiar rol (con reglas en UI, p. ej. no tocar al owner).
  - Solicitudes de unión: un usuario solicita entrar; owner/admin lo decide.
  - Puntos: crear solicitud (1 punto) con **fecha obligatoria** (`performedOn`) + nota.
  - Moderación de puntos: aprobar o rechazar con **motivo** (`rejectReason`) + **fecha de rechazo** (`rejectedOn`).
  - Regla anti-trampa en UI: admin (no owner) no puede moderar su propia solicitud.
  - Ranking y log de historial (auditoría “best-effort”).
- UX/visual:
  - Layout unificado con `BasePage.vue`.
  - Toasts globales (`ToastHost.vue` + store ligero).
  - Modales de confirmación reutilizables (`ConfirmModal.vue`) con `Teleport`, ESC/click-out y autofocus del botón primario.

## Estructura del proyecto

- `src/components/`: componentes Vue (Login, Register, Verify, Home, etc.).
- `src/services/`: capa de servicios (config + auth Cognito + acceso a AWS).
- `src/style.css`: Tailwind + estilos globales.

## Navegación (sin router)

No se usa Vue Router. `src/App.vue` orquesta una “step machine” con pantallas tipo:

- Login → Register → Verify email → Completar perfil → Home
- Dentro de la app: Home / Ligas / Global / Perfil

Además, al abrir una liga desde “Mis ligas” o “Global”, se navega a la pantalla de detalle de liga.

## Setup local

Requisitos:

- Node.js (recomendado 18+).

Instalación:

```bash
npm install
npm run dev
```

## Backend AWS

Este frontend asume backend en AWS.

### Variables de entorno (frontend)

En tu `.env` (raíz) añade/ajusta:

- `VITE_AWS_API_BASE_URL` (REST)
- `VITE_AWS_WS_URL` (WebSocket, opcional)
- `VITE_COGNITO_DOMAIN`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_REDIRECT_URI` (recomendado; debe estar permitido en Cognito)
- `VITE_COGNITO_LOGOUT_URI` (recomendado; debe estar permitido en Cognito)
- `VITE_COGNITO_SCOPES` (opcional; default: `openid email profile`)

Alternativa a `.env`: también puedes editar `public/runtime-config.js` en el hosting
para cambiar endpoints/config sin recompilar.

### Cómo obtener las URLs (backend)

Tras desplegar el backend, puedes ver los endpoints con:

```bash
cd backend
npx serverless info
```

Usa esas URLs para rellenar `VITE_AWS_API_BASE_URL` y `VITE_AWS_WS_URL`.

Build/preview:

```bash
npm run build
npm run preview
```

## Debug

- Logs: el logger se puede activar con `localStorage` usando la clave `sportclash:debug`.

## Roadmap (corto)

- Mejoras de rendimiento (agregados/estadísticas precomputadas en servidor).
- Mejoras de escalado en queries/listados (paginación).

## Backend (AWS)

El backend está en el folder [backend/README.md](backend/README.md).

## Documentación

- Contexto y reglas del juego: [`CONTEXT.md`](./CONTEXT.md)
- Arquitectura y modelo de datos (en progreso): [`ARCHITECTURE.md`](./ARCHITECTURE.md)
