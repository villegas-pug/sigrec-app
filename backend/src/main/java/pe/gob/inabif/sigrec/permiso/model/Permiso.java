package pe.gob.inabif.sigrec.permiso.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;

@Getter
@Setter
@Entity
@Table(name = "SGR_PERMISO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_PERMISO_COD", columnNames = {"TIPO", "CODIGO"}))
@Check(name = "SGR_CK_PERMISO_TIPO", constraints = "TIPO in ('RUTA', 'ACCION')")
public class Permiso extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "NOMBRE", nullable = false, length = 120)
    private String nombre;
    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;
    @Column(name = "TIPO", nullable = false, length = 6)
    private String tipo;
}
