package pe.gob.inabif.sigrec.centro.dtos;

import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoResponse;
import java.util.List;

public record JerarquiaResponse(List<CentroResponse> cars, List<ModuloResponse> modulos, List<AmbienteResponse> ambientes, List<ElementoResponse> elementos) {}
