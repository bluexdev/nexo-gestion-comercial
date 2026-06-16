# Auditoría contra el prompt maestro

Fecha de revisión: 15 de junio de 2026.

Leyenda: `CUMPLE`, `CORREGIDO` o `PENDIENTE`.

## Sistema de diseño

| Requisito | Estado | Evidencia / observación |
|---|---|---|
| Paleta naranja `#FF6B00` y tokens claro/oscuro | CUMPLE | Variables globales en `frontend/src/styles.css` y tokens Tailwind. |
| Tema persistente y preferencia del sistema | CUMPLE | `ThemeProvider`, `localStorage` y `prefers-color-scheme`. |
| Anton, Condiment y monospace | CUMPLE | Google Fonts en `index.html` y familias Tailwind. |
| Liquid glass y grain overlay | CUMPLE | Clases globales y `GrainOverlay` fijo. |
| Sidebar 240 px, topbar 64 px, contenido responsive | CUMPLE | Layout desktop y drawer móvil verificados visualmente. |
| Componentes reutilizables solicitados | CUMPLE | DataTable, badges, drawers, modal, selector, métricas, header, Sonner, navegación y grain. |
| SearchSelect sin recorte dentro de cards/drawers | CORREGIDO | Dropdown mediante portal fijo al `body`, reposicionamiento y scroll; prueba y captura agregadas. |
| Overlay de ConfirmModal distinto por tema | CORREGIDO | 0.6 en oscuro y 0.3 en claro; bloqueo de scroll y Escape. |
| Error de login como badge liquid-glass | CORREGIDO | Mensaje inline accesible, además del toast. |
| Stock como badge de color | CORREGIDO | Badge naranja con stock y rojo cuando es cero. |
| Detalle de OC y factura en modal centrado | PENDIENTE | Actualmente se muestra en `FormDrawer`; es funcional, pero no respeta literalmente “modal”. |

## Backend y datos

| Requisito | Estado | Evidencia / observación |
|---|---|---|
| NestJS, Prisma y PostgreSQL | CUMPLE | Arquitectura modular y migración inicial. |
| JWT access 15 min + refresh 7 días | CUMPLE | Refresh en cookie HttpOnly, hashes persistidos y revocación. |
| Rotación refresh inmediata y única | CORREGIDO | Se añadió `jti` UUID; la E2E cubre refresh en el mismo segundo. |
| Guards JWT y roles | CORREGIDO | `RolesGuard` registrado globalmente; `/users` restringido a ADMIN. |
| Swagger `/api/docs`, validación y filtro global | CUMPLE | Bootstrap global configurado. |
| Envelope normal y paginado | CUMPLE | Interceptor y helper de paginación. |
| CRUD productos, proveedores y clientes con soft delete | CUMPLE | Endpoints protegidos y filtro activo. |
| Correlativos OC/F transaccionales | CUMPLE | Tabla `Sequence`, aislamiento serializable y reintento. |
| Seed idempotente sin retroceder correlativos | CORREGIDO | El seed ya no sobrescribe secuencias superiores y fue ejecutado dos veces. |
| Recepción atómica y validación de pendientes | CUMPLE | Actualiza detalle, stock y estado dentro de una transacción. |
| Facturación con Decimal, IGV y stock atómico | CUMPLE | Consolida productos, valida activos/stock y calcula en backend. |
| Filtro `ISSUED,PAID` | CORREGIDO | Facturas aceptan estados separados por coma. |
| Cancelación de factura segura | CUMPLE | Solo ISSUED/PAID, sin despacho y restauración única. |
| Despacho único y transiciones válidas | CUMPLE | Restricción única por factura y máquina de estados. |
| Búsqueda real de despachos | CORREGIDO | Filtra tracking, transportista, factura y cliente. |
| Dashboard agregado con día de Lima | CORREGIDO | Límite diario calculado para `America/Lima`. |
| Swagger con contratos y ejemplos exhaustivos | PENDIENTE | La ruta funciona, pero faltan decoradores `ApiProperty`/respuestas en la mayoría de DTOs. |
| Administración completa de usuarios | PENDIENTE | Existe listado ADMIN; no hay alta, edición, baja ni pantalla, aunque el prompt funcional no define esos endpoints. |

## Frontend funcional

| Requisito | Estado | Evidencia / observación |
|---|---|---|
| Login, dashboard y cinco áreas comerciales | CUMPLE | Todas las rutas están implementadas y protegidas. |
| Zustand y Axios con cola de refresh | CUMPLE | Un único `refreshPromise` coordina respuestas 401. |
| Productos: crear, editar y desactivar | CUMPLE | Drawer, Zod y confirmación. |
| OC: crear, listar, detalle y cancelar | CUMPLE | Flujo operativo disponible. |
| Editar OC pendiente desde la UI | PENDIENTE | Backend soporta `PATCH`, pero la pantalla no expone edición. |
| Recepción parcial/completa | CUMPLE | Selector filtrado, cantidades máximas y resumen. |
| Facturación y cliente inline | CUMPLE | Líneas dinámicas, totales y cancelación. |
| Marcar factura como pagada desde UI | PENDIENTE | Endpoint existe, pero no hay acción visual. Es una ampliación del plan, no del prompt maestro original. |
| Despacho y transiciones rápidas | CUMPLE | Selector de facturas y actualización inline. |
| Filtros y ordenamiento de tablas | CUMPLE | Productos, OC, facturas y despachos filtran por estado/actividad y ordenan en servidor desde encabezados. |
| Selectores nativos inconsistentes | CORREGIDO | Tipo de documento y estado de despacho usan `SelectMenu` con portal, temas y estados deshabilitados accesibles. |
| React Hook Form + Zod en todos los formularios | PENDIENTE | Login/productos usan ambos; OC, factura y despacho usan RHF sin Zod; recepción y cliente inline usan estado local. |
| Estados loading/vacío/error homogéneos | PENDIENTE | DataTable cubre loading/vacío; faltan paneles de error y loading explícito en algunas páginas. |
| Accesibilidad básica de overlays | CUMPLE | ARIA, Escape, bloqueo de scroll y focus visible. Falta focus trap completo. |

## Infraestructura, pruebas y documentación

| Requisito | Estado | Evidencia / observación |
|---|---|---|
| Dockerfiles multistage, Compose, PostgreSQL, pgAdmin y Nginx | CUMPLE | Stack completo y pgAdmin bajo perfil `tools`. |
| Healthchecks del stack principal | CORREGIDO | PostgreSQL, backend, frontend y Nginx tienen healthcheck. |
| `.env.example` raíz y por aplicación | CORREGIDO | Se agregó `frontend/.env.example`; backend y raíz ya existían. |
| GitHub Actions lint → test → build | CORREGIDO | CI incorpora PostgreSQL, migración, seed y E2E antes del build. |
| Railway y Vercel deployment-ready | CUMPLE | Configuraciones presentes; deploy real bloqueado por credenciales externas. |
| Unit tests backend y frontend críticos | CUMPLE PARCIAL | Auth/productos/facturas y tema/badge/selector cubiertos. |
| Integración Supertest del flujo completo | CORREGIDO | Login-refresh-logout y producto→OC→recepción→factura→despacho. |
| Pruebas específicas de concurrencia | PENDIENTE | La lógica usa Serializable/reintento, pero faltan pruebas paralelas de correlativos, sobre-recepción y doble cancelación. |
| Pruebas frontend de ruta protegida, cola refresh y formularios | PENDIENTE | No existen todavía pruebas dedicadas para esos casos. |
| Compose separado desarrollo/producción | PENDIENTE | Hay un Compose único configurable; el plan ampliado solicitó archivos separados. |
| README, arquitectura, API y supuestos | CUMPLE | Documentación existente y supuestos numerados. |
| Capturas de todos los módulos en ambos temas | PENDIENTE | Hay login/dashboard/productos y selector; faltan OC, recepción, facturación y despacho en claro/oscuro. |
| URLs reales de producción | BLOQUEO EXTERNO | Requiere cuentas/sesiones de Railway y Vercel y repositorio remoto. |

## Resultado

El sistema es operable de extremo a extremo y las brechas de integridad descubiertas en esta revisión fueron corregidas. Antes de un deploy de aceptación estricta quedan pendientes principalmente cobertura adicional, fidelidad literal de algunos modales/formularios y el paquete completo de capturas. No se realizó despliegue cloud.
