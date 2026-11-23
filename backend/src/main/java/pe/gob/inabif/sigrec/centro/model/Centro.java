package pe.gob.inabif.sigrec.centro.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.hibernate.annotations.Check;

@Getter
@Setter
@Entity
@Table(name = "SGR_CENTRO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_CENTRO_COD", columnNames = "CODIGO"))
@Check(name = "SGR_CK_CENTRO_CONDICION", constraints = "CONDICION_INMUEBLE in ('PROPIO', 'ALQUILADO') and (CONDICION_INMUEBLE = 'ALQUILADO' or (ARRENDADOR is null and FEC_FIN_CONTRATO is null))")
public class Centro extends Auditable {
    @Column(name = "CODIGO", length = 3, nullable = false)
    private String codigo;
    @Column(name = "NOMBRE", length = 180, nullable = false)
    private String nombre;
    @Column(name = "DIRECCION", length = 250)
    private String direccion;
    @Column(name = "CONDICION_INMUEBLE", length = 10, nullable = false)
    private String condicionInmueble;
    @Column(name = "ARRENDADOR", length = 180)
    private String arrendador;
    @Column(name = "FEC_FIN_CONTRATO")
    private LocalDate contratoHasta;
    @Column(name = "REFERENCIA_FUNDACION", length = 180)
    private String fundacion;
    @Column(name = "NOTA_FUNDACION", length = 1000)
    private String fundacionNota;
    @Column(name = "LITIGIOS", length = 1000)
    private String litigios;
    @Column(name = "MATERIAL", length = 180)
    private String material;
    @Column(name = "ANTIGUEDAD", length = 100)
    private String antiguedad;
    @Column(name = "NOTA_ANTIGUEDAD", length = 1000)
    private String antiguedadNota;
    @Column(name = "CANT_PISO")
    private Integer pisos;
    @Column(name = "AREA_CONSTRUIDA_M2", precision = 12, scale = 2)
    private BigDecimal areaM2;
    @Column(name = "AREA_TERRENO_M2", precision = 12, scale = 2)
    private BigDecimal areaTerrenoM2;
    @Column(name = "CARACTERISTICAS", length = 1000)
    private String caracteristicas;
    @Column(name = "CANT_EXTINTOR_REQUERIDO")
    private Integer extintores;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONDICION")
    private Catalogo condicion;
    public String codigo() { return codigo; }
    public String nombre() { return nombre; }
}
