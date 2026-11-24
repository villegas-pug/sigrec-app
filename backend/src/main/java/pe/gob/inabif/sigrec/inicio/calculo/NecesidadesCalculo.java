package pe.gob.inabif.sigrec.inicio.calculo;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import pe.gob.inabif.sigrec.bien.dtos.BienResponse;

/**
 * SPEC 044. Necesidades del año de revisión (espejo de {@code frontend/src/services/necesidades.js}).
 * - Una sola necesidad por bien activo, con todos sus motivos (vida útil e incidentes).
 * - Sin precio referencial el importe es nulo («sin valorar»), nunca cero.
 * - Con la vida útil cumplida se renuevan todas las unidades; solo por incidente, las unidades informadas.
 */
final class NecesidadesCalculo {
    record Pendiente(String id, BienResponse bien, String carId, String ambienteId, String moduloId, String clase,
                     int cantidad, BigDecimal importe) {}

    /** Infraestructura en evaluación: una novedad de ambiente o un incidente de centro o ambiente sin atención. */
    record Infraestructura(String id, String carId, String ambienteId, String titulo, boolean esIncidencia, String ubicacion) {}

    record Resultado(List<Pendiente> pendientes, List<Infraestructura> infraestructura, List<String> carsAtendidas) {}

    private NecesidadesCalculo() {}

    static Resultado calcular(Contexto ctx, int anio, List<String> carIds) {
        return new Resultado(pendientes(ctx, anio, carIds), infraestructura(ctx, carIds), atendidas(ctx, anio, carIds));
    }

    private static List<Pendiente> pendientes(Contexto ctx, int anio, List<String> carIds) {
        var lista = new ArrayList<Pendiente>();
        for (var bien : ctx.datos.inventario().bienes()) {
            if (!ctx.activo(bien)) continue;
            var ambiente = ctx.ambientePorId.get(bien.ambienteId());
            var car = ambiente == null ? null : ctx.carPorId.get(ambiente.carId());
            if (car == null || !carIds.contains(car.id())) continue;

            int cantidadBien = bien.cantidad() == null ? 1 : bien.cantidad();
            var fin = finVidaUtil(bien);
            boolean porVidaUtil = fin != null && fin <= anio;
            var incidentes = incidentesConNecesidad(ctx, bien.id(), anio);
            if (!porVidaUtil && incidentes.isEmpty()) continue;

            int afectadas = incidentes.stream().mapToInt(e -> e.unidadesAfectadas(bien.id(), bien.cantidad())).sum();
            int cantidad = porVidaUtil ? cantidadBien : Math.min(cantidadBien, afectadas);
            var precio = ctx.precioPorTipo.get(bien.tipoId());
            lista.add(new Pendiente(bien.id(), bien, car.id(), ambiente.id(), ambiente.moduloId(),
                    incidentes.isEmpty() ? "renovacion" : "reposicion", cantidad,
                    precio == null ? null : precio.multiply(BigDecimal.valueOf(cantidad))));
        }
        return lista;
    }

    /** Año en que se cumple la vida útil; nulo si faltan antecedentes. */
    private static Integer finVidaUtil(BienResponse bien) {
        var fecha = bien.adquisicion() == null ? null : bien.adquisicion().fecha();
        if (fecha == null || fecha.isEmpty() || bien.vidaUtilAnios() == null) return null;
        return Integer.parseInt(fecha.substring(0, 4)) + bien.vidaUtilAnios();
    }

    /** Incidentes vigentes que reportan necesidad para el bien y ocurrieron hasta el año revisado. */
    static List<Hecho> incidentesConNecesidad(Contexto ctx, String bienId, int anio) {
        return ctx.eventosRegistrados().stream()
                .filter(e -> e.vigente() && e.esIncidencia() && e.requiereReposicion(bienId)
                        && e.bienIds().contains(bienId) && e.anio() <= anio)
                .toList();
    }

    private static List<Infraestructura> infraestructura(Contexto ctx, List<String> carIds) {
        var lista = new ArrayList<Infraestructura>();
        for (var ambiente : ctx.datos.jerarquia().ambientes()) {
            if (ambiente.anulacion() != null) continue;
            var car = ctx.carPorId.get(ambiente.carId());
            if (car == null || !carIds.contains(car.id())) continue;
            var modulo = ctx.moduloPorId.get(ambiente.moduloId());
            for (var novedad : ctx.novedadesDe(ambiente.id())) {
                if (novedad.vigente() && novedad.requiereEvaluacion() && !novedad.atendida()) {
                    lista.add(new Infraestructura(novedad.id(), car.id(), ambiente.id(), novedad.titulo(), false,
                            Contexto.textoUbicacion(car, modulo, ambiente)));
                }
            }
        }
        for (var e : ctx.eventosRegistrados()) {
            if (!(e.vigente() && e.requiereEvaluacion() && !e.atendida()
                    && ("centro".equals(e.origenTipo()) || "ambiente".equals(e.origenTipo())))) continue;
            // Ubicación del hecho: el ambiente (si lo hay) y el centro del hecho o, en su defecto, el del ambiente.
            var ambiente = e.ambienteId() == null ? null : ctx.ambientePorId.get(e.ambienteId());
            var carId = e.carId() != null ? e.carId() : ambiente == null ? null : ambiente.carId();
            var car = carId == null ? null : ctx.carPorId.get(carId);
            if (car == null || !carIds.contains(car.id())) continue;
            var modulo = ambiente == null ? null : ctx.moduloPorId.get(ambiente.moduloId());
            lista.add(new Infraestructura(e.id(), car.id(), ambiente == null ? null : ambiente.id(), e.titulo(), true,
                    Contexto.textoUbicacion(car, modulo, ambiente)));
        }
        return lista;
    }

    /** Centros de cada reposición registrada hasta el año revisado (el centro es el del bien anterior). */
    private static List<String> atendidas(Contexto ctx, int anio, List<String> carIds) {
        var lista = new ArrayList<String>();
        for (var e : ctx.eventosRegistrados()) {
            if (!e.vigente() || !"reposicion".equals(e.tipo()) || e.anio() > anio) continue;
            var anterior = e.bienAnteriorId() == null ? null : ctx.bienPorId.get(e.bienAnteriorId());
            var ambiente = anterior == null ? null : ctx.ambientePorId.get(anterior.ambienteId());
            var car = ambiente == null ? null : ctx.carPorId.get(ambiente.carId());
            if (car != null && carIds.contains(car.id())) lista.add(car.id());
        }
        return lista;
    }

    /** Cuenta los elementos de la lista cuyo centro es {@code carId}. */
    static long delCar(List<String> carsDeCadaElemento, String carId) {
        return carsDeCadaElemento.stream().filter(c -> Objects.equals(c, carId)).count();
    }
}
