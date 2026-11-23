package pe.gob.inabif.sigrec.vehiculo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.shared.model.Auditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_VEHICULO", uniqueConstraints = {
    @UniqueConstraint(name = "UK_MOV_VEH_CODIGO", columnNames = "CODIGO"),
    @UniqueConstraint(name = "IX_MOV_VEH_PLACA", columnNames = "PLACA_VIGENTE")
})
@Check(name = "CK_MOV_VEH_RENDIMIENTO_KM_L", constraints = "RENDIMIENTO_KM_L >= 0")
@Check(name = "CK_MOV_VEH_MONTO_MANTENIMIENTO", constraints = "MONTO_MANTENIMIENTO > 0")
@Check(name = "CK_MOV_VEH_ESTADO_OPERATIVO", constraints = "ESTADO_OPERATIVO IN ('OPERATIVO', 'REQUIERE_MANTENIMIENTO', 'DETENIDO')")
@Check(name = "CK_MOV_VEH_MANTENIMIENTO", constraints = "ESTADO_OPERATIVO IN ('REQUIERE_MANTENIMIENTO', 'DETENIDO') OR (MOTIVO_MANTENIMIENTO IS NULL AND MONTO_MANTENIMIENTO IS NULL)")
public class Vehiculo extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "TIPO", nullable = false, length = 100)
    private String tipo;
    @Column(name = "PLACA", nullable = false, length = 20)
    private String placa;
    @Column(name = "CHOFER_REFERENCIA", length = 180)
    private String chofer;
    @Column(name = "COMBUSTIBLE", nullable = false, length = 100)
    private String combustible;
    @Column(name = "RENDIMIENTO_KM_L", precision = 10, scale = 3)
    private BigDecimal rendimientoKmL;
    @Column(name = "ESTADO_OPERATIVO", length = 25)
    private String estadoOperativo;
    @Column(name = "MOTIVO_MANTENIMIENTO", length = 1000)
    private String motivoMantenimiento;
    @Column(name = "MONTO_MANTENIMIENTO", precision = 14, scale = 2)
    private BigDecimal montoMantenimiento;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CENTRO", nullable = false, foreignKey = @ForeignKey(name = "FK_MOV_VEH_CTR_CEN"))
    private Centro centro;
    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN UPPER(TRIM(PLACA)) END")
    @Column(name = "PLACA_VIGENTE", length = 20)
    private String placaVigente;
}
