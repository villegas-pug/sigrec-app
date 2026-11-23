package pe.gob.inabif.sigrec.permiso.repository;

import pe.gob.inabif.sigrec.permiso.model.Permiso;
import java.util.*;

@org.springframework.stereotype.Repository
public interface PermisoJpaRepository extends org.springframework.data.jpa.repository.JpaRepository<Permiso, Long> {}
