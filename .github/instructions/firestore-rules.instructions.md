---
description: "Use when editing Firestore security rules, firebase.json emulator config, or rules unit tests. Includes query-safe patterns, roles, and SportClash constraints. Keywords: firestore.rules, security rules, emulator, rules-unit-testing, leagueHistory."
applyTo: "firestore.rules"
---

# Firestore Rules (SportClash)

## Objetivo

Mantener reglas estrictas y compatibles con las queries reales del frontend.

## Reglas clave del producto

- Perfiles (`users/{uid}`): lectura pública; escritura solo el propio usuario; bloquear `list`.
- Ligas: `get` público incluso si `private`; `list` solo de `public`.
- Miembros: lectura sólo para miembros de esa liga.
- Roles/expulsiones: gestión de miembros (roles + kick) sólo `owner`.
- Join requests: moderación sólo `owner/admin`; usuario ve su propia request.
- Points: crear sólo miembros; `points == 1`; `performedOn` obligatorio; rechazo requiere `rejectReason`.
- Anti-trampa: admin no puede crear/aprobar/rechazar/moderar su propio pointRequest; owner sí.
- Historial `leagueHistory`: lectura para miembros; escritura sólo backend.

## Query-safe

- Evitar reglas que dependan de ORs complejos si la UI hace `list`/queries.
- Preferir que la query del cliente incluya filtros que las rules puedan verificar (p. ej. `where('subjectUids', 'array-contains', uid)` si se requiere).

## Al cambiar rules

- Actualiza también `tests/firestore.rules.test.mjs`.
- Corre `npm run test:rules`.
