package pe.gob.inabif.sigrec.auth.controller;

import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.config.SecurityConfig;
import pe.gob.inabif.sigrec.auth.service.AuthService;
import pe.gob.inabif.sigrec.auth.dtos.CreateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.UpdateAuthRequest;
import pe.gob.inabif.sigrec.auth.dtos.AuthResponse;
import pe.gob.inabif.sigrec.auth.dtos.CsrfResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(SecurityConfig.AUTH)
public class AuthController {
    private final AuthService auth;
    private final CookieCsrfTokenRepository csrf;
    private final boolean secure;

    public AuthController(AuthService auth, CookieCsrfTokenRepository csrf,
                   @Value("${sigrec.security.cookie-secure}") boolean secure) {
        this.auth = auth;
        this.csrf = csrf;
        this.secure = secure;
    }

    @GetMapping("/csrf")
    ApiResponse<CsrfResponse> csrf(CsrfToken token) {
        return ApiResponse.ok(new CsrfResponse(token.getHeaderName(), token.getToken()));
    }

    @PostMapping("/login")
    ApiResponse<Void> login(@Valid @RequestBody CreateAuthRequest login, HttpServletRequest request, HttpServletResponse response) {
        var token = auth.iniciar(login);
        cookie(response, token.valor(), token.duracion());
        csrf.saveToken(null, request, response);
        return ApiResponse.ok(null);
    }

    @GetMapping("/me")
    ApiResponse<AuthResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(auth.consultar(Long.valueOf(jwt.getSubject())));
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request, HttpServletResponse response) {
        auth.cerrar(new UpdateAuthRequest(jwt.getId()));
        cookie(response, "", Duration.ZERO);
        csrf.saveToken(null, request, response);
        return ApiResponse.ok(null);
    }

    private void cookie(HttpServletResponse response, String value, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(SecurityConfig.COOKIE, value)
                .httpOnly(true).secure(secure).sameSite("Lax").path("/api").maxAge(maxAge).build().toString());
    }

}
