# SPEC 035 — Reorganización de SIGREC por capas

> La [SPEC 036](036-estructura-raiz-frontend-backend-database.md) prevalece sobre esta especificación en cuanto a las rutas. Las ubicaciones de esta página son históricas.

## Objetivo

Agrupar SIGREC bajo `aplicaciones/sigrec/` dentro del repositorio existente. El nombre coincide con el producto y con el paquete npm. Se conservan `.git`, `main`, `origin` y el historial. Esta especificación prevalece sobre las rutas de trabajo anteriores. Las reglas de negocio de las SPEC 001–034, los datos ficticios, las URLs de la SPA y el contrato del modelo ER se conservan.

## Estructura y ejecución

| Ubicación | Contenido y comandos |
| --- | --- |
| `aplicaciones/sigrec/frontend/` | SPA, `src/`, `public/`, guiones del manual, manifiestos npm y configuración de Quasar, PostCSS y JavaScript. Desde aquí se ejecutan `npm install`, `npm run dev` y `npm run build`. La instalación ejecuta `quasar prepare`. La salida es `dist/spa/` dentro del frontend. |
| `aplicaciones/sigrec/backend/` | README sobre la futura API de SIGREC. |
| `aplicaciones/sigrec/database/` | README, modelo ER Oracle y su visor estático trasladado desde `docs/modelo-er/`. Desde la raíz Git se ejecuta `npm --prefix aplicaciones/sigrec/database/modelo-er start`. |
| Raíz Git | `AGENTS.md`, `README.md`, `.gitignore`, especificaciones, actas, documentación del manual e informe histórico de E2E. |

El manual usa los medios versionados en `frontend/public/manual/v1/`. Sus guiones resuelven el frontend desde su ubicación y mantienen los intermedios y las herramientas locales en `artifacts/manual-usuario/` de la raíz Git. El ensamblado actualiza los medios, `frontend/src/config/manual.js` y `docs/manual-demonstrations.md`. Las dependencias, cachés, salidas de build e intermedios quedan excluidos de Git. Las copias locales existentes permanecen en su ubicación.

El visor conserva sus rutas internas relativas. Los enlaces a specs salen de `modelo-er/` hacia `docs/spec/` en la raíz. GitHub Pages está desactivado al especificar el traslado. Si se habilita, su fuente estática es `aplicaciones/sigrec/database/modelo-er/`; una publicación con URL bajo `/modelo-er/` debe empaquetar el visor bajo ese mismo subdirectorio.

## Migración y aceptación

1. Confirmar que `fase3` terminó de verificar en `localhost:9000`, que las SPEC 032–034 y sus cambios están en un commit aprobado y que el árbol de trabajo está limpio. Registrar el SHA de línea base y verificar la raíz Git, rama, upstream y URL de `origin`.
2. Trasladar con `git mv` el frontend y el visor, y comprobar los renombres `R100` antes de adaptar rutas. Añadir los README de backend y database, y actualizar las referencias, comandos e ignorados. Coordinar con sus responsables los guiones externos que dependan de la antigua raíz de la SPA.
3. Verificar el estado, el diff, los enlaces y las reglas de exclusión. Con autorización explícita, instalar desde `frontend/` y comprobar que `.quasar/`, la salida del build y el servidor de desarrollo usan esa carpeta. Revisar la navegación hash, el manual con sus medios actuales y la carga y validación del ERD en el visor.
4. Si se autorizan los commits de migración, registrar el traslado puro junto con esta SPEC y después las adaptaciones. Verificar con `git log --follow` el historial de archivos representativos de la SPA, el manual y el ERD. Publicar solo con autorización explícita.

## Reversión

Antes de un commit, respaldar las adaptaciones y los archivos nuevos fuera del repositorio, invertir los movimientos completados y deshacer únicamente cambios de esta SPEC. Después de commits, revertir las adaptaciones y luego el traslado con autorización explícita. La reversión conserva el commit previo de las fases 1–3 y los artefactos locales.
