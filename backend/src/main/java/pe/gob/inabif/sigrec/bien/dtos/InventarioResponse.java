package pe.gob.inabif.sigrec.bien.dtos;

import java.util.List;
import java.util.Map;

public record InventarioResponse(List<BienResponse> bienes, List<InventarioPrevioResponse> inventarioPrevio,
                                 List<Map<String,Object>> eventos) {}
