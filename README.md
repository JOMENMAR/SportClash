# SportClash

SportClash es una app web para competir con tus colegas en **ligas mensuales**: cada vez que haces deporte registras un **punto** (como solicitud), y los roles de moderación de la liga lo **aprueban o rechazan** para mantener el ranking limpio.

Este repo es el **frontend** (Vue 3 + Vite + Tailwind) y usa **Firebase** (Auth + Firestore).

## Estado actual (qué ya está hecho)

- Auth con email/contraseña + proveedores sociales.
- Verificación de email (flujo de verificación dedicado).
- Onboarding de perfil: pantalla de completar datos y persistencia de `profileCompleted` en `users/{uid}` (con fallback en `localStorage` para evitar bucles al refrescar cuando Firestore falla por rules).
- Ligas en Firestore: crear (pública/privada), listar (“Mis ligas” / “Global”), abrir una liga.
	- Nota: se eliminaron los códigos; la entrada se hace por **solicitud** y aprobación.
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
- `src/firebase.js`: inicialización de Firebase (lee credenciales desde variables de entorno de Vite).
- `src/services/`: capa de servicios (logger y acceso a Firestore para ligas).
- `src/style.css`: Tailwind + estilos globales.

## Navegación (sin router)

No se usa Vue Router. `src/App.vue` orquesta una “step machine” con pantallas tipo:

- Login → Register → Verify email → Completar perfil → Home
- Dentro de la app: Home / Ligas / Global / Perfil

Además, al abrir una liga desde “Mis ligas” o “Global”, se navega a la pantalla de detalle de liga.

## Firestore (modelo actual)

Colecciones principales:

- `users/{uid}`
	- `profileCompleted: boolean`
	- `profileCompletedAt: string (ISO)`
	- Campos de perfil (según `Profile.vue`)

- `leagues/{leagueId}`
	- `name: string`
	- `visibility: 'public' | 'private'`
	- `dailyPointsLimit: number`
	- `createdAt: serverTimestamp()`
	- `createdBy: uid`
	- `membersCount: number`

- `leagueMembers/{leagueId_uid}`
	- `leagueId: string`
	- `uid: string`
	- `role: 'owner' | 'admin' | 'member'`
	- `joinedAt: serverTimestamp()`

- `leagueJoinRequests/{leagueId_uid}`
	- `leagueId: string`
	- `uid: string`
	- `status: 'pending' | 'approved' | 'rejected'`
	- `createdAt: serverTimestamp()`
	- `decidedAt: serverTimestamp()`
	- `decidedBy: uid`

- `pointRequests/{leagueId_uid_ts}`
	- `leagueId: string`
	- `uid: string`
	- `points: number` (v1: siempre 1)
	- `note: string`
	- `performedOn: 'YYYY-MM-DD'` (obligatorio)
	- `status: 'pending' | 'approved' | 'rejected'`
	- `createdAt: serverTimestamp()`
	- `decidedAt: serverTimestamp()`
	- `decidedBy: uid`
	- `rejectReason: string | null`
	- `rejectedOn: 'YYYY-MM-DD' | null`

- `leagueHistory/{leagueId_type_ts_actorUid_rand}`
	- `leagueId: string`
	- `type: string` (p. ej. `pointRequest.decide`, `joinRequest.decide`, `member.remove`)
	- `actorUid: string`
	- `payload: object`
	- `createdAt: serverTimestamp()`

Notas:

- Las queries que usan `where(...) + orderBy(...)` pueden pedir índices compuestos. Si Firestore te muestra un enlace para “Create index”, créalo y vuelve a ejecutar.
- La auditoría (`leagueHistory`) es “best-effort”: si falla escribir el historial, no debe romper la acción principal.

## Setup local

Requisitos:

- Node.js (recomendado 18+).

Instalación:

```bash
npm install
npm run dev
```

Build/preview:

```bash
npm run build
npm run preview
```

## Firebase (configuración)

1) Crea un proyecto en Firebase y habilita:

- **Authentication** (Email/Password y/o los proveedores que uses).
- **Firestore**.

2) Crea un archivo `.env` (puedes partir de `.env.example`) y rellena tus credenciales del proyecto.

Notas:

- En Vite las variables deben empezar por `VITE_`.
- No subas `.env` a GitHub (ya está en `.gitignore`).

3) Revisa las reglas de Firestore.

- En desarrollo puedes empezar con reglas permisivas.
- En producción necesitas reglas que implementen permisos por rol (owner/admin/member).

## Debug

- Logs: el logger se puede activar con `localStorage` usando la clave `sportclash:debug`.
- Si estás depurando lecturas de Firestore, existe el script `src/debugFirestoreReads.js`.

## Roadmap (corto)

- Reglas de seguridad de Firestore estables (roles y permisos sin “fallbacks”).
- Mejoras de rendimiento (agregados/estadísticas precomputadas en servidor o funciones).
- Mejoras de escalado en queries/listados (paginación y/o desnormalización).

## Documentación

- Contexto y reglas del juego: [`CONTEXT.md`](./CONTEXT.md)
- Arquitectura y modelo de datos (en progreso): [`ARCHITECTURE.md`](./ARCHITECTURE.md)
