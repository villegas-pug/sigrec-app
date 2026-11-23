package pe.gob.inabif.sigrec.perfil.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "SGR_PERFIL", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_PERFIL_COD", columnNames = "CODIGO"))
public class Perfil extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "NOMBRE", nullable = false, length = 120)
    private String nombre;
    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;
}
