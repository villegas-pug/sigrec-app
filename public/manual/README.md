# Manual audiovisual de SIGREC

Los capítulos de `v1/` se sirven con la aplicación. El catálogo generado `src/config/manual.js` contiene sus duraciones medidas, temas de búsqueda y enlaces. Cada MP4 incluye subtítulos para descarga; la pantalla web utiliza su archivo WebVTT en español.

## Actualización local

1. Ajustar los guiones versionados de `scripts/manual/scenarios/` y actualizar la matriz de cobertura.
2. Con una instancia de SIGREC ya iniciada, ejecutar `node scripts/manual-record.mjs`. La grabación utiliza datos ficticios en un navegador independiente.
3. Ejecutar `scripts/manual-publish-local.ps1` en PowerShell para preparar voz, codificar y ensamblar los medios. Este comando publica únicamente en la carpeta local `public/manual/v1/`.
4. Revisar visualmente los capítulos, subtítulos y contornos antes de subir cambios a GitHub.

La producción requiere Playwright CLI y FFmpeg/ffprobe en PATH o en `SIGREC_MEDIA_BIN`. La narración usa la voz española Microsoft Sabina Desktop de Windows. No se inicia el servidor ni se ejecuta un build automáticamente. La grabación y el maestro de producción se conservan fuera de Git.

Los archivos de video deben permanecer por debajo de 100 MiB. Una nueva grabación puede cambiar las duraciones: el catálogo y los subtítulos deben generarse junto con los MP4, no editarse manualmente. El usuario debe autorizar por separado commits, push y publicación externa.

La cobertura, el índice de demostraciones con instantes y los resultados de la revisión local se documentan en `docs/manual-coverage.md`, `docs/manual-demonstrations.md` y `docs/manual-validation.md`.
