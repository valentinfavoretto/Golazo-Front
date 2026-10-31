# GOLAZO · Frontend (Angular)

Frontend de la **Football API** (UTN FRVT). Aplicación SPA hecha con **Angular + TypeScript**, que consume el backend Node/Express/MongoDB.
Pantallas: partidos del día (ayer / hoy / mañana / en vivo), tabla de posiciones y fixture por liga,
detalle de partido con eventos, búsqueda de equipos, login y registro, favoritos, predicciones y panel de administración.

## Requisitos

| Qué | Versión | Para qué |
|-----|---------|----------|
| Node.js + npm | **22.12 o superior** (o 20.19+ / 24 LTS) | Correr el backend y el frontend |
| Docker Desktop (o Podman) | cualquiera reciente | Levantar MongoDB |
| API key de API-Football | gratis en <https://dashboard.api-football.com> | Datos reales de partidos |

Comprobar versiones: `node -v` y `npm -v`.

## Puesta en marcha (3 terminales)

### 1) MongoDB — carpeta del backend
```bash
docker compose up -d        # con Podman: podman compose up -d
```
Levanta Mongo en `localhost:27017` (usuario `root`, clave `example`, ya configurado en el `.env.example` del backend).

### 2) Backend — carpeta del backend
```bash
npm install
cp .env.example .env        # en Windows (cmd): copy .env.example .env
# editar .env y pegar tu API_FOOTBALL_KEY
npm run dev
```
Debe mostrar `MongoDB conectado` y `Servidor corriendo en http://localhost:3000`.
Al arrancar crea el admin por defecto (`ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`; por defecto `admin@football.com` / `admin1234`).

### 3) Frontend — esta carpeta
```bash
npm install
npm start
```
Abrir **http://localhost:4200**.

> El backend tiene que estar corriendo en el puerto **3000**. Si usás otro puerto, cambialo en `proxy.conf.json`.

## ¿Por qué no hay que tocar el backend?

El backend no tiene CORS. En desarrollo, `ng serve` usa `proxy.conf.json` para reenviar todo lo que empieza con `/api`
a `http://localhost:3000`. Para el navegador todo viene del mismo origen (`localhost:4200`) y no hay errores de CORS.
La URL base de la API vive en `src/environments/` (`environment.ts` para desarrollo, `environment.prod.ts` para producción).

## Pantallas y endpoints que usa cada una

| Pantalla (ruta) | Endpoints del backend |
|-----------------|-----------------------|
| Inicio `/` (ayer/hoy/mañana, en vivo) | `GET /api/matches/today`, `GET /api/matches?date=`, `GET /api/matches/live` |
| Liga `/liga/:id` — Posiciones | `GET /api/standings?league=` |
| Liga — Partidos de hoy | `GET /api/matches/competition/:id` |
| Liga — Fixture | `GET /api/competitions/:id/fixtures` |
| Partido `/partido/:id` | `GET /api/matches/:id/detail`, `POST/DELETE /api/users/favorites/matches/:id`, `POST /api/users/predictions`, `PUT/DELETE /api/matches/:id` (admin) |
| Equipos `/equipos` | `GET /api/teams/search?name=`, `POST/DELETE /api/users/favorites/teams` |
| Login / Registro | `POST /api/users/login`, `POST /api/users/register` |
| Perfil `/perfil` | `GET /api/users/me`, `GET /api/users/predictions`, `POST /api/users/logout` |
| Admin `/admin` | `GET /api/users`, `GET /api/users/find/:username`, `PUT /api/users/:username/role`, `PUT /api/users/:username/unlock`, `DELETE /api/users/:username`, `GET /api/matches/all`, `DELETE /api/matches/:id` |

Endpoints del backend que **no** se usan a propósito:
- `GET /api/matches/status/:status` — el filtro por estado se hace en el navegador. Ese endpoint consulta API-Football
  por cada partido finalizado sin eventos y gasta muchas requests de la cuota gratuita (100 por día).
- `GET /api/competitions?country=` — el menú lateral usa la lista fija de las 8 competiciones habilitadas.

## Estructura del proyecto (y su relación con la teoría)

```
src/
├── environments/           environment.ts / environment.prod.ts   (ambientes)
├── main.ts                 arranque de la app + locale es-AR
├── styles.css              estilos globales
└── app/
    ├── app.config.ts       providers: router, HttpClient, interceptor
    ├── app.routes.ts       enrutamiento (páginas con lazy loading → chunk-[hash].js)
    ├── app.component.*     shell: header + sidebar + <router-outlet>
    ├── core/
    │   ├── models/         interfaces TypeScript (Match, User, StandingRow…)
    │   ├── services/       servicios inyectables (HTTP al backend, sesión, favoritos…)
    │   ├── interceptors/   agrega el token JWT a cada petición
    │   ├── guards/         protegen /perfil y /admin
    │   └── utils/          fechas, ligas, mensajes de error
    ├── shared/
    │   ├── header/ sidebar/ match-row/   componentes reutilizables
    │   ├── pipes/          matchStatus  (pipe propio)
    │   └── directives/     appImgFallback (directiva propia)
    └── pages/              home, league, match-detail, teams, login, register, profile, admin
```

Conceptos de la cursada que aparecen en el código: componentes standalone, plantillas con `@if` / `@for`,
data binding (interpolación, property, event y two-way con `ngModel`), pipes (`date`, propio `matchStatus`),
directiva de atributo, servicios + inyección de dependencias, Angular Router, interceptor HTTP, guards,
signals y RxJS (`Observable`, `pipe`, `map`, `tap`, `catchError`).

## Sesión y seguridad

- Al loguearse, el token JWT se guarda en `localStorage` y el interceptor lo manda en cada petición (`Authorization: Bearer …`),
  porque HTTP es *stateless*.
- Si el servidor responde 401, se cierra la sesión local y se redirige al login.
- Los guards `authGuard` y `adminGuard` bloquean `/perfil` y `/admin`. Es solo comodidad de interfaz: la seguridad real la aplica el backend.

## Build de producción

```bash
npm run build
```
Genera `dist/football-front/browser/` con archivos estáticos (`index.html`, `main-[hash].js`, `chunk-[hash].js`, `styles-[hash].css`).
Hay que servirlos con cualquier servidor HTTP que haga *fallback* a `index.html` (para que refrescar `/liga/39` no dé 404)
y que reenvíe `/api` al backend (o habilitar CORS en el backend y poner la URL completa en `environment.prod.ts`).

## Cosas a tener en cuenta

- **Cuota de API-Football:** el plan gratuito permite ~100 requests por día. Cada vez que se carga un día, una liga o el fixture, el backend consulta a API-Football.
  El refresco automático (cada 2 minutos) solo se activa cuando hay partidos en vivo en "Hoy".
- **Fechas en UTC:** el backend arma "ayer / hoy / mañana" en UTC. Un partido jugado a las 22:00 en Argentina (01:00 UTC) puede aparecer en el día siguiente.
  Las horas se muestran en la zona horaria del navegador.
- **Rutas sin protección en el backend:** `PUT /api/matches/:id`, `DELETE /api/matches/:id` y `GET /api/matches/all` no exigen token en el backend actual.
  El frontend solo las muestra a admins, pero cualquiera con `curl` podría llamarlas. Conviene agregar `authenticate, requireAdmin` en `match.routes.ts`.
- Si cambia la whitelist de competiciones del backend (`src/utils/leagueWhitelist.ts`), actualizar también `src/app/core/utils/leagues.ts`.

## Problemas comunes

| Síntoma | Solución |
|---------|----------|
| `ECONNREFUSED` en la consola de `npm start` / "No se pudo conectar con el servidor" | El backend no está corriendo en el puerto 3000. |
| El backend dice `MongoServerSelectionError` | MongoDB no está levantado: `docker compose up -d` en la carpeta del backend. |
| "API key inválida" o "Límite de requests alcanzado" | Revisar `API_FOOTBALL_KEY` en el `.env` del backend o esperar al día siguiente. |
| `npm install` falla con errores de `engine` | Actualizar Node.js (mínimo 22.12). |
| "Cuenta bloqueada" | 5 intentos fallidos bloquean 30 min. Un admin puede desbloquear desde `/admin`. |
| Puerto 4200 ocupado | `npx ng serve --port 4300` |
