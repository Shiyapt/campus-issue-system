package com.campus.issue.auth;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Simple in-memory session store. Swap for JWT / Spring Security for production. */
@Component
public class AuthStore {
    public record Principal(String role, String id, String name) {}
    private final Map<String, Principal> tokens = new ConcurrentHashMap<>();

    public String issue(Principal p) { String t = UUID.randomUUID().toString(); tokens.put(t, p); return t; }
    public Principal get(String t) { return t == null ? null : tokens.get(t); }
}
