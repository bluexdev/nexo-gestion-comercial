# Scripts de base de datos

- `database.sql`: script completo de entrega con DDL PostgreSQL + seed idempotente.
- `schema.sql`: DDL PostgreSQL inicial generado desde la migración Prisma. Crea tipos, tablas, índices y claves foráneas.
- `seed.sql`: datos iniciales SQL idempotentes con usuarios, catálogos base y secuencias.

Orden de ejecución manual:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

Ejecución en un solo archivo:

```bash
psql "$DATABASE_URL" -f database/database.sql
```

En la aplicación, la ruta oficial sigue siendo Prisma:

```bash
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
```
