package com.campus.issue.controller;

import com.campus.issue.auth.AuthStore;
import com.campus.issue.auth.AuthStore.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final JdbcTemplate jdbc;
    private final AuthStore store;
    private final BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
    public AuthController(JdbcTemplate jdbc, AuthStore store) { this.jdbc = jdbc; this.store = store; }

    /** Student: verify USN + name + DOB + QR code */
    @PostMapping("/student")
    public Map<String, Object> student(@RequestBody Map<String, String> b) {
        var r = jdbc.queryForList("SELECT usn,name FROM students WHERE usn=? AND LOWER(name)=LOWER(?) AND dob=? AND qr_code=?",
                b.get("usn"), b.get("name"), b.get("dob"), b.get("qrCode"));
        if (r.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid student credentials");
        return session("STUDENT", (String) r.get(0).get("usn"), (String) r.get(0).get("name"));
    }

    /** College staff: QR + name + emp_id */
    @PostMapping("/staff")
    public Map<String, Object> staff(@RequestBody Map<String, String> b) {
        var r = jdbc.queryForList("SELECT emp_id,name FROM college_staff WHERE emp_id=? AND LOWER(name)=LOWER(?) AND qr_code=?",
                b.get("empId"), b.get("name"), b.get("qrCode"));
        if (r.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid staff credentials");
        return session("STAFF", (String) r.get(0).get("emp_id"), (String) r.get(0).get("name"));
    }

    /** Admin + Management login (credentials issued by admin) */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> b) {
        var r = jdbc.queryForList("SELECT * FROM users WHERE username=?", b.get("username"));
        if (r.isEmpty() || !enc.matches(b.get("password"), (String) r.get(0).get("password_hash")))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        var u = r.get(0);
        return session((String) u.get("role"), (String) u.get("username"), (String) u.get("name"));
    }

    private Map<String, Object> session(String role, String id, String name) {
        String t = store.issue(new Principal(role, id, name));
        return Map.of("token", t, "role", role, "id", id, "name", name);
    }
}
