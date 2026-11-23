package pe.gob.inabif.sigrec.usuario.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.perfil.model.Perfil;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;

@Getter
@Setter
@Entity
@Table(name = "SGR_USUARIO_PERFIL", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_USUARIO_PERFIL",
    columnNames = {"ID_USUARIO", "ID_PERFIL", "ALCANCE", "ID_CENTRO", "CODIGO_VEHICULO"}))
@Check(name = "SGR_CK_AMBITO_PERFIL", constraints = """
    (ALCANCE = 'GLOBAL' and ID_CENTRO is null and CODIGO_VEHICULO is null)
    or (ALCANCE = 'CENTRO' and ID_CENTRO is not null and CODIGO_VEHICULO is null)
    or (ALCANCE = 'VEHICULO' and ID_CENTRO is null and CODIGO_VEHICULO is not null)
    """)
public class UsuarioPerfil extends Auditable {
    public enum Alcance { GLOBAL, CENTRO, VEHICULO }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    private Usuario usuario;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_PERFIL", nullable = false)
    private Perfil perfil;
    @Enumerated(EnumType.STRING)
    @Column(name = "ALCANCE", nullable = false, length = 8)
    private Alcance alcance;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CENTRO")
    private Centro centro;
    @Column(name = "CODIGO_VEHICULO", length = 40)
    private String vehiculo;
}
