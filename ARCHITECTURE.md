# Arquitectura del proyecto (SportClash)

## Stack

- **Frontend:** Vue 3 (Composition API) + Vite + Tailwind.
- **Servicios:** Firebase
  - **Auth:** email/password + OAuth (Google/Facebook/Microsoft/Discord).
  - **Firestore:** perfiles y ligas (v1) ya cableados. Puntos/stats: pendiente.

## Pantallas (actual)

- `Login.vue`: login + proveedores sociales.
- `Register.vue`: registro email/password y envío de verificación.
- `VerifyCode.vue`: espera de verificación (Firebase email-link).
- `CompletarDatos.vue`: onboarding extra (perfil).
- `Home.vue`: home inicial (liga reciente + stats) con datos mock.
- `Leagues.vue`: “Mis ligas” (pertenencia) + “Global” (públicas).
- `CreateLeague.vue`: crear liga.
- `JoinLeague.vue`: unirte por código.
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

## Firestore (propuesta inicial)

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
  - `code: string` (normalizado en mayúsculas)
  - `createdAt: serverTimestamp()`
  - `createdBy: uid`
  - `membersCount: number`

- `leaguesByCode/{CODE}`
  - `leagueId: string`

- `leagueMembers/{leagueId_uid}`
  - `leagueId: string`
  - `uid: string`
  - `role: 'admin' | 'member'`
  - `joinedAt: serverTimestamp()`

### Servicios

- `src/services/leaguesFirestore.js`: create/join/fetch (con transacciones).
- `src/services/leaguesStore.js`: store reactiva para UI (loading/error + refresh).
- `src/services/logger.js`: logs con toggle por `localStorage` (`sportclash:debug`).

## Próximos pasos técnicos

- Mantener “step” (sin router) por ahora.
- Cerrar reglas de seguridad (ahora es el punto caliente):
  - Ojo con validaciones tipo `int` vs `number`.
  - Evitar `get(...).data` sin comprobar `.exists()`.
  - Evitar dependencias cruzadas dentro de una misma transacción (p.ej. `leaguesByCode` validando el doc `leagues` que se crea en el mismo commit).
