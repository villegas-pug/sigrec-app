package pe.gob.inabif.sigrec.servicio.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_HECHO", uniqueConstraints = @UniqueConstraint(name = "UK_SRV_HEC_CODIGO", columnNames = "CODIGO"))
@Check(name = "CK_SRV_HEC_OBJETIVO", constraints = "CASE WHEN ID_SERVICIO IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN ID_PERIODO IS NOT NULL THEN 1 ELSE 0 END = 1")
@Check(name = "CK_SRV_HEC_ALCANCE", constraints = "(TIPO IN ('INTERRUPCION', 'RESTABLECIMIENTO') AND ID_SERVICIO IS NOT NULL) OR (TIPO IN ('PAGO', 'CORRECCION') AND ID_PERIODO IS NOT NULL)")
@Check(name = "CK_SRV_HEC_TRANSICION", constraints = "(SITUACION_ANTERIOR IS NULL AND SITUACION_NUEVA IS NULL) OR (TIPO = 'CORRECCION' AND SITUACION_ANTERIOR IN ('PAGADO', 'PENDIENTE', 'SIN_INFO') AND SITUACION_NUEVA IN ('PAGADO', 'PENDIENTE', 'SIN_INFO') AND SITUACION_ANTERIOR <> SITUACION_NUEVA)")
public class HechoServicio extends HechoAuditable {
    @Column(name = "TIPO", nullable = false, length = 18)
    private String tipo;
    @Column(name = "FEC_HECHO", nullable = false)
    private LocalDate fecha;
    @Column(name = "DETALLE", length = 1000)
    private String detalle;
    @Column(name = "SITUACION_ANTERIOR", length = 10)
    private String anterior;
    @Column(name = "SITUACION_NUEVA", length = 10)
    private String nueva;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SERVICIO", foreignKey = @ForeignKey(name = "FK_SRV_HEC_SRV_SER"))
    private Servicio servicio;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PERIODO", foreignKey = @ForeignKey(name = "FK_SRV_HEC_SRV_PER"))
    private Periodo periodo;

    public Servicio titular() {
        return servicio == null ? periodo.getServicio() : servicio;
    }
}
