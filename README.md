# SIGREC — Sistema Integrado de Gestión de Recursos de Centros

Prototipo funcional para la USPNNA – INABIF. Permite revisar locales, ambientes, bienes, necesidades y presupuesto, servicios básicos, movilidad y combustible de los CAR con **datos ficticios**. No contiene información de NNA ni de personal del INABIF.

- Especificación (SDD): [`docs/spec/001-prototipo-sigrec.md`](docs/spec/001-prototipo-sigrec.md)
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

El perfil se elige al pie del menú lateral y se recuerda en el navegador. Los accesos y ámbitos son **provisionales** y deben validarse con el jefe de proyecto.

| Perfil | Accede a | Ámbito |
| --- | --- | --- |
| Equipo central USPNNA | Todo salvo «Registro y verificación» | Todos los CAR |
| Personal del CAR | Todo salvo «Precios referenciales» | CAR Demo Amanecer |
| Verificación física | Bienes, Registro y verificación, Incidencias | CAR Demo Amanecer |
| Chofer | Vehículos e itinerarios, Combustible | Vehículo AMA-V01 |

## Limitaciones

- Los cambios hechos en la interfaz viven en memoria y se pierden al recargar.
- Los accesos por perfil se controlan en el cliente: no son un mecanismo de seguridad.
- La fecha de corte de la demostración es el 30/10/2026 y el año de revisión, 2027.
