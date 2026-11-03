package com.campus.issue.config;

import com.campus.issue.auth.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AuthInterceptor interceptor;
    public WebConfig(AuthInterceptor interceptor) { this.interceptor = interceptor; }

    @Override public void addInterceptors(InterceptorRegistry r) { r.addInterceptor(interceptor).addPathPatterns("/api/**"); }
    @Override public void addCorsMappings(CorsRegistry r) {
        r.addMapping("/api/**").allowedOrigins("http://localhost:5173").allowedMethods("*").allowedHeaders("*");
    }
}
