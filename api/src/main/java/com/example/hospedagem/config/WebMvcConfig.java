package com.example.hospedagem.config;

import com.example.hospedagem.security.AuditoriaInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Registra o interceptor de auditoria para todas as rotas da API. */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuditoriaInterceptor auditoriaInterceptor;

    public WebMvcConfig(AuditoriaInterceptor auditoriaInterceptor) {
        this.auditoriaInterceptor = auditoriaInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditoriaInterceptor).addPathPatterns("/api/**");
    }
}
