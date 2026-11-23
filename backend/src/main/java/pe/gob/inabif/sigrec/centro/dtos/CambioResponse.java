package pe.gob.inabif.sigrec.centro.dtos;

import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import java.util.List;

public record CambioResponse<T>(T registro, List<ElementoResponse> elementos) {}
