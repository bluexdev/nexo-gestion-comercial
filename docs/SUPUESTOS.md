# Supuestos

[SUPUESTO-1] El nombre comercial no fue definido → Se usa `NEXO.` y se mantiene centralizado en la interfaz → Permite una identidad visual consistente sin alterar procesos.

[SUPUESTO-2] Las sesiones refresh requieren invalidación → Se persiste únicamente SHA-256 del token, se rota en cada refresh y se revoca al cerrar sesión → Evita almacenar credenciales reutilizables en texto plano.

[SUPUESTO-3] Los correlativos pueden crearse concurrentemente → Se usa una tabla `Sequence` dentro de transacciones serializables con reintentos → Evita números `OC-*` y `F-*` duplicados.

[SUPUESTO-4] Una recepción debe identificar la línea original → `MerchandiseReceiptDetail` referencia `PurchaseOrderDetail` además del producto → Conserva trazabilidad y evita aplicar cantidades a otra orden.

[SUPUESTO-5] Una orden parcial puede cancelarse → Se conserva el stock ya recibido y se impiden recepciones nuevas → La mercadería ingresada representa un hecho físico que no debe revertirse.

[SUPUESTO-6] La cancelación de factura restaura inventario → Solo aplica una vez a estados `ISSUED` o `PAID` y se rechaza si existe despacho → Evita doble reposición y contradicciones logísticas.

[SUPUESTO-7] Un despacho retornado no repone stock automáticamente → El estado describe transporte, no recepción validada en almacén → Una devolución comercial queda fuera del alcance solicitado.

[SUPUESTO-8] Los importes requieren precisión decimal → Backend calcula con `Prisma.Decimal`; frontend solo presenta estimaciones y el backend es autoritativo → Evita errores binarios y manipulación del cliente.

[SUPUESTO-9] Zona horaria y formato regional → Se usa `America/Lima`, `es-PE` y PEN → Corresponde al IGV peruano del 18% indicado.

[SUPUESTO-10] El seed debe poder repetirse → Se basa en `upsert` y claves de negocio estables → Facilita `docker compose up` y ambientes efímeros.

[SUPUESTO-11] El despliegue real requiere sesiones externas autorizadas → Frontend y backend fueron publicados tras autenticar Vercel/Railway en CLI; los secretos quedan en las plataformas y no en el repositorio → GitHub sigue requiriendo un remoto o credenciales de la cuenta destino para publicar el código fuente.

[SUPUESTO-12] El puerto local 8080 ya pertenece a otro contenedor → Compose admite `NGINX_PORT` y la validación se ejecuta en 8088 sin detener servicios ajenos → Mantiene 8080 como valor estándar y evita afectar otro proyecto.

[SUPUESTO-13] Dos refresh JWT emitidos dentro del mismo segundo pueden compartir claims temporales → Cada refresh incorpora un `jti` UUID antes de guardar su hash → Garantiza rotación única incluso bajo solicitudes inmediatas o concurrentes.
