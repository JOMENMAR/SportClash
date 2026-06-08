// Configuración runtime (NO se procesa por Vite).
// Útil para cambiar endpoints en despliegue sin recompilar el frontend.
//
// En local: normalmente basta con `.env`.
// En producción: puedes editar este archivo en tu hosting (S3/CloudFront, nginx, etc.)
// para apuntar al API Gateway correcto.
//
// Valores vacíos => el frontend usará (en DEV) un fallback a `/api` con proxy de Vite.
// En build/producción sin valores, algunas pantallas que llamen a AWS mostrarán error.
window.__SPORTCLASH_CONFIG__ = {
  AWS_API_BASE_URL: "",
  AWS_WS_URL: "",

  // Cognito Hosted UI (valores públicos, NO secretos)
  // Ejemplo de dominio: https://tu-dominio.auth.eu-north-1.amazoncognito.com
  COGNITO_DOMAIN: "",
  COGNITO_CLIENT_ID: "",
  // Normalmente el redirect es el origen de tu web (Vercel) o / si usas SPA.
  COGNITO_REDIRECT_URI: "",
  COGNITO_LOGOUT_URI: "",
  // scope por defecto: openid email profile
  COGNITO_SCOPES: "openid email profile",
  // (Opcional) nombres de IdP para mostrar botones sociales en la UI.
  COGNITO_IDP_MICROSOFT: "",
  COGNITO_IDP_GOOGLE: "",
  COGNITO_IDP_DISCORD: "",
};
