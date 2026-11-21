# Manual audiovisual de SIGREC

Los capítulos de `v1/` se sirven con la aplicación. El catálogo generado `src/config/manual.js` contiene sus duraciones medidas, temas de búsqueda y enlaces. Cada MP4 incluye subtítulos para descarga; la pantalla web utiliza su archivo WebVTT en español.

## Actualización local

Ejecutar los comandos desde `frontend/`.

1. Ajustar los guiones versionados de `scripts/manual/scenarios/` y actualizar la matriz de cobertura.
2. Con una instancia de SIGREC ya iniciada, ejecutar `node scripts/manual-record.mjs`. La grabación utiliza datos ficticios en un navegador independiente.
3. Ejecutar `./scripts/manual-publish-local.ps1` en PowerShell para preparar la voz, codificar y ensamblar los medios. El comando escribe los capítulos en `public/manual/v1/` y actualiza el catálogo de la SPA y el índice de demostraciones.
4. Revisar visualmente los capítulos, subtítulos y contornos antes de subir cambios a GitHub.

La producción requiere Playwright CLI y FFmpeg/ffprobe. Los binarios de FFmpeg pueden estar en `SIGREC_MEDIA_BIN`, en la copia local de herramientas o en `PATH`. La narración usa la voz española Microsoft Sabina Desktop de Windows. No se inicia el servidor ni se ejecuta un build automáticamente. La grabación, el maestro y las herramientas locales se conservan en `frontend/artifacts/manual-usuario/`.

Los archivos de video deben permanecer por debajo de 100 MiB. Una nueva grabación puede cambiar las duraciones: el catálogo y los subtítulos deben generarse junto con los MP4, no editarse manualmente. El usuario debe autorizar por separado commits, push y publicación externa.

La documentación del frontend incluye la [cobertura](../../docs/manual-coverage.md), el [índice de demostraciones](../../docs/manual-demonstrations.md) y la [revisión local](../../docs/manual-validation.md).
