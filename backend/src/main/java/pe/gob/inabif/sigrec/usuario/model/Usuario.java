package pe.gob.inabif.sigrec.usuario.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;

@Getter
@Setter
@Entity
@Table(name = "SGR_USUARIO", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_USUARIO_COD", columnNames = "CODIGO"),
    @UniqueConstraint(name = "SGR_UK_USUARIO_IDENT", columnNames = {"PROVEEDOR_IDENTIDAD", "SUJETO_IDENTIDAD"})
})
@AssociationOverride(name = "registradoPor", joinColumns = @JoinColumn(name = "USU_REGISTRA", nullable = false),
    foreignKey = @ForeignKey(name = "SGR_FK_USUARIO_REG", foreignKeyDefinition = "foreign key (USU_REGISTRA) references SGR_USUARIO (ID) deferrable initially immediate"))
@Check(name = "SGR_CK_USUARIO_IDENT", constraints = """
    (TIPO = 'TECNICO' and PROVEEDOR_IDENTIDAD is null and SUJETO_IDENTIDAD is null and PASSWORD_HASH is null)
    or (TIPO = 'HUMANO' and PROVEEDOR_IDENTIDAD is not null and SUJETO_IDENTIDAD is not null
        and ((PROVEEDOR_IDENTIDAD = 'LOCAL' and PASSWORD_HASH is not null)
             or (PROVEEDOR_IDENTIDAD <> 'LOCAL' and PASSWORD_HASH is null)))
    """)
public class Usuario extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "NOMBRE", nullable = false, length = 180)
    private String nombre;
    @Column(name = "TIPO", nullable = false, length = 10)
    private String tipo;
    @Column(name = "PROVEEDOR_IDENTIDAD", length = 80)
    private String proveedor;
    @Column(name = "SUJETO_IDENTIDAD", length = 250)
    private String sujeto;
    @Column(name = "PASSWORD_HASH", length = 60)
    private String passwordHash;

    public String nombre() { return nombre; }
    public boolean humano() { return "HUMANO".equals(tipo); }
}
