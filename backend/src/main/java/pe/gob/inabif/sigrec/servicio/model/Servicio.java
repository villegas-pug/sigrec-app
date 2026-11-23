package pe.gob.inabif.sigrec.servicio.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.shared.model.Auditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_SERVICIO", uniqueConstraints = {
    @UniqueConstraint(name = "UK_SRV_SER_CODIGO", columnNames = "CODIGO"),
    @UniqueConstraint(name = "IX_SRV_SER_CEN_TIPO", columnNames = {"CENTRO_VIGENTE", "TIPO_VIGENTE"})
})
@Check(name = "CK_SRV_SER_FEC_INICIO", constraints = "FEC_INICIO = TRUNC(FEC_INICIO, 'MM')")
@Check(name = "CK_SRV_SER_RENOVACION", constraints = "FEC_RENOVACION IS NOT NULL OR DETALLE_RENOVACION IS NULL")
@Check(name = "CK_SRV_SER_CANT_MES", constraints = "CANT_MES_PERIODICIDAD IN (1, 2, 3, 4, 6, 12)")
@Check(name = "CK_SRV_SER_INICIO_PREC", constraints = "(FEC_INICIO IS NULL AND PRECISION_INICIO IS NULL) OR (FEC_INICIO IS NOT NULL AND PRECISION_INICIO IN ('ANIO', 'MES'))")
public class Servicio extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "PROVEEDOR", nullable = false, length = 180)
    private String proveedor;
    @Column(name = "CONTACTO", length = 180)
    private String contacto;
    @Column(name = "TELEFONO_CONTACTO", length = 40)
    private String telefono;
    @Column(name = "SUMINISTRO", length = 100)
    private String suministro;
    @Column(name = "CONTRATACION", length = 1000)
    private String contratacion;
    @Column(name = "OBSERVACIONES", length = 1000)
    private String observaciones;
    @Column(name = "FEC_INICIO")
    private LocalDate inicio;
    @Column(name = "PRECISION_INICIO", length = 4)
    private String precisionInicio;
    @Column(name = "FEC_RENOVACION")
    private LocalDate renovacion;
    @Column(name = "DETALLE_RENOVACION", length = 1000)
    private String detalleRenovacion;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CENTRO", nullable = false, foreignKey = @ForeignKey(name = "FK_SRV_SER_CTR_CEN"))
    private Centro centro;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_SERVICIO", nullable = false, foreignKey = @ForeignKey(name = "FK_SRV_SER_CAT_TSE"))
    private Catalogo tipo;
    @Column(name = "CANT_MES_PERIODICIDAD", nullable = false, precision = 2)
    private int meses;
    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_CENTRO END")
    @Column(name = "CENTRO_VIGENTE")
    private Long centroVigente;
    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_TIPO_SERVICIO END")
    @Column(name = "TIPO_VIGENTE")
    private Long tipoVigente;
}
