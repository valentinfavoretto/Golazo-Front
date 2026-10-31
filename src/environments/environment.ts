// Ambiente de DESARROLLO (ng serve).
// '/api' lo redirige al backend (puerto 3000) el proxy de proxy.conf.json,
// así el navegador ve un único origen y no hace falta CORS en el backend.
export const environment = {
  production: false,
  apiUrl: '/api',
};
