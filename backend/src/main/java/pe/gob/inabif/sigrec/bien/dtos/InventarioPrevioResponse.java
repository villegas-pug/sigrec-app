package pe.gob.inabif.sigrec.bien.dtos;

public record InventarioPrevioResponse(String id, String carId, String tipoId, String nombre, String marcaModelo,
                                      String serie, String codigoPatrimonial, String ubicacionPrevia, String condicion,
                                      String fechaAdquisicion, String bienId) {}
