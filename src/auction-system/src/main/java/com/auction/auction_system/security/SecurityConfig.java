package com.auction.auction_system.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.auction.auction_system.service.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authenticationProvider(authenticationProvider())

                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/test.html").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/auctions/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/sellers/**").permitAll()

                    // User profile
                    .requestMatchers("/api/users/profile").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/users/profile").authenticated()

                    // Orders — người mua
                    .requestMatchers(HttpMethod.GET,  "/api/orders/my-orders").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/orders/*/confirm-payment").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").authenticated()

                    // Orders — admin
                    .requestMatchers("/api/orders/**").hasRole("ADMIN")

                    // Admin
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/users/**").hasRole("ADMIN")
                    .requestMatchers("/api/categories/**").hasRole("ADMIN")

                    // Auctions
                    .requestMatchers(HttpMethod.POST, "/api/auctions").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/auctions/*/bids").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/auctions/*/buy-now").authenticated()
                    .requestMatchers("/uploads/**").permitAll()

                    // Notifications
                    .requestMatchers("/api/notifications/**").authenticated()

                    // Reports
                    .requestMatchers(HttpMethod.POST, "/api/reports").authenticated()
                    .requestMatchers("/api/reports/**").hasRole("ADMIN")

                    // PHẢI luôn đặt anyRequest() ở CUỐI CÙNG
                    .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(
            new BCryptPasswordEncoder()
        );

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}