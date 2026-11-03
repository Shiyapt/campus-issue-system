package com.campus.issue.auth;

import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final AuthStore store;
    public AuthInterceptor(AuthStore store) { this.store = store; }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) throws Exception {
        if ("OPTIONS".equals(req.getMethod())) return true;
        String header = req.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : req.getParameter("t"); // ?t= for <img>/<video>
        AuthStore.Principal p = store.get(token);
        String path = req.getRequestURI();
        boolean reporter = p != null && (p.role().equals("STUDENT") || p.role().equals("STAFF"));

        boolean ok = true;
        if (path.startsWith("/api/admin")) ok = p != null && p.role().equals("ADMIN");
        else if (path.startsWith("/api/management")) ok = p != null && p.role().equals("MANAGEMENT");
        else if (path.startsWith("/api/files")) ok = p != null && (p.role().equals("ADMIN") || p.role().equals("MANAGEMENT"));
        else if (path.startsWith("/api/issues")) ok = reporter;   // report + track: students and college staff only

        if (!ok) { res.sendError(401, "Unauthorized"); return false; }
        req.setAttribute("principal", p);
        return true;
    }
}
