package pe.gob.inabif.sigrec.incidencia.model;

import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.bien.model.Bien;
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
@Table(name = "SGR_REPOSICION", uniqueConstraints = {
    @UniqueConstraint(name = "UK_INC_REP_BIEN_NUE", columnNames = {"ID_NUEVO_BIEN"}),
    @UniqueConstraint(name = "SGR_UK_INC_REP_COD", columnNames = {"CODIGO"}),
    @UniqueConstraint(name = "SGR_UK_INC_REP_V1", columnNames = {"V_UNICO_1_1"})
}, indexes = {
    @Index(name = "IX_INC_REP_INC_BAJ", columnList = "ID_BAJA")
})
public class Reposicion extends HechoAuditable {
    @Column(name = "FEC_REPOSICION", nullable = false)
    private LocalDate fecha;

    @Column(name = "DETALLE", length = 1000)
    private String detalle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_BAJA", nullable = false)
    private Baja baja;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_NUEVO_BIEN", nullable = false)
    private Bien bienNuevo;

    @Column(name = "TITULO_HIST", length = 180)
    private String titulo;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_BAJA END")
    @Column(name = "V_UNICO_1_1")
    private Long unico1_1;
}
