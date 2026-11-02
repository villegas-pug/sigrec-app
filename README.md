# SIGREC — Sistema Integrado de Gestión de Recursos de Centros

Prototipo funcional para la USPNNA – INABIF. Permite revisar locales, ambientes, bienes, necesidades y presupuesto, servicios básicos, movilidad y combustible de los CAR con **datos ficticios**. No contiene información de NNA ni de personal del INABIF.

- Especificación (SDD): [`docs/spec/001-prototipo-sigrec.md`](docs/spec/001-prototipo-sigrec.md) y [`docs/spec/002-acciones-y-jerarquia.md`](docs/spec/002-acciones-y-jerarquia.md)
- Jerarquía: Centro › Ambiente › Bien › Componente (bien asociado a otro, p. ej. el colchón de una cama).
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
  data/          JSON ficticios (CAR, locales, ambientes, bienes, eventos, servicios, movilidad)
  services/      reglas de negocio puras y acciones sobre el almacén en memoria
  composables/   perfil activo y vehículo seleccionado
  components/    armazón (cabecera, menú), comunes y específicos de bienes y movilidad
  pages/         una página por entrada del menú
```

## Perfiles de demostración

El perfil se elige al pie del menú lateral y se recuerda en el navegador. Los accesos, acciones y ámbitos son **provisionales** y deben validarse con el jefe de proyecto. La matriz completa de acciones está en la SPEC 002 §3.

| Perfil | Accede a | Puede registrar o actualizar | Ámbito |
| --- | --- | --- | --- |
| Equipo central USPNNA | Todo salvo «Registro y verificación» | Centros, ficha y fotos del local, precios referenciales | Todos los CAR |
| Personal del CAR | Todo salvo «Precios referenciales» | Ficha del local, ambientes, bienes y componentes, servicios, vehículos, itinerarios, combustible | CAR Demo Amanecer |
| Verificación física | Bienes, Registro y verificación, Incidencias | Verificaciones e incidentes | CAR Demo Amanecer |
| Chofer | Itinerarios, Vehículos (consulta), Combustible | Itinerarios y combustible | Vehículo AMA-V01 |

## Limitaciones

- Los cambios hechos en la interfaz viven en memoria y se pierden al recargar, incluidas las fotografías incorporadas.
- Los accesos por perfil se controlan en el cliente: no son un mecanismo de seguridad.
- La fecha de corte de la demostración es el 30/10/2026 y el año de revisión, 2027.
