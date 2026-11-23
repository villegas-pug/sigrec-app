package pe.gob.inabif.sigrec.servicio.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.shared.model.Auditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_PERIODO", uniqueConstraints = @UniqueConstraint(name = "UK_SRV_PER_CICLO",
        columnNames = {"ID_SERVICIO", "ANIO", "CANT_MES_PERIODICIDAD", "NUM_PERIODO"}))
@Check(name = "CK_SRV_PER_NUM_PERIODO", constraints = "NUM_PERIODO BETWEEN 1 AND 12 / NULLIF(CANT_MES_PERIODICIDAD, 0)")
@Check(name = "CK_SRV_PER_ANIO", constraints = "ANIO BETWEEN 1 AND 9999")
@Check(name = "CK_SRV_PER_SITUACION", constraints = "SITUACION IN ('PAGADO', 'PENDIENTE', 'SIN_INFO')")
@Check(name = "CK_SRV_PER_PAGO", constraints = "(SITUACION = 'PAGADO' AND FEC_PAGO IS NOT NULL AND MONTO_PAGO IS NOT NULL AND MONTO_PAGO > 0 AND TRIM(SUSTENTO_PAGO) IS NOT NULL) OR (SITUACION <> 'PAGADO' AND FEC_PAGO IS NULL AND MONTO_PAGO IS NULL AND SUSTENTO_PAGO IS NULL)")
@Check(name = "CK_SRV_PER_PENDIENTE", constraints = "SITUACION = 'PENDIENTE' OR (FEC_VENCE IS NULL AND MOTIVO_PENDIENTE IS NULL AND DETALLE_PENDIENTE IS NULL)")
@Check(name = "CK_SRV_PER_CANT_MES", constraints = "CANT_MES_PERIODICIDAD IN (1, 2, 3, 4, 6, 12)")
public class Periodo extends Auditable {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_SERVICIO", nullable = false, foreignKey = @ForeignKey(name = "FK_SRV_PER_SRV_SER"))
    private Servicio servicio;
    @Column(name = "ANIO", nullable = false, precision = 4)
    private int anio;
    @Column(name = "NUM_PERIODO", nullable = false, precision = 2)
    private int numero;
    @Column(name = "CANT_MES_PERIODICIDAD", nullable = false, precision = 2)
    private int meses;
    @Column(name = "SITUACION", nullable = false, length = 10)
    private String situacion = "SIN_INFO";
    @Column(name = "FEC_VENCE")
    private LocalDate vence;
    @Column(name = "MOTIVO_PENDIENTE", length = 500)
    private String motivoPendiente;
    @Column(name = "DETALLE_PENDIENTE", length = 1000)
    private String detalle;
    @Column(name = "FEC_PAGO")
    private LocalDate pagoFecha;
    @Column(name = "MONTO_PAGO", precision = 14, scale = 2)
    private BigDecimal pagoImporte;
    @Column(name = "SUSTENTO_PAGO", length = 1000)
    private String pagoSustento;
}
