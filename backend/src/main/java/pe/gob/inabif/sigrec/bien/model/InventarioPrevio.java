package pe.gob.inabif.sigrec.bien.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
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
@Table(name = "SGR_INVENTARIO_PREVIO", uniqueConstraints = {
    @UniqueConstraint(name = "UK_BIE_PRE_CODIGO", columnNames = {"CODIGO"}),
    @UniqueConstraint(name = "UK_BIE_PRE_BIEN", columnNames = {"ID_BIEN"})
}, indexes = {
    @Index(name = "IX_BIE_PRE_CTR_CEN", columnList = "ID_CENTRO"),
    @Index(name = "IX_BIE_PRE_BIE_TIP", columnList = "ID_TIPO_BIEN"),
    @Index(name = "IX_BIE_PRE_CAT_COND", columnList = "ID_CONDICION")
})
@Check(name = "CK_BIE_PRE_ADQ_PAR", constraints = "(FEC_ADQUISICION IS NULL AND PRECISION_ADQ IS NULL) OR (FEC_ADQUISICION IS NOT NULL AND PRECISION_ADQ IS NOT NULL)")
@Check(name = "CK_BIE_PRE_PREC_ADQ", constraints = "PRECISION_ADQ IS NULL OR (PRECISION_ADQ = 'ANIO' AND FEC_ADQUISICION = TRUNC(FEC_ADQUISICION, 'YYYY')) OR (PRECISION_ADQ = 'MES' AND FEC_ADQUISICION = TRUNC(FEC_ADQUISICION, 'MM'))")
public class InventarioPrevio extends Auditable {
    @Column(name = "CODIGO", length = 40, nullable = false)
    private String codigo;

    @Column(name = "NOMBRE", length = 180, nullable = false)
    private String nombre;

    @Column(name = "MARCA_MODELO", length = 180)
    private String marcaModelo;

    @Column(name = "SERIE", length = 120)
    private String serie;

    @Column(name = "CODIGO_PATRIMONIAL", length = 80)
    private String codigoPatrimonial;

    @Column(name = "UBICACION_PREVIA", length = 1000)
    private String ubicacionPrevia;

    @Column(name = "FEC_ADQUISICION")
    private LocalDate fechaAdquisicion;

    @Column(name = "PRECISION_ADQ", length = 4)
    private String precisionAdquisicion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CENTRO", nullable = false)
    private Centro centro;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_BIEN", nullable = false)
    private Catalogo tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONDICION")
    private Catalogo condicion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_BIEN")
    private Bien bien;
}
