package pe.gob.inabif.sigrec.bien.service;

import pe.gob.inabif.sigrec.bien.dtos.*;

public interface BienService {
    BienResponse crear(CreateBienRequest request);
    BienResponse editar(String rotulo, UpdateBienRequest request);
    void verificarLote(BienOperaciones.LoteVerificacion request);
    void verificar(String rotulo, BienOperaciones.Verificacion request);
    void asociar(String rotulo, BienOperaciones.Asociacion request);
    void trasladar(String rotulo, BienOperaciones.Traslado request);
    void cerrarRevision(String rotulo);
    void cambiarEstado(String rotulo, String motivo);
}
