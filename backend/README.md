# SportClash Backend (AWS)

Backend mínimo (MVP) para SportClash:

- REST: API Gateway HTTP API → Lambda
- Real-time: API Gateway WebSocket → Lambda
- Datos: DynamoDB
- Auth: Cognito JWT (o Firebase Auth como transición)

## Requisitos

- Node.js 20+
- AWS CLI configurado (`aws configure`)

## Variables de entorno

- `AUTH_PROVIDER`: `cognito` | `firebase` | `auto` (default: `cognito`)
- `COGNITO_JWKS_URL`: JWKS de Cognito (p.ej. `https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json`)
- `FIREBASE_PROJECT_ID`: Project ID de Firebase (solo si `AUTH_PROVIDER=firebase` o `auto`)

### Modo recomendado para empezar (sin migrar login todavía)

Si el frontend sigue usando Firebase Auth, pon:

```bash
export AUTH_PROVIDER=firebase
export FIREBASE_PROJECT_ID=TU_PROJECT_ID
```

Y el frontend enviará su `idToken` Firebase como `Authorization: Bearer ...`.

## Instalar y desplegar

```bash
cd backend
npm i
npm run deploy
```

Ver endpoints tras desplegar:

```bash
cd backend
npx serverless info
```

Con esas URLs puedes configurar el frontend:

- `VITE_AWS_API_BASE_URL` (REST)
- `VITE_AWS_WS_URL` (WS)

## Endpoints principales

- Ligas: `POST /leagues`, `GET /me/leagues`, `GET /leagues/{leagueId}`, `DELETE /leagues/{leagueId}`
- Miembros: `GET /leagues/{leagueId}/members`, `PATCH /leagues/{leagueId}/members/{targetUid}`, `DELETE /leagues/{leagueId}/members/{targetUid}`
- Join requests: crear/listar/decidir + `GET /leagues/{leagueId}/join-requests/me`
- Point requests: crear/listar/decidir + `GET /leagues/{leagueId}/point-requests/me` + `PATCH/DELETE` de solicitud propia
- Historial: `GET /leagues/{leagueId}/history`

## Notas

- `leagueHistory` se guarda en DynamoDB (`TABLE_LEAGUE_HISTORY`) para soportar la pestaña Historial.
- El WebSocket usa `?token=<idToken>` en `$connect` y luego `subscribe/unsubscribe` por `leagueId`.

## Quitar

```bash
cd backend
npm run remove
```

## Nota

Este scaffold prioriza simplicidad y bajo coste (PAY_PER_REQUEST). Para producción conviene añadir:

- rate limiting / WAF
- logs estructurados + tracing
- validación más estricta
