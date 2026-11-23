package pe.gob.inabif.sigrec.perfil.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.permiso.model.Permiso;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "SGR_PERFIL_PERMISO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_PERFIL_PERMISO", columnNames = {"ID_PERFIL", "ID_PERMISO"}))
public class PerfilPermiso extends Auditable {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_PERFIL", nullable = false)
    private Perfil perfil;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_PERMISO", nullable = false)
    private Permiso permiso;
    @Column(name = "ORDEN")
    private Integer orden;
}
