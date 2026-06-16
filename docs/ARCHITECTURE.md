# Arquitectura

## Diagrama

```text
 Navegador React/Vite
        |
        | HTTPS / JSON / JWT access
        v
 Vercel o Nginx --------> NestJS / Railway
                              |
                              | Prisma + transacciones serializables
                              v
                         PostgreSQL

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

- Railway: crear PostgreSQL, desplegar el backend con `backend/Dockerfile` y definir las variables de `backend/.env.example`.
- Vercel: importar el monorepo, usar `vercel.json` y definir `VITE_API_URL=https://<backend>/api`.
- Configurar `CORS_ORIGIN` con el dominio exacto de Vercel y secretos JWT de al menos 32 caracteres.
- Las migraciones y el seed se ejecutan al arrancar la imagen backend.
