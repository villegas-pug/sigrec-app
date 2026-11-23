package pe.gob.inabif.sigrec.bien.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
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
@Table(name = "SGR_BIEN", uniqueConstraints = {
    @UniqueConstraint(name = "UK_BIE_BIE_ROTULO", columnNames = {"ROTULO"})
}, indexes = {
    @Index(name = "IX_BIE_BIE_CTR_AMB", columnList = "ID_AMBIENTE"),
    @Index(name = "IX_BIE_BIE_BIE_TIP", columnList = "ID_TIPO_BIEN"),
    @Index(name = "IX_BIE_BIE_CAT_CAB", columnList = "ID_CATEGORIA_BIEN"),
    @Index(name = "IX_BIE_BIE_CAT_COND", columnList = "ID_CONDICION"),
    @Index(name = "IX_BIE_BIE_PRINCIPAL", columnList = "ID_PRINCIPAL_BIEN")
})
@Check(name = "CK_BIE_BIE_CANT_UNIDAD", constraints = "CANT_UNIDAD > 0")
@Check(name = "CK_BIE_BIE_MONTO_ADQUISICION", constraints = "MONTO_ADQUISICION >= 0")
@Check(name = "CK_BIE_BIE_CANT_ANIO_VIDA_UTIL", constraints = "CANT_ANIO_VIDA_UTIL > 0")
@Check(name = "CK_BIE_BIE_ADQ_PAR", constraints = "(FEC_ADQUISICION IS NULL AND PRECISION_ADQ IS NULL) OR (FEC_ADQUISICION IS NOT NULL AND PRECISION_ADQ IS NOT NULL)")
@Check(name = "CK_BIE_BIE_PREC_ADQ", constraints = "PRECISION_ADQ IS NULL OR (PRECISION_ADQ = 'ANIO' AND FEC_ADQUISICION = TRUNC(FEC_ADQUISICION, 'YYYY')) OR (PRECISION_ADQ = 'MES' AND FEC_ADQUISICION = TRUNC(FEC_ADQUISICION, 'MM'))")
@Check(name = "CK_BIE_BIE_PRINCIPAL", constraints = "ID <> ID_PRINCIPAL_BIEN")
@Check(name = "CK_BIE_BIE_POSICION", constraints = "ID_PRINCIPAL_BIEN IS NOT NULL OR POSICION_COMPONENTE IS NULL")
public class Bien extends Auditable {
    @Column(name = "ROTULO", length = 80, nullable = false)
    private String rotulo;

    @Column(name = "NOMBRE", length = 180, nullable = false)
    private String nombre;

    @Column(name = "CODIGO_PATRIMONIAL", length = 80)
    private String codigoPatrimonial;

    @Column(name = "MARCA_MODELO", length = 180)
    private String marcaModelo;

    @Column(name = "SERIE", length = 120)
    private String serie;

    @Column(name = "DESCRIPCION", length = 1000)
    private String descripcion;

    @Column(name = "DETERIORO", length = 1000)
    private String deterioro;

    @Column(name = "CANT_UNIDAD", nullable = false)
    private Integer cantidad;

    @Column(name = "POSICION_COMPONENTE", length = 180)
    private String posicion;

    @Column(name = "MONTO_ADQUISICION", precision = 14, scale = 2)
    private BigDecimal costo;

    @Column(name = "CANT_ANIO_VIDA_UTIL")
    private Integer vidaUtilAnios;

    @Column(name = "FEC_ADQUISICION")
    private LocalDate fechaAdquisicion;

    @Column(name = "PRECISION_ADQ", length = 4)
    private String precisionAdquisicion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_AMBIENTE", nullable = false)
    private Ambiente ambiente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_BIEN", nullable = false)
    private Catalogo tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CATEGORIA_BIEN", nullable = false)
    private Catalogo categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONDICION")
    private Catalogo condicion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PRINCIPAL_BIEN")
    private Bien principal;
}
