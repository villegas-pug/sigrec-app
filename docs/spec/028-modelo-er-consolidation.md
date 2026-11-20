# SPEC 028 — Simplificación del modelo ER y trazabilidad patrimonial

## Alcance

Reducir el contrato Oracle de 44 a 42 tablas desde la versión 3.0.0. Esta especificación actualiza la decisión de la SPEC 027 sobre la reposición y conserva la tabla compartida de bienes implicados. El visor sigue leyendo el mismo formato de JSON. La implementación del modelo se limita a `docs/modelo-er/`.

## Diseño

| Cambio | Correspondencia y regla de integridad |
| --- | --- |
| Novedades e incidencias | `SGR_INCIDENTE.CLASE` distingue `NOVEDAD` e `INCIDENCIA`. `ambientes[].novedades` conserva fecha, tipo, texto de ubicación y evaluación. Una novedad tiene origen ambiente y cero bienes afectados. La incidencia conserva su alcance, contexto histórico y reglas según el origen. `SGR_ATENCION` apunta a un solo hecho y admite una atención vigente por hecho. |
| Combustible | `SGR_COMBUSTIBLE` reúne código, fecha, litros, sustento y autor de cargas y consumos. Un `CHECK` exige vehículo para `CARGA` y ejecución para `CONSUMO`, con referencias excluyentes. El vehículo del consumo se deriva del itinerario. Una clave permanente conserva el código al corregir y un índice único funcional admite un solo consumo vigente por ejecución. |
| Periodicidad | `CANT_MES_PERIODICIDAD` en servicio y período admite exclusivamente 1, 2, 3, 4, 6 o 12 meses. El período conserva el valor informado y limita su ordinal a `12 / CANT_MES_PERIODICIDAD`. La clave de período mantiene servicio, año, periodicidad informada y ordinal. |
| Reposición | `SGR_REPOSICION` vuelve a registrar un hecho auditable por operación, con baja de origen, fecha, detalle y bien de reemplazo. Su unicidad por vigencia permite una nueva reposición después de revertir la anterior. Las filas `REASIGNADO` de `SGR_BIEN_IMPLICADO` conservan los componentes de cada reposición, incluso si esta se anula. |

Las validaciones de origen, ámbito, permisología, relación histórica y vigencia entre filas se documentan como transaccionales. La consolidación preserva los filtros por clase y por tipo. El indicador de novedades abiertas incluye novedades vigentes sin atención. La consulta de infraestructura en evaluación exige además el indicador de evaluación. La consulta de anulados conserva fecha, detalle, reemplazo y componentes de una reposición revertida.

Las correcciones de combustible mantienen código y actor original. Si cambia el tipo o la ejecución, se valida el vehículo del ámbito y se aplican todas las modificaciones de forma atómica. El historial de precios, los períodos frente a sus hechos editables, la ruta frente a las paradas y la ejecución frente al itinerario mantienen sus propios registros y dependencias.

## Acceptance

- El contrato identifica 42 tablas, conserva los siete módulos y enlaza los procesos existentes con sus tablas vigentes.
- Las FK apuntan a claves válidas y están cubiertas por índices. Los `CHECK` por clase y rol controlan las columnas aplicables y la unicidad por vigencia permite conservar antecedentes.
- Una novedad con texto de ubicación y atención sigue disponible en su ficha. Un incidente en el mismo ambiente puede tener bienes con decisiones individuales.
- Una carga y un consumo del mismo vehículo siguen siendo distinguibles. Un segundo consumo vigente de una ejecución se rechaza; después de anular el primero se permite un nuevo registro.
- Cambiar una periodicidad habilitada conserva la interpretación de los hechos de períodos anteriores. Un período bimestral admite ordinales 1 a 6.
- Revertir una reposición conserva el hecho anulado y sus componentes, restaura la revisión pendiente de los componentes devueltos y permite una nueva reposición. Revertir la baja sigue exigiendo que ya no exista reposición vigente.
- La verificación de esta etapa es estática sobre el JSON y el diff. Los escenarios de Oracle y navegador quedan definidos para una ejecución autorizada.
