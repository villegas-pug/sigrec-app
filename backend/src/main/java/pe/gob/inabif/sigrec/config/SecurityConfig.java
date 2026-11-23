package pe.gob.inabif.sigrec.config;

import pe.gob.inabif.sigrec.security.IdentidadIntranet;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

/**
 * SPEC 039: SIGREC se abre desde la intranet y no tiene sesión propia. El API no usa cookies, por lo que
 * CSRF no aplica; la identidad viaja en la cabecera {@code X-Usuario-Id} y la resuelve {@code Acceso}.
 */
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> {})
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(rules -> rules.anyRequest().permitAll())
                .build();
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
        c.setAllowedHeaders(List.of("Content-Type", IdentidadIntranet.CABECERA_ID, IdentidadIntranet.CABECERA_NOMBRE));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", c);
        return source;
    }
}
