package pe.gob.inabif.sigrec.shared.model;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class HechoAuditable extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "AUTOR_REFERENCIA", length = 180)
    private String autorReferencia;
    @Column(name = "ORDEN_IMPORTACION")
    private Integer ordenImportacion;

    public void asignarCodigo(String prefijo) {
        codigo = prefijo + UUID.randomUUID().toString().replace("-", "").toUpperCase(java.util.Locale.ROOT);
    }
}
