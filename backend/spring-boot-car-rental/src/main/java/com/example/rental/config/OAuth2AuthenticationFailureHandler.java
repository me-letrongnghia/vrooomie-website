package com.example.rental.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@Slf4j
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.authorized-redirect-uris}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                      AuthenticationException exception) throws IOException {
        
        // Log the technical error for debugging
        log.error("OAuth2 authentication failed: {}", exception.getMessage(), exception);
        
        // Convert to user-friendly error message
        String userFriendlyError = getUserFriendlyErrorMessage(exception);
        
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("accessToken", "")
            .queryParam("refreshToken", "")
            .queryParam("error", userFriendlyError)
            .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String getUserFriendlyErrorMessage(AuthenticationException exception) {
        if (exception instanceof OAuth2AuthenticationException) {
            OAuth2AuthenticationException oauth2Exception = (OAuth2AuthenticationException) exception;
            String errorCode = oauth2Exception.getError().getErrorCode();
            
            switch (errorCode) {
                case "access_denied":
                    return "Bạn đã từ chối quyền truy cập. Vui lòng thử lại.";
                case "invalid_request":
                    return "Yêu cầu không hợp lệ. Vui lòng thử lại.";
                case "unauthorized_client":
                    return "Ứng dụng không được ủy quyền. Vui lòng liên hệ hỗ trợ.";
                case "unsupported_response_type":
                case "invalid_scope":
                    return "Cấu hình không hợp lệ. Vui lòng liên hệ hỗ trợ.";
                default:
                    return "Đăng nhập thất bại. Vui lòng thử lại.";
            }
        }
        
        // Generic error message for other authentication exceptions
        return "Đăng nhập thất bại. Vui lòng thử lại.";
    }
}
