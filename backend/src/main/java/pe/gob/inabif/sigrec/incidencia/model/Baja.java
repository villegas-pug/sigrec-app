package pe.gob.inabif.sigrec.incidencia.model;

import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
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
@Table(name = "SGR_BAJA", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_INC_BAJ_COD", columnNames = {"CODIGO"}),
    @UniqueConstraint(name = "SGR_UK_INC_BAJ_V1", columnNames = {"V_UNICO_1_1"})
}, indexes = {
    @Index(name = "IX_INC_BAJ_BIE_BIE", columnList = "ID_BIEN"),
    @Index(name = "IX_INC_BAJ_CTR_AMB", columnList = "ID_AMBIENTE")
})
public class Baja extends HechoAuditable {
    @Column(name = "FEC_BAJA", nullable = false)
    private LocalDate fecha;

    @Column(name = "MOTIVO", length = 500, nullable = false)
    private String motivo;

    @Column(name = "DETALLE", length = 1000)
    private String detalle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_BIEN", nullable = false)
    private Bien bien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_AMBIENTE")
    private Ambiente ambiente;

    @Column(name = "TITULO_HIST", length = 1000)
    private String titulo;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_BIEN END")
    @Column(name = "V_UNICO_1_1")
    private Long unico1_1;
}
