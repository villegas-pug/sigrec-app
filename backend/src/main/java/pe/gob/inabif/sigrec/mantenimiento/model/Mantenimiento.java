package pe.gob.inabif.sigrec.mantenimiento.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

@Getter
@Setter
@Entity
@Table(name = "SGR_MANTENIMIENTO", uniqueConstraints = @UniqueConstraint(name = "UK_CTR_MAN_CODIGO", columnNames = "CODIGO"))
@Check(name = "CK_CTR_MAN_OBJETIVO", constraints = "CASE WHEN ID_CENTRO IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN ID_BIEN IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN ID_VEHICULO IS NOT NULL THEN 1 ELSE 0 END = 1")
@Check(name = "CK_CTR_MAN_MONTO_IMPORTE", constraints = "MONTO_IMPORTE > 0")
@Check(name = "CK_CTR_MAN_PROXIMA", constraints = "FEC_PROXIMO >= FEC_MANTENIMIENTO")
public class Mantenimiento extends HechoAuditable {
    @Column(name = "FEC_MANTENIMIENTO", nullable = false)
    private LocalDate fecha;
    @Column(name = "FEC_PROXIMO")
    private LocalDate proxima;
    @Column(name = "DETALLE", length = 1000)
    private String detalle;
    @Column(name = "MONTO_IMPORTE", precision = 14, scale = 2)
    private BigDecimal importe;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_MANTENIMIENTO", nullable = false, foreignKey = @ForeignKey(name = "FK_CTR_MAN_CAT_TMA"))
    private Catalogo tipo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CENTRO", foreignKey = @ForeignKey(name = "FK_CTR_MAN_CTR_CEN"))
    private Centro centro;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_BIEN", foreignKey = @ForeignKey(name = "FK_CTR_MAN_INV_BIE"))
    private Bien bien;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_VEHICULO", foreignKey = @ForeignKey(name = "FK_CTR_MAN_MOV_VEH"))
    private Vehiculo vehiculo;

    public Centro titular() {
        if (centro != null) return centro;
        return bien != null ? bien.getAmbiente().modulo().centro() : vehiculo.getCentro();
    }
}
