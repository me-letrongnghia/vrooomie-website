package com.example.rental.filter;

import com.example.rental.entity.User;
import com.example.rental.repository.UserRepository;
import com.example.rental.utils.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import io.jsonwebtoken.ExpiredJwtException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        System.out.println("JWT Filter - Request URI: " + request.getRequestURI());
        System.out.println("JWT Filter - Auth Header: " + (authHeader != null ? authHeader.substring(0, Math.min(30, authHeader.length())) + "..." : "null"));

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("JWT Filter - No valid Authorization header, proceeding without authentication");
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        String email = null;
        try {
            email = jwtUtil.extractEmail(token);
            System.out.println("JWT Filter - Extracted email from token: " + email);
        } catch (ExpiredJwtException e) {
            System.out.println("JWT Filter - Token expired: " + e.getMessage());
            // Token hết hạn, cho qua filter chain như anonymous
            filterChain.doFilter(request, response);
            return;
        } catch (Exception e) {
            System.out.println("JWT Filter - Invalid token: " + e.getMessage());
            // Token không hợp lệ, cho qua filter chain như anonymous
            filterChain.doFilter(request, response);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findByEmail(email).orElse(null);
            System.out.println("JWT Filter - User found in database: " + (user != null ? user.getEmail() + " (ID: " + user.getId() + ")" : "null"));

            if (user != null && jwtUtil.isTokenValid(token, user)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(user, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("JWT Filter - Authentication set successfully for user: " + user.getEmail());
            } else {
                System.out.println("JWT Filter - Authentication failed - user null or token invalid");
            }
        } else {
            System.out.println("JWT Filter - Skipping authentication - email: " + email + ", existing auth: " + 
                (SecurityContextHolder.getContext().getAuthentication() != null));
        }

        filterChain.doFilter(request, response);
    }
}
