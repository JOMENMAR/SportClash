---
name: sportclash-firestore-rules
description: "Diseña y depura Firestore Security Rules + tests con Firebase Emulator en SportClash. Úsalo cuando: falle `npm run test:rules`, haya permisos por rol (owner/admin/member), queries con `where()`/`orderBy()` que den `PERMISSION_DENIED`, join requests, pointRequests, o lectura de `leagueHistory` (siempre read-only). Enfoque: cambios mínimos y rules query-safe alineadas con `src/services/` (especialmente `src/services/leaguesFirestore.js`)."
argument-hint: "Pega la query exacta (where/orderBy), colección, rol, y el error/test que falla."
user-invocable: true
---

# SportClash — Firestore & Rules

Skill para mantener **reglas**, **queries** y **tests del emulador** alineados en SportClash.

## Cuando usarlo

- Al tocar [firestore.rules](../../../firestore.rules) o salir un `PERMISSION_DENIED`.
- Si el frontend usa `where(...)` / `orderBy(...)` y la query deja de ser “query-safe”.
- Si cambias permisos por rol (`owner/admin/member`).
- Si aparecen cambios en flujos de `join requests`, `pointRequests` o lectura de `leagueHistory`.

## Reglas del producto (criterios)

- Roles: `owner` / `admin` / `member`.
- Anti-trampa: `admin` no puede crear/aprobar/rechazar/moderar sus propios puntos; `owner` sí puede.
- Cada solicitud de puntos vale **1**.
- Moderación de miembros: solo `owner` (salvo indicación explícita).
- Moderación de solicitudes de unión: `owner`/`admin`.
- `leagueHistory`: **write backend-only**; frontend solo lectura.

## Procedimiento (orden obligatorio)

1. **Recolecta lo mínimo** (pregunta solo 1–3 cosas si falta info crítica):
   - Rol del usuario que ejecuta la acción.
   - Colección/ruta del documento (y si es `get`, `list`, `create`, `update`, `delete`).
   - Query exacta: `where(...)`, `orderBy(...)`, `limit(...)` (si aplica) o el test que falla.
2. **Cambiar primero rules**:
   - Edita [firestore.rules](../../../firestore.rules) con helpers por rol.
   - Asegura “query-safe” (las rules deben permitir exactamente las constraints requeridas por la query real).
   - Mantén `leagueHistory` estrictamente read-only para clientes.
3. **Alinear queries si hace falta**:
   - Si las rules requeridas fuerzan `where`/`orderBy` específicos, ajusta la query en `src/services/` (prioridad: `src/services/leaguesFirestore.js`).
   - Si cambias contrato/campos, actualiza el componente que consume y los tests.
4. **Actualizar tests**:
   - Edita/crea tests en `tests/firestore.rules.test.mjs`.
   - Incluye casos por rol y casos negativos (denegar) para anti-trampa.
5. **Validar (no terminar hasta pasar)**:
   - Ejecuta `npm run test:rules`.
   - Si falla: iterar en el mismo orden (rules → queries → tests).

## Checklist de “query-safe”

- La rule de `list` no debe ser “demasiado abierta”.
- Si la query usa `where('leagueId','==',X)`, la rule de `list` debe exigir ese filtro.
- Si la query añade `orderBy('createdAt')`, normalmente necesitarás permitir ese orden (según tu patrón de rules).
- Evitar `allow list: if true;` o condiciones que no dependan de la query.

## Definición de terminado

- `npm run test:rules` pasa.
- La pantalla/servicio que hace la query no requiere cambios de UX.
- `leagueHistory` permanece read-only para clientes.
- Los permisos por rol quedan claros y cubiertos por tests.
