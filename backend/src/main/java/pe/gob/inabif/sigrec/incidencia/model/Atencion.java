package pe.gob.inabif.sigrec.incidencia.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;

@Getter
@Setter
@Entity
@Table(name = "SGR_ATENCION", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_CTR_ATE_V1", columnNames = {"V_UNICO_1_1"})
}, indexes = {
    @Index(name = "IX_CTR_ATE_INC_INC", columnList = "ID_INCIDENTE")
})
public class Atencion extends Auditable {
    @Column(name = "FEC_ATENCION", nullable = false)
    private LocalDate fecha;

    @Column(name = "DETALLE", length = 1000)
    private String detalle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_INCIDENTE", nullable = false)
    private Incidente incidente;

    @Column(name = "AUTOR_REFERENCIA", length = 180)
    private String autorReferencia;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_INCIDENTE END")
    @Column(name = "V_UNICO_1_1")
    private Long unico1_1;
}
