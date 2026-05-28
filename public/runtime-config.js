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
};
