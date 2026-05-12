# Contexto del proyecto (SportClash)

SportClash es una app para **picarte con tus colegas** de forma sencilla y sostenible.

La idea principal no es “contar pasos” ni “entrenos perfectos”, sino montar **ligas mensuales** donde se ve quién ha sido la persona que más deporte ha hecho ese mes.

## Concepto base (reglas)

- Una **liga** agrupa a un grupo de amigos.
- Dentro de una liga, cuando haces un deporte registras un **punto** (una “solicitud de punto”).
- Uno o varios **administradores** verifican ese punto (aceptar / rechazar) para mantenerlo limpio y evitar trampas.
- El mes se cierra con un **ranking** de puntos y se actualizan **estadísticas** (p. ej. récord de puntos mensual, victorias, rachas, etc.).

## Objetivos del producto

- Experiencia sencilla y rápida (registrar punto en segundos).
- Transparencia: todo punto debe poder ser auditado/verificado por admins.
- Motivación: rankings mensuales, rachas y estadísticas claras.
- Identidad real: validación de correo para reducir cuentas falsas.

## Público objetivo

- Grupos de amigos que quieren competir en algo simple.
- Equipos/peñas/clubes que quieren un “pique” mensual.

## Estado actual del repo

- Frontend en Vue 3 + Vite + Tailwind.
- Firebase Auth:
  - Email/Password + verificación de email.
  - Proveedores sociales.
- Flujo de onboarding con pantallas dedicadas orquestado desde `App.vue` (sin Vue Router).
- Perfil en Firestore: `users/{uid}` con flag `profileCompleted` (y fallback local para evitar bucles al refrescar).
- Ligas (v1) en Firestore: crear, listar públicas, “mis ligas”, unirse por código.
- `Home` inicial con secciones preparadas para liga reciente + stats (aún sin puntos reales).

## Glosario rápido

- **Liga:** grupo con un ranking mensual.
- **Punto:** registro de “he hecho deporte X” (pendiente de verificación).
- **Verificación:** acción de admins para aceptar/rechazar puntos.

## Decisiones de producto (v1)

- Las ligas son **mensuales** a nivel de ranking. (Los “puntos” reales aún están por implementar.)
- En v1, una liga tiene:
  - `visibility`: `public` | `private`
  - `code`: código para unirte (sirve para privadas y también para públicas)
  - `dailyPointsLimit`: límite diario (campo ya creado en ligas; se aplicará cuando existan puntos)
- La verificación de puntos es el mecanismo “anti-trampas”: un admin valida lo que reporta un miembro.
