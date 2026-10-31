// Ambiente de PRODUCCIÓN (ng build --configuration production).
// Angular reemplaza environment.ts por este archivo durante el build.
// Si el frontend se sirve desde un servidor distinto al backend, usar la URL
// completa (ej: 'https://api.miapp.com/api') y habilitar CORS en el backend,
// o configurar el servidor web (Nginx) para reenviar /api al backend.
export const environment = {
  production: true,
  apiUrl: '/api',
};
