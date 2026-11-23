package pe.gob.inabif.sigrec.auth.service;

import pe.gob.inabif.sigrec.auth.dtos.AuthResponse;
import pe.gob.inabif.sigrec.auth.dtos.CreateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.UpdateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.TokenResponse;

public interface AuthService {
    TokenResponse iniciar(CreateAuthRequest request);
    AuthResponse consultar(Long usuario);
    void cerrar(UpdateAuthRequest request);
}
