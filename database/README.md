# Capa de datos de SIGREC

Esta carpeta contiene el diseño Oracle y su [visor del modelo entidad-relación](modelo-er/README.md).

- [SPEC 045: migración del vínculo a unidad orgánica](scripts/045-unidad-organica-centro.sql). El responsable de Oracle debe confirmar la clave referenciada y aplicar el DDL en el esquema de SIGREC antes de desplegar el backend. El script no modifica `TGUNIDADORGANICA`.
- [SPEC 051: elementos de infraestructura por ficha](scripts/051-elementos-infraestructura-por-ficha.sql); copia oficial en `sigeif_ssi_inabif_plsql/plsql_scripts/sigrec/dml/003_elementos_infraestructura_por_ficha_update.sql`. Orden: arrancar el backend con `SIGREC_DDL_AUTO=update` (Hibernate crea `ICONO`), ejecutar el script como `USRSEGURIDAD` y volver a `validate`. El script es idempotente; Oracle confirma implícitamente los cambios DDL, por lo que se recomienda un respaldo previo de `SGR_ELEMENTO`.
