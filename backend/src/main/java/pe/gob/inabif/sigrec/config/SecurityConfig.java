package pe.gob.inabif.sigrec.config;

import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.auth.service.SesionService;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.*;
import org.springframework.web.util.WebUtils;

@Configuration(proxyBeanMethods = false)
public class SecurityConfig {
    public static final String COOKIE = "SIGREC_SESSION";
    public static final String AUTH = "/api/v1/auth";

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, ObjectMapper json, CookieCsrfTokenRepository csrf,
                                    JwtDecoder decoder) throws Exception {
        var proveedor = new JwtAuthenticationProvider(decoder);
        var filtroJwt = new BearerTokenAuthenticationFilter(proveedor::authenticate);
        filtroJwt.setBearerTokenResolver(request -> {
            String path = request.getServletPath().isEmpty() ? request.getRequestURI() : request.getServletPath();
            if (path.equals(AUTH + "/login") || path.equals(AUTH + "/csrf")) return null;
            var cookie = WebUtils.getCookie(request, COOKIE);
            return cookie == null ? null : cookie.getValue();
        });
        filtroJwt.setAuthenticationEntryPoint(
                (request, response, error) -> write(json, response, 401, "La sesión no está vigente."));
        return http
                .cors(cors -> {})
                // AuthController rota CSRF al iniciar y cerrar sesión, no al comprobar cada JWT.
                .csrf(config -> config.csrfTokenRepository(csrf)
                        .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(rules -> rules
                        .requestMatchers(HttpMethod.GET, AUTH + "/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, AUTH + "/login").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, error) -> write(json, response, 401, "Inicie sesión para continuar."))
                        .accessDeniedHandler((request, response, error) -> write(json, response, 403, "No tiene permiso o la solicitud no incluye un token CSRF válido.")))
                // La cookie requiere CSRF también en solicitudes autenticadas por JWT.
                .addFilter(filtroJwt)
                .build();
    }

    private void write(ObjectMapper json, HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getOutputStream(), new ApiResponse<>(status, message, null));
    }

    @Bean
    CookieCsrfTokenRepository csrf(@Value("${sigrec.security.cookie-secure}") boolean secure) {
        var repository = new CookieCsrfTokenRepository();
        repository.setCookieCustomizer(cookie -> cookie.secure(secure).httpOnly(true).sameSite("Lax").path("/"));
        return repository;
    }

    @Bean
    CorsConfigurationSource cors(@Value("${sigrec.security.cors-origin}") String origin) {
        var uri = java.net.URI.create(origin);
        if ((!origin.startsWith("http://") && !origin.startsWith("https://"))
                || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null
                || uri.getFragment() != null || !uri.getPath().isEmpty()) {
            throw new IllegalArgumentException("Configure un origen CORS exacto para SIGREC.");
        }
        var c = new CorsConfiguration();
        c.setAllowedOrigins(List.of(origin));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "OPTIONS"));
        c.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        c.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", c);
        return source;
    }

    @Bean
    SecretKey jwtKey(@Value("${sigrec.security.jwt.secret}") String secret) {
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) throw new IllegalArgumentException("Configure una clave JWT de al menos 32 bytes.");
        return new SecretKeySpec(key, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key, SesionService sesiones, @Value("${sigrec.security.jwt.issuer}") String issuer,
                          @Value("${sigrec.security.jwt.audience}") String audience) {
        var decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> claims = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                token -> token.getAudience() != null && token.getAudience().contains(audience) && token.getExpiresAt() != null
                        ? OAuth2TokenValidatorResult.success() : invalid());
        decoder.setJwtValidator(token -> {
            var result = claims.validate(token);
            return result.hasErrors() ? result : (sesiones.vigente(token) ? OAuth2TokenValidatorResult.success() : invalid());
        });
        return decoder;
    }

    private static OAuth2TokenValidatorResult invalid() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "La sesión no está vigente.", null));
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
}
