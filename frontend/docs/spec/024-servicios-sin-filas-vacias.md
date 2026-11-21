# SPEC 024 — Servicios registrados sin filas vacías

- **Fecha:** 2026-11-11
- **Estado:** Implementado después de especificar el contrato; revisión estática completada. Sustituye la presentación de tipos faltantes de SPEC 021.

## Contract

- Mostrar solo servicios registrados en tabla y tarjetas. Conservar Luz como muestra y todos los datos del usuario.
- Eliminar filas/tarjetas de tipos no registrados. Mantener esos tipos y sus validaciones en el formulario de alta.
- Sin servicios visibles, mostrar un único estado vacío y acceso de registro según permisos y disponibilidad de tipos.
- Conservar períodos, avisos, año, selección y tratamiento de anulados.

## Validation

- Revisión estática inicialmente; revisión funcional de centros vacíos, altas, anulaciones, permisos y tipos agotados pendiente de autorización.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.

- Revisión estática conjunta de diez archivos: JavaScript, estructura Vue, expresiones de plantilla, estilos, imports y exports locales, sin errores. `git diff --check` sin errores. No se ejecutó ni compiló la aplicación.
- Validación visual y funcional pendiente de autorización explícita.
