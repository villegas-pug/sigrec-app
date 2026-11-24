package pe.gob.inabif.sigrec.inicio.calculo;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse;

/**
 * SPEC 044. Punto de entrada del cálculo de Inicio: recibe las colecciones ya filtradas por el ámbito del usuario y la fecha
 * de hoy, y devuelve los indicadores, la situación por centro y los avisos. No depende de Spring ni de la base de datos.
 */
public final class CalculoInicio {
    private CalculoInicio() {}

    /**
     * @param elementosBase códigos (en minúsculas) del catálogo {@code ELEMENTO_BASE}; se añaden los elementos que la SPA
     *                      conserva por omisión
     * @param hoy           fecha actual en {@code America/Lima}; el año de revisión de las necesidades es el siguiente
     */
    public static ResumenInicioResponse calcular(InicioDatosResponse datos, List<String> elementosBase, LocalDate hoy) {
        var base = new ArrayList<>(elementosBase);
        for (var predeterminado : ReglasInicio.ELEMENTOS_BASE_PREDETERMINADOS) if (!base.contains(predeterminado)) base.add(predeterminado);

        var ctx = new Contexto(datos, base, hoy);
        int anioServicios = hoy.getYear();
        var necesidades = NecesidadesCalculo.calcular(ctx, hoy.getYear() + 1, ctx.idsCarsVigentes());
        var controles = new ControlesCalculo(ctx);
        var servicios = new ServiciosCalculo(ctx);
        var movilidad = new Movilidad(ctx);

        var filas = new SituacionCentros(ctx, necesidades, controles, servicios, movilidad, anioServicios).filas();
        var avisos = new AvisosCalculo(ctx, necesidades, controles, servicios, movilidad, anioServicios).calcular();
        var recorridos = movilidad.recorridos();

        // Módulos y ambientes vigentes de los centros vigentes (SPEC 020).
        long modulos = ctx.carsVigentes.stream().mapToLong(c -> ctx.modulosDeCar(c.id()).size()).sum();
        long ambientes = ctx.carsVigentes.stream().mapToLong(c -> ctx.ambientesDeCar(c.id()).size()).sum();
        return new ResumenInicioResponse(
                filas,
                new ResumenInicioResponse.Jerarquia(ctx.carsVigentes.size(), modulos, ambientes),
                new ResumenInicioResponse.Recorridos(recorridos.size(), recorridos.stream().filter(r -> r.estado().equals("no_comparable")).count()),
                avisos);
    }
}
