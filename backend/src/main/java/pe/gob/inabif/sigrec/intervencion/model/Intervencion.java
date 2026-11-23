package pe.gob.inabif.sigrec.intervencion.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_INTERVENCION", uniqueConstraints = @UniqueConstraint(name = "UK_CTR_INT_CODIGO", columnNames = "CODIGO"))
@Check(name = "CK_CTR_INT_FEC_INTERVENCION", constraints = "FEC_INTERVENCION = TRUNC(FEC_INTERVENCION, 'MM')")
@Check(name = "CK_CTR_INT_ES_PINTADO", constraints = "ES_PINTADO IN (0,1)")
public class Intervencion extends HechoAuditable {
    @Column(name = "DESCRIPCION", nullable = false, length = 1000)
    private String descripcion;
    @Column(name = "FEC_INTERVENCION")
    private LocalDate fecha;
    @Column(name = "ES_PINTADO", nullable = false)
    private int pintado;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_AMBIENTE", nullable = false, foreignKey = @ForeignKey(name = "FK_CTR_INT_CTR_AMB"))
    private Ambiente ambiente;
}
