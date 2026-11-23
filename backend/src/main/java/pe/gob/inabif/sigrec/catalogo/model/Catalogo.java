package pe.gob.inabif.sigrec.catalogo.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import java.util.Locale;

@Getter
@Setter
@Entity
@Table(name = "SGR_CATALOGO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_CATALOGO_DOM_COD", columnNames = {"DOMINIO", "CODIGO"}))
public class Catalogo extends Auditable {
    @Column(name = "DOMINIO", nullable = false, length = 30)
    private String dominio;
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "NOMBRE", nullable = false, length = 180)
    private String nombre;
    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;
    @Column(name = "OBJETIVO", length = 8)
    private String objetivo;
    @Column(name = "CANT_MES_SUGERIDO")
    private Integer mesesSugeridos;
    @Column(name = "CANT_ANIO_VIDA_UTIL")
    private Integer vidaUtilSugerida;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CATEGORIA_BIEN")
    private Catalogo categoria;

    public String codigo() { return codigo.toLowerCase(Locale.ROOT); }
    public String nombre() { return nombre; }
}
