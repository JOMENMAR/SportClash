# SportClash — Contrato API (AWS) — REST + Real‑time (WebSocket)

Este documento define el contrato **de red** (requests/responses + eventos) para migrar SportClash desde Firebase a **AWS con API propia**:

- Auth: **Cognito JWT**
- REST: **API Gateway (HTTP API) + Lambda**
- Datos: **DynamoDB**
- Real‑time: **API Gateway WebSocket** con “rooms” por `leagueId`

> Objetivo: que el frontend no hable con la DB directamente. Todo pasa por REST y los cambios “al momento” llegan por WebSocket.

---

## 1) Convenciones

### Base URL

- REST: `https://{apiId}.execute-api.{region}.amazonaws.com/{stage}`
- WS: `wss://{wsApiId}.execute-api.{region}.amazonaws.com/{stage}`

### Auth

Todos los endpoints (salvo healthchecks si se añaden) requieren:

- Header: `Authorization: Bearer <CognitoJWT>`

El `uid` del usuario se toma de `sub` del JWT.

### Fechas

- `createdAt`, `decidedAt`, `joinedAt`: ISO string (UTC), ej. `2026-05-21T22:35:46.497Z`
- `performedOn`: fecha de ejercicio (YYYY‑MM‑DD), ej. `2026-05-20`

### Respuestas

- Éxito: `2xx` con JSON
- Error: `4xx/5xx` con JSON:

```json
{
  "error": {
    "code": "forbidden",
    "message": "No tienes permisos para esta acción",
    "details": { "leagueId": "..." }
  }
}
```

Códigos de error sugeridos:

- `unauthorized` (401)
- `forbidden` (403)
- `not_found` (404)
- `conflict` (409)
- `validation_error` (400)
- `rate_limited` (429)

### Roles

- `owner` / `admin` / `member`

Reglas de negocio mínimas (alineadas con SportClash):

- Un usuario puede ser **propietario de como máximo 1 liga**.
- Admin **no puede aprobar/rechazar** sus propios puntos. (Owner sí.)
- Cada solicitud de puntos vale **1 punto**.

---

## 2) Modelos

### League

```json
{
  "leagueId": "gnYi...",
  "name": "Nullpointer",
  "iconKey": "weights",
  "visibility": "private",
  "dailyPointsLimit": 2,
  "membersCount": 3,
  "createdAt": "2026-05-18T17:36:33.000Z",
  "createdBy": "uid..."
}
```

### LeagueMember

```json
{
  "leagueId": "gnYi...",
  "uid": "uid...",
  "role": "member",
  "joinedAt": "2026-05-20T21:11:31.000Z"
}
```

### JoinRequest

```json
{
  "requestId": "jr_...",
  "leagueId": "gnYi...",
  "uid": "uid...",
  "status": "pending",
  "createdAt": "2026-05-22T10:36:05.000Z",
  "decidedAt": null,
  "decidedBy": null
}
```

### PointRequest

```json
{
  "requestId": "pr_...",
  "leagueId": "gnYi...",
  "uid": "uid...",
  "status": "pending",
  "points": 1,
  "note": "Gym",
  "performedOn": "2026-05-20",
  "createdAt": "2026-05-20T16:56:47.000Z",
  "decidedAt": null,
  "decidedBy": null,
  "rejectReason": null
}
```

---

## 3) REST — Endpoints

### 3.1 POST /leagues

Crea una liga y añade al creador como `owner`.

- Restricción: el usuario solo puede tener **1 liga** como propietario.

Request:

```json
{
  "name": "Mi Liga",
  "iconKey": "weights",
  "visibility": "private",
  "dailyPointsLimit": 2
}
```

Response `201`:

```json
{
  "league": { "leagueId": "..." }
}
```

Errores:

- `409 conflict`: ya tiene una liga como owner
- `400 validation_error`: datos inválidos

### 3.2 GET /me/leagues

Devuelve ligas donde el usuario es miembro/owner/admin.

Response `200`:

```json
{
  "leagues": [
    {
      "leagueId": "...",
      "name": "...",
      "iconKey": "weights",
      "visibility": "private",
      "dailyPointsLimit": 2,
      "membersCount": 3,
      "role": "member"
    }
  ]
}
```

### 3.3 GET /leagues/{leagueId}

Detalle de una liga (requiere ser miembro o liga pública).

Response `200`:

```json
{ "league": { "leagueId": "..." } }
```

### 3.4 GET /leagues/{leagueId}/members

Lista miembros de una liga (requiere ser miembro).

Response `200`:

```json
{ "members": [{ "uid": "...", "role": "member", "joinedAt": "..." }] }
```

### 3.4.b PATCH /leagues/{leagueId}/members/{targetUid}

Actualiza el rol de un miembro (owner/admin). No permite cambiar el rol del `owner`.

Request:

```json
{ "role": "admin" }
```

Response `200`:

```json
{ "ok": true }
```

### 3.4.c DELETE /leagues/{leagueId}/members/{targetUid}

Expulsa a un miembro (owner/admin). No permite expulsar al `owner`.

Response `200`:

```json
{ "ok": true }
```

### 3.4.d DELETE /leagues/{leagueId}

Borra una liga (solo `owner`).

Response `200`:

```json
{ "ok": true }
```

### 3.4.e GET /leagues/{leagueId}/history?limit=50

Lista historial de eventos de la liga (requiere ser miembro).

Response `200`:

```json
{
  "history": [
    {
      "id": "2026-05-26T12:00:00.000Z_ev_...",
      "type": "pointRequest.decide",
      "actorUid": "uid_admin",
      "payload": {
        "requestUid": "uid_member",
        "status": "approved",
        "points": 1
      },
      "createdAt": "2026-05-26T12:00:00.000Z"
    }
  ]
}
```

### 3.5 POST /leagues/{leagueId}/join-requests

Crea solicitud de entrada. (Para ligas privadas.)

Request:

```json
{}
```

Response `201`:

```json
{ "joinRequest": { "requestId": "...", "status": "pending" } }
```

Errores:

- `409 conflict`: ya existe solicitud pendiente para ese `uid`
- `403 forbidden`: ya es miembro

### 3.6 GET /leagues/{leagueId}/join-requests?status=pending

Lista solicitudes (requiere owner/admin).

Response `200`:

```json
{ "joinRequests": [{ "requestId": "...", "uid": "...", "status": "pending" }] }
```

### 3.7 POST /leagues/{leagueId}/join-requests/{requestId}/decide

Aprueba o rechaza una solicitud (owner/admin).

Request:

```json
{ "decision": "approve" }
```

Response `200`:

```json
{ "joinRequest": { "requestId": "...", "status": "approved" } }
```

### 3.7.b GET /leagues/{leagueId}/join-requests/me

Devuelve la solicitud del usuario actual (si existe) para esa liga.

Response `200`:

```json
{ "joinRequest": null }
```

o

```json
{ "joinRequest": { "requestId": "jr_...", "status": "pending" } }
```

### 3.8 POST /leagues/{leagueId}/point-requests

Crea solicitud de puntos (miembro).

Request:

```json
{
  "performedOn": "2026-05-20",
  "note": "Gym"
}
```

Response `201`:

```json
{ "pointRequest": { "requestId": "...", "status": "pending", "points": 1 } }
```

### 3.9 GET /leagues/{leagueId}/point-requests?status=pending

Lista solicitudes de puntos.

- `status=pending` o `status=rejected`: requiere `owner/admin` (moderación)
- `status=approved` (o sin filtro): requiere ser miembro (`owner/admin/member`)

Response `200`:

```json
{ "pointRequests": [{ "requestId": "...", "uid": "...", "status": "pending" }] }
```

### 3.9.b GET /leagues/{leagueId}/point-requests/me

Lista las solicitudes de puntos del usuario actual en esa liga.

Response `200`:

```json
{ "pointRequests": [{ "requestId": "pr_...", "status": "pending" }] }
```

### 3.9.c PATCH /leagues/{leagueId}/point-requests/{requestId}

Edita una solicitud propia (solo si sigue `pending`).

Request (campos opcionales):

```json
{ "performedOn": "2026-05-20", "note": "Gym" }
```

Response `200`:

```json
{ "ok": true }
```

### 3.9.d DELETE /leagues/{leagueId}/point-requests/{requestId}

Borra una solicitud propia (solo si sigue `pending`).

Response `200`:

```json
{ "ok": true }
```

### 3.10 POST /leagues/{leagueId}/point-requests/{requestId}/decide

Aprueba/rechaza puntos (owner/admin; admin no puede decidir los suyos).

Request:

```json
{ "decision": "approve" }
```

Response `200`:

```json
{ "pointRequest": { "requestId": "...", "status": "approved" } }
```

Errores:

- `403 forbidden`: admin intentando moderar sus propios puntos
- `409 conflict`: excede `dailyPointsLimit` para `performedOn`

---

## 4) WebSocket — Mensajes y eventos

### 4.1 Mensajes cliente → servidor

#### subscribe

```json
{ "action": "subscribe", "leagueId": "gnYi..." }
```

#### unsubscribe

```json
{ "action": "unsubscribe", "leagueId": "gnYi..." }
```

El servidor debe validar que el `uid` es miembro de la liga (o que la liga es pública, si se permite).

### 4.2 Mensajes servidor → cliente (envelope)

```json
{
  "type": "pointRequest.created",
  "leagueId": "gnYi...",
  "ts": "2026-05-20T16:56:47.000Z",
  "data": { "requestId": "..." }
}
```

### 4.3 Tipos de evento

- `joinRequest.created`
- `joinRequest.updated` (approved/rejected)
- `pointRequest.created`
- `pointRequest.updated` (approved/rejected)
- `member.created` (al aprobar join)
- `league.updated` (membersCount, visibility, iconKey, etc.)

---

## 5) Compatibilidad con el frontend actual

- En Firestore se guarda `iconKey` (string). Este contrato lo mantiene.
- El frontend puede seguir usando su catálogo de `iconKey`.

---

## 6) Notas de costes

- Para mantener costes bajos: usar WebSocket **por liga** (room por `leagueId`) y emitir solo eventos relevantes.
- Configurar **AWS Budgets** con alertas desde el día 1.
