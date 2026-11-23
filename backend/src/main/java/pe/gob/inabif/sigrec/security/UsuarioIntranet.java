package pe.gob.inabif.sigrec.security;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Crea el SGR_USUARIO de un usuario de la intranet en su primer ingreso. SPEC 039. */
@Service
class UsuarioIntranet {
    private static final String TECNICO = "SIGREC_TECNICO";
    private final UsuarioRepository usuarios;

    UsuarioIntranet(UsuarioRepository usuarios) { this.usuarios = usuarios; }

    /** Transacción propia: el llamador puede ser de solo lectura. Si otra petición lo creó antes, falla por unicidad. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void crear(IdentidadIntranet.Datos identidad) {
        var tecnico = usuarios.findByCodigo(TECNICO).orElseThrow(
                () -> new IllegalStateException("Falta el actor técnico " + TECNICO + "; cargue las semillas."));
        var alta = new Usuario();
        alta.setCodigo(identidad.sujeto());
        alta.setNombre(identidad.nombre());
        alta.setTipo("HUMANO");
        alta.setProveedor(Identidad.INTRANET);
        alta.setSujeto(identidad.sujeto());
        alta.registrar(tecnico);
        usuarios.save(alta);
    }
}
