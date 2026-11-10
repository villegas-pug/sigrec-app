<template>
  <detalle-hecho :evento="evento" @seleccionar="$emit('seleccionar', $event)">
    <template #acciones><menu-acciones con-etiqueta :items="accionesEvento" :etiqueta="`Acciones del hecho ${evento.titulo}`" /></template>
  </detalle-hecho>
  <router-link v-if="!operable" :to="{ name: 'centros', query: { hecho: evento.id } }">Consultar hecho en su origen</router-link>
  <incidente-dialog v-model="dialogoIncidente.abierto" :evento="dialogoIncidente.evento" @hecho="$emit('seleccionar', $event)" />
  <atencion-dialog v-model="atencionAbierta" :novedad="evento" />
  <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import AtencionDialog from 'components/centros/AtencionDialog.vue'
import DetalleHecho from 'components/bienes/DetalleHecho.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { permisoIncidencia, esIncidencia as esHechoIncidente } from 'src/services/incidencias'
import { vigente } from 'src/services/datos'
import { anular, anularBaja, anularReposicion, dependenciasDeBaja, dependenciasDeReposicion } from 'src/services/acciones'
const props = defineProps({ evento: { type: Object, required: true }, operable: { type: Boolean, default: true } })
defineEmits(['seleccionar'])
const evento = computed(() => props.evento)
const esIncidente = computed(() => esHechoIncidente(evento.value))
const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()
const dialogoIncidente = reactive({ abierto: false, evento: null })
const atencionAbierta = ref(false)
const accionesEvento = computed(() => {
  const e = evento.value
  if (!e || !props.operable) return []
  if (esIncidente.value && !puedeHacer(permisoIncidencia(e))) return []
  if (e.tipo === 'baja') {
    return [
      {
        label: 'Anular baja',
        icono: 'block',
        peligro: true,
        visible: puedeHacer('baja.anular') && vigente(e),
        accion: () => pedirAnulacion({
          titulo: 'Anular baja',
          subtitulo: e.titulo,
          aviso: 'Use esta opción solo si la baja se registró por error. El bien vuelve a estar activo y a contar en los cálculos.',
          dependencias: dependenciasDeBaja(e),
          mensaje: 'Baja anulada. El bien está activo nuevamente.',
          ejecutar: (datos) => anularBaja(e, datos)
        })
      }
    ]
  }
  if (e.tipo === 'reposicion') {
    return [
      {
        label: 'Anular reposición',
        icono: 'block',
        peligro: true,
        visible: puedeHacer('reposicion.anular') && vigente(e),
        accion: () => pedirAnulacion({
          titulo: 'Anular reposición',
          subtitulo: e.titulo,
          aviso: 'Use esta opción solo si la reposición se registró por error. El bien nuevo se anula y el anterior sigue dado de baja.',
          dependencias: dependenciasDeReposicion(e),
          mensaje: 'Reposición anulada. El bien anterior sigue dado de baja.',
          ejecutar: (datos) => anularReposicion(e, datos)
        })
      }
    ]
  }
  if (!esIncidente.value) return []
  return [
    { label: 'Marcar infraestructura como atendida', icono: 'task_alt', visible: !!e.requiereEvaluacion && !e.atendida && vigente(e) && puedeHacer('novedad.atender'), accion: () => { atencionAbierta.value = true } },
    {
      label: 'Actualizar incidente',
      icono: 'edit',
      visible: puedeHacer('incidente.actualizar') && vigente(e),
      accion: () => Object.assign(dialogoIncidente, { abierto: true, evento: e })
    },
    {
      label: 'Anular incidente',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('incidente.anular') && vigente(e),
      accion: () => pedirAnulacion({
        titulo: 'Anular incidente',
        subtitulo: e.titulo,
        aviso: 'Un incidente anulado deja de generar necesidades. La condición de los bienes no se revierte: corríjala desde la ficha del bien.',
        mensaje: 'Incidente anulado.',
        ejecutar: (datos) => anular(e, datos),
      registro: e
      })
    },
    {
      label: 'Reactivar incidente',
      icono: 'restore',
      visible: puedeHacer('incidente.anular') && !vigente(e),
      accion: () => pedirReactivacion({ entidad: 'incidente', registro: e, nombre: 'Incidente' })
    }
  ]
})
</script>
