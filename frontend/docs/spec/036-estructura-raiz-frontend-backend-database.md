# SPEC 036 — Estructura de SIGREC en la raíz del repositorio

## Problema

La SPEC 035 ubicó las capas bajo `aplicaciones/sigrec/` y dejó la documentación y los artefactos en la raíz. La estructura acordada ubica las tres capas directamente en la raíz y reúne la documentación y los recursos de trabajo de SIGREC bajo `frontend/`.

## Comportamiento requerido

La SPEC 036 prevalece sobre la SPEC 035 y sobre cualquier especificación anterior en cuanto a las rutas, incluidas las referencias históricas a `docs/spec/` en la raíz. La carpeta `aplicaciones/sigrec/` ya no existe en la estructura vigente. La raíz contiene estas entradas:

```text
.git/          Metadatos de Git
.gitignore
AGENTS.md
README.md
backend/       Espacio reservado para la futura API
database/      Modelo entidad–relación Oracle y visor independiente
frontend/
  docs/
    spec/      Secuencia única de especificaciones SDD
    reuniones/
    …          Documentación del manual
  artifacts/
    e2e/       Informe versionado
    manual-usuario/
  public/
    manual/    Medios publicados
  src/
  node_modules/
  dist/
  .quasar/
  .playwright-cli/
```

- Se trasladan el frontend, el backend y la base de datos a la raíz. La documentación completa pasa a `frontend/docs/`. Los artefactos versionados e ignorados pasan a `frontend/artifacts/`.
- `.git`, `AGENTS.md`, `README.md` y `.gitignore` conservan su ubicación. Codex, OpenCode y Claude Code usan el `AGENTS.md` de la raíz como guía del repositorio. La numeración de las especificaciones continúa en `frontend/docs/spec/`.
- `node_modules/`, `dist/`, `.quasar/` y `.playwright-cli/` se trasladan en disco a `frontend/`. Si un proceso bloquea una carpeta local, se conserva en su ubicación y se informa al usuario.
- Desde `frontend/` se ejecutan `npm install`, `npm run build` y `npm run dev`. Desde la raíz Git, el visor se inicia con `npm --prefix database/modelo-er start`. El visor enlaza a las especificaciones desde `../../frontend/docs/spec/` y las fuentes del ERD se expresan desde la raíz Git.
- Los guiones del manual resuelven la raíz Git un nivel por encima de `frontend/` y usan `frontend/artifacts/manual-usuario/` para intermedios, `frontend/public/manual/` para medios publicados y `frontend/docs/` para la documentación generada.
- Se conservan el comportamiento de la SPA, los medios del manual, el contenido y la versión del ERD y el historial Git.

## Riesgos

- Los guiones externos y accesos locales con rutas absolutas pueden requerir ajustes.
- Un servidor activo puede bloquear carpetas locales. Las dependencias y los archivos generados pueden contener referencias a la ubicación anterior. Una instalación autorizada desde `frontend/` puede ser necesaria para regenerarlas.
- La guía para agentes solo se mantiene en el `AGENTS.md` de la raíz. Hay que abrir el repositorio desde esa raíz para que los agentes usen las instrucciones del proyecto.

## Verificación

- Comprobar los movimientos con `git diff --cached --name-status -M100%` antes de editar referencias.
- Verificar el contenido permitido en la raíz, la sintaxis de los scripts, los enlaces relativos, las fuentes del ERD, las exclusiones de Git y la configuración y los alias de Quasar.
- Con autorización explícita, instalar desde `frontend/`, verificar el build y el servidor de desarrollo y comprobar la navegación, los medios del manual y la carga del ERD en el visor.
