package pe.gob.inabif.sigrec.inicio.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.inicio.calculo.CalculoInicio;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.Hoy;

/**
 * SPEC 044. Indicadores, situación por centro y avisos de Inicio calculados en el servidor. Reúne las colecciones que ya
 * consultan los demás módulos (cada una con su propio control de acceso y su ámbito) y las entrega al cálculo puro, sin
 * serializarlas ni enviarlas al navegador. Una sola transacción de solo lectura comparte las entidades cargadas.
 */
@Service
@RequiredArgsConstructor
public class ResumenInicio {
    private final Acceso acceso;
    private final InicioService inicio;
    private final CatalogoService catalogos;

    @Transactional(readOnly = true)
    public ResumenInicioResponse consultar() {
        acceso.consultaCentros("inicio");
        var datos = inicio.consultar();
        List<String> elementosBase = catalogos.elementosBase().stream().map(Catalogo::codigo).toList();
        return CalculoInicio.calcular(datos, elementosBase, Hoy.fecha());
    }
}
