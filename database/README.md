# Capa de datos de SIGREC

Esta carpeta contiene el diseño Oracle y su [visor del modelo entidad-relación](modelo-er/README.md).

- [SPEC 045: migración del vínculo a unidad orgánica](scripts/045-unidad-organica-centro.sql). El responsable de Oracle debe confirmar la clave referenciada y aplicar el DDL en el esquema de SIGREC antes de desplegar el backend. El script no modifica `TGUNIDADORGANICA`.
