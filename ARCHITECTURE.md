# Arquitectura del proyecto (SportClash)

## Stack

- **Frontend:** Vue 3 (Composition API) + Vite + Tailwind.
- **Servicios:** Firebase
  - **Auth:** email/password + OAuth (Google/Facebook/Microsoft/Discord).
  - **Firestore:** perfiles + ligas + solicitudes de unión + solicitudes de puntos + historial (auditoría).

## Pantallas (actual)

- `Login.vue`: login + proveedores sociales.
- `Register.vue`: registro email/password y envío de verificación.
- `VerifyCode.vue`: espera de verificación (Firebase email-link).
- `CompletarDatos.vue`: onboarding extra (perfil).
- `Home.vue`: home inicial (liga reciente + stats) con datos mock.
- `Leagues.vue`: “Mis ligas” (pertenencia) + “Global” (públicas).
- `CreateLeague.vue`: crear liga.
- `JoinLeague.vue`: pantalla informativa (ya no se usan códigos; la entrada es por solicitud).
- `LeagueDetail.vue`: interior de liga (miembros, solicitudes de unión, puntos, ranking, historial).
- `Profile.vue`: ver/editar perfil.
- `TopNav.vue` / `AppFooter.vue`: shell de la app.

> Nota: actualmente no hay router; el flujo se orquesta desde `App.vue` con un “step”.

## Navegación (step machine)

`src/App.vue` controla un `step` reactivo y decide transiciones desde `onAuthStateChanged`:

- Si no hay usuario → `login`
- Si venimos de registro y `!emailVerified` → `verify`
- Si `users/{uid}.profileCompleted !== true` → `complete`
- Si todo OK → `home`

Además, cuando el usuario navega por la app, se cambia `step` a: `home`, `leagues`, `global`, `createLeague`, `joinLeague`, `profile`, etc.

## Flujo de usuario (intención)

1. Login/registro.
2. Verificación de email (si aplica).
3. Completar datos si falta perfil.
4. Home.
5. Desde Home: ligas y puntos.

## Modelo de dominio (borrador)

### Liga

- Liga mensual.
- Tiene miembros y admins.
- Tiene un ranking por mes.
- Tiene visibilidad y reglas (p. ej. límite de puntos diarios).

Campos clave (borrador):

- `visibility`: `public` | `private`
- `dailyPointsLimit`: número (idealmente entero; importante para rules)

Roles dentro de una liga:

- `owner`: dueño de la liga (gestiona miembros y roles).
- `admin`: modera solicitudes (unión/puntos) pero no puede moderar sus propios puntos.
- `member`: participa y solicita puntos.

### Punto (solicitud)

- Un usuario registra que ha realizado un deporte.
- El punto queda en estado `pending`.
- Un admin lo acepta/rechaza.

Estados sugeridos:

- `pending` | `approved` | `rejected`

### Stats

- Métricas agregadas por usuario:
  - récord de puntos mensual
  - victorias totales
  - rachas (actual y mejor)
  - puntos totales

## Firestore (estado actual)

### Perfiles

- `users/{uid}`
  - `profileCompleted: boolean`
  - `profileCompletedAt: string (ISO)`
  - (otros campos del perfil según `Profile.vue`)

### Ligas (v1)

Este esquema está implementado en `src/services/leaguesFirestore.js`.

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
  - `decidedAt: serverTimestamp() | null`
  - `decidedBy: uid | null`

- `pointRequests/{leagueId_uid_ts}`
  - `leagueId: string`
  - `uid: string`
  - `points: number` (v1: siempre 1)
  - `note: string`
  - `performedOn: 'YYYY-MM-DD'` (obligatorio)
  - `status: 'pending' | 'approved' | 'rejected'`
  - `createdAt: serverTimestamp()`
  - `decidedAt: serverTimestamp() | null`
  - `decidedBy: uid | null`
  - `rejectReason: string | null`
  - `rejectedOn: 'YYYY-MM-DD' | null`

- `leagueHistory/{leagueId_type_ts_actorUid_rand}`
  - `leagueId: string`
  - `type: string`
  - `actorUid: string`
  - `visibleToUids: array<string>` (requerido para queries “query-safe”)
  - `payload: object`
  - `createdAt: serverTimestamp()`

Nota: `leagueHistory` es de escritura backend-only; el frontend sólo lee.

### Servicios

- `src/services/leaguesFirestore.js`: create/join/fetch (con transacciones).
- `src/services/leaguesStore.js`: store reactiva para UI (loading/error + refresh).
- `src/services/logger.js`: logs con toggle por `localStorage` (`sportclash:debug`).

## Próximos pasos técnicos

- Mantener “step” (sin router) por ahora.
- Cerrar reglas de seguridad (ahora es el punto caliente):
  - Ojo con validaciones tipo `int` vs `number`.
  - Evitar `get(...).data` sin comprobar `.exists()`.
  - Mantener queries “query-safe” (si una pantalla usa `where(...)`, las rules deben permitir exactamente esa query).
