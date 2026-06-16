# NEXO. Sistema de Gestión Comercial

![Node 22](https://img.shields.io/badge/Node-22-339933)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E)
![React](https://img.shields.io/badge/React-19-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000)
![Railway](https://img.shields.io/badge/Backend-Railway-5B35D5)

Aplicación fullstack para gestión comercial: login, productos, órdenes de compra, ingreso de mercadería, facturación y despacho. Incluye diseño liquid-glass con paleta naranja neón, modo claro/oscuro persistente, stock transaccional, Swagger, pruebas automatizadas y despliegue Vercel/Railway.

## Entrega

| Entregable | Ubicación |
|---|---|
| Código fuente | [github.com/bluexdev/nexo-gestion-comercial](https://github.com/bluexdev/nexo-gestion-comercial) |
| Frontend Vercel | [nexo-gestion-comercial.vercel.app](https://nexo-gestion-comercial.vercel.app) |
| Backend Railway | [backend-production-05fcc.up.railway.app](https://backend-production-05fcc.up.railway.app) |
| Swagger público | [backend-production-05fcc.up.railway.app/api/docs](https://backend-production-05fcc.up.railway.app/api/docs) |
| API pública | [backend-production-05fcc.up.railway.app/api](https://backend-production-05fcc.up.railway.app/api) |
| Script de base de datos | [`database/database.sql`](database/database.sql) |
| Arquitectura | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Zustand, React Hook Form, Zod, Axios |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16, JWT, Swagger |
| Infraestructura | Docker Compose, Nginx, Vercel, Railway, GitHub Actions |
| Calidad | Vitest, Testing Library, Supertest, ESLint, migraciones Prisma |

## Quickstart

```bash
copy .env.example .env
docker compose up --build
```

| Servicio | URL local |
|---|---|
| Aplicación | `http://localhost:8080` |
| Frontend directo | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/api/docs` |
| pgAdmin opcional | `docker compose --profile tools up` y abrir `http://localhost:5050` |

Credenciales de desarrollo:

| Rol | Usuario | Contraseña |
|---|---|---|
| ADMIN | `admin@nexo.local` | `Admin123!` |
| OPERATOR | `operador@nexo.local` | `Operator123!` |

## Comandos

```bash
npm ci
npm run build
npm run test
npm run lint
```

## Documentación

| Documento | Propósito |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura, capas, despliegue Vercel/Railway y decisiones técnicas |
| [`docs/API.md`](docs/API.md) | Contratos principales, filtros, errores y ejemplos |
| [`docs/SUPUESTOS.md`](docs/SUPUESTOS.md) | Supuestos trazables `[SUPUESTO-N]` |
| [`docs/AUDITORIA_PROMPT.md`](docs/AUDITORIA_PROMPT.md) | Revisión punto por punto contra el prompt maestro |
| [`database/README.md`](database/README.md) | Uso de scripts SQL y relación con migraciones Prisma |

## Capturas

| Vista | Captura |
|---|---|
| Login oscuro | ![Login oscuro](docs/screenshots/login-dark.png) |
| Dashboard oscuro | ![Dashboard oscuro](docs/screenshots/dashboard-dark.png) |
| Dashboard claro | ![Dashboard claro](docs/screenshots/dashboard-light.png) |
| Productos | ![Maestro de productos](docs/screenshots/products-dark.png) |
| Selector buscable corregido | ![Selector buscable sin recorte](docs/screenshots/search-select-fixed-desktop.png) |
| Responsive móvil | ![Dashboard móvil](docs/screenshots/dashboard-mobile-dark.png) |

## Producción

El frontend está publicado en Vercel y el backend en Railway con PostgreSQL administrado. No se incluyen credenciales ni secretos reales en el repositorio.

| Punto | Configuración |
|---|---|
| Repositorio público | `https://github.com/bluexdev/nexo-gestion-comercial` |
| Conexión Vercel -> GitHub | Proyecto Vercel conectado a `bluexdev/nexo-gestion-comercial` para despliegues desde Git |
| SPA -> API | `/api/*` se reescribe desde Vercel hacia Railway para evitar fricción de CORS en navegador |
| Validación de conexión | `/api` rewrite, cookie `HttpOnly/Secure/SameSite=None` y access token en respuesta |

Variables de Vercel:

```bash
VITE_API_URL=/api
```

Variables del backend:

```bash
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<secret-32-plus-chars>
JWT_REFRESH_SECRET=<secret-32-plus-chars>
CORS_ORIGIN=https://nexo-gestion-comercial.vercel.app,https://frontend-chi-ten-11.vercel.app
NODE_ENV=production
```

## Base de Datos

`database/database.sql` contiene DDL PostgreSQL y seed idempotente para revisión. También se entregan `database/schema.sql` y `database/seed.sql` por separado. Las migraciones oficiales usadas por la aplicación están en `backend/prisma/migrations`.
