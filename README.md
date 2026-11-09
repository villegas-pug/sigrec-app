# SIGREC — Sistema Integrado de Gestión de Recursos de Centros

Prototipo funcional para la USPNNA – INABIF. Permite administrar y revisar centros, ambientes, bienes, necesidades y presupuesto, servicios básicos, movilidad y combustible de los CAR con **datos ficticios**. No contiene información de NNA ni de personal del INABIF.

- Especificación (SDD), en orden: [`001`](docs/spec/001-prototipo-sigrec.md) prototipo, [`002`](docs/spec/002-acciones-y-jerarquia.md) acciones y jerarquía, [`003`](docs/spec/003-centros-mantenedores-y-ux.md) centros sin «Local», mantenedores y UI adaptable, [`004`](docs/spec/004-incidencias-contexto-y-recorrido.md) incidencias, [`005`](docs/spec/005-navegacion-contexto-y-captura.md) navegación y captura rápida, [`006`](docs/spec/006-fotografias-pagos-itinerarios.md) fotografías, pagos e itinerarios, [`007`](docs/spec/007-dictado-por-voz.md) dictado por voz, [`008`](docs/spec/008-gestion-de-centros-unificada.md) gestión de centros unificada, [`009`](docs/spec/009-responsabilidad-combustible.md) responsabilidad del combustible y [`010`](docs/spec/010-fichas-planificacion-y-estado-operativo.md) fichas ampliadas, inventario para planificación, estado de vehículos, control preventivo y tablero de control. Donde difieran, prevalecen las posteriores.
- Jerarquía: Centro › Ambiente › Bien › Componente (bien asociado a otro, p. ej. el colchón de una cama). El inmueble donde funciona el centro es parte de su ficha; no existe el nivel «Local».
- Mantenedores: cada módulo permite registrar, actualizar y anular (baja lógica con motivo, reversible con «Mostrar inactivos»).
- Stack: Vue 3.5 + Quasar 2.35 (`@quasar/app-vite` 2.4.1 + Vite 7, compatible con Node 22.12 o superior). Las versiones 2.5+ de `@quasar/app-vite` exigen Node 22.22.

## Ejecución

```bash
npm install
npm run dev     # quasar dev
npm run build   # quasar build → dist/spa
```

## Estructura

```
src/
  config/        menú, perfiles y accesos, catálogos, fecha de corte de la demo
  data/          JSON ficticios (centros con la ficha de su inmueble, ambientes, bienes, eventos, servicios, movilidad)
  services/      reglas de negocio puras y acciones sobre el almacén en memoria
  composables/   perfil activo y vehículo seleccionado
  components/    armazón (cabecera, menú), comunes y específicos de bienes y movilidad
  pages/         una página por entrada del menú
```

## Perfiles de demostración

El perfil se elige al pie del menú lateral y se recuerda en el navegador. Los accesos, acciones y ámbitos son **provisionales** y deben validarse con el jefe de proyecto. La matriz completa de acciones está en la [SPEC 003](docs/spec/003-centros-mantenedores-y-ux.md) §4.

| Perfil | Accede a | Puede registrar o actualizar | Ámbito |
| --- | --- | --- | --- |
| Equipo central USPNNA (acceso total) | Todo (rutas y acciones derivadas del menú y del catálogo `TODAS_LAS_ACCIONES`) | Todos los mantenimientos (altas, ediciones y bajas lógicas); además registra y anula centros, administra los tipos de bien y sus precios y anula bajas y reposiciones registradas por error | Todos los CAR |
| Personal del CAR | Todo salvo «Tipos de bien y precios» (incluye «Inventario para planificación») | Los mismos mantenimientos, sobre su centro | CAR Demo Amanecer |
| Verificación física | Gestión de centros (solo consulta de centro y ambiente), Incidencias | Verificaciones e incidentes desde la ficha del bien | CAR Demo Amanecer |
| Chofer | Itinerarios, Vehículos (consulta), Combustible | Itinerarios y combustible | Vehículo AMA-V01 |

## Limitaciones

- Los cambios hechos en la interfaz viven en memoria y se pierden al recargar, incluidas las fotografías incorporadas.
- Los accesos por perfil se controlan en el cliente: no son un mecanismo de seguridad.
- La fecha de corte de la demostración es el 30/10/2026 y el año de revisión, 2027.
