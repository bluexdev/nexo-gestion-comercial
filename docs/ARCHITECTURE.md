# Arquitectura

## Diagrama

```text
 Producción:
 Navegador -> Vercel (React/Vite SPA)
        |
        | HTTPS / JSON / JWT access + refresh cookie
        v
 Railway (NestJS API)
        |
        | Prisma + transacciones serializables
        v
 Railway PostgreSQL

 Local: Nginx :8080 -> frontend :80
                    -> backend :3000 -> postgres :5432
                                      -> pgAdmin :5050 (perfil tools)
```

## Decisiones

- Backend modular NestJS: cada dominio posee controlador y servicio; Prisma centraliza acceso a datos.
- JWT access de 15 minutos y refresh de 7 días en cookie `HttpOnly`; el frontend conserva el access token solo en memoria.
- Respuestas exitosas normalizadas por interceptor y errores por filtro global.
- Operaciones que modifican stock o correlativos se ejecutan con aislamiento `Serializable` y reintento de conflictos `P2034`.
- React Router protege el layout; Zustand conserva sesión; Axios coordina una sola renovación ante múltiples respuestas 401.
- Tailwind consume variables CSS para compartir el mismo sistema visual entre temas claro y oscuro.

## Desarrollo local

1. Copiar `.env.example` a `.env`.
2. Ejecutar `docker compose up --build`.
3. Abrir `http://localhost:8080`.
4. Swagger: `http://localhost:3000/api/docs`.
5. pgAdmin opcional: `docker compose --profile tools up`.

Si `8080` está ocupado, definir `NGINX_PORT=8088` en `.env`.

Credenciales seed:

- `admin@nexo.local` / `Admin123!`
- `operador@nexo.local` / `Operator123!`

## Despliegue

- Frontend: Vercel aloja exclusivamente la SPA React/Vite. La URL publicada actual es `https://frontend-chi-ten-11.vercel.app`.
- Backend: Railway aloja la API NestJS en `https://backend-production-05fcc.up.railway.app` y usa un servicio PostgreSQL administrado.
- Vercel define `VITE_API_URL=https://backend-production-05fcc.up.railway.app/api`.
- Railway debe definir `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production` y `CORS_ORIGIN=https://frontend-chi-ten-11.vercel.app`.
- La cookie de refresh se emite como `HttpOnly`, `Secure` y `SameSite=None` en producción para permitir el consumo cross-site Vercel -> Railway.
- Las migraciones y el seed se ejecutan al arrancar la imagen backend.
- Swagger público: `https://backend-production-05fcc.up.railway.app/api/docs`.
