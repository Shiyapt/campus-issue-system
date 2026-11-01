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

    private final BCryptPasswordEncoder enc =
            new BCryptPasswordEncoder();

    public AuthController(JdbcTemplate jdbc, AuthStore store) {
        this.jdbc = jdbc;
        this.store = store;
    }


    // STUDENT LOGIN

    @PostMapping("/student")
    public Map<String, Object> student(
            @RequestBody Map<String, String> b) {

        var r = jdbc.queryForList(
                """
                SELECT usn, name
                FROM students
                WHERE usn = ?
                AND LOWER(name) = LOWER(?)
                AND dob = ?
                AND qr_code = ?
                """,
                b.get("usn"),
                b.get("name"),
                b.get("dob"),
                b.get("qrCode")
        );

        if (r.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid student credentials"
            );
        }

        return session(
                "STUDENT",
                (String) r.get(0).get("usn"),
                (String) r.get(0).get("name")
        );
    }


    // STAFF LOGIN

    @PostMapping("/staff")
    public Map<String, Object> staff(
            @RequestBody Map<String, String> b) {

        var r = jdbc.queryForList(
                """
                SELECT emp_id, name
                FROM college_staff
                WHERE emp_id = ?
                AND LOWER(name) = LOWER(?)
                AND qr_code = ?
                """,
                b.get("empId"),
                b.get("name"),
                b.get("qrCode")
        );

        if (r.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid staff credentials"
            );
        }

        return session(
                "STAFF",
                (String) r.get(0).get("emp_id"),
                (String) r.get(0).get("name")
        );
    }


    // ADMIN AND MANAGEMENT LOGIN

    @PostMapping("/login")
    public Map<String, Object> login(
            @RequestBody Map<String, String> b) {

        String username = b.get("username");
        String password = b.get("password");

        if (username == null || password == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Username and password are required"
            );
        }

        var r = jdbc.queryForList(
                "SELECT * FROM users WHERE username = ?",
                username
        );

        if (r.isEmpty() ||
                !enc.matches(
                        password,
                        (String) r.get(0).get("password_hash")
                )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid username or password"
            );
        }

        var u = r.get(0);

        return session(
                (String) u.get("role"),
                (String) u.get("username"),
                (String) u.get("name")
        );
    }


    // CHANGE PASSWORD

    @PostMapping("/change-password")
    public Map<String, String> changePassword(
            @RequestBody Map<String, String> b) {

        String username = b.get("username");
        String currentPassword = b.get("currentPassword");
        String newPassword = b.get("newPassword");

        // Validate fields
        if (username == null ||
                currentPassword == null ||
                newPassword == null ||
                username.isBlank() ||
                currentPassword.isBlank() ||
                newPassword.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All fields are required"
            );
        }

        // Validate new password
        if (newPassword.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must contain at least 8 characters"
            );
        }

        // Find account
        var users = jdbc.queryForList(
                """
                SELECT username, password_hash, role
                FROM users
                WHERE username = ?
                """,
                username
        );

        if (users.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Account not found"
            );
        }

        var user = users.get(0);

        String role = (String) user.get("role");
        String storedHash = (String) user.get("password_hash");

        // Allow only Admin and Management
        if (!"ADMIN".equals(role) &&
                !"MANAGEMENT".equals(role)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Password change is not allowed for this account"
            );
        }

        // Verify current password
        if (!enc.matches(currentPassword, storedHash)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Current password is incorrect"
            );
        }

        // Prevent same password
        if (enc.matches(newPassword, storedHash)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must be different from current password"
            );
        }

        // Generate new BCrypt hash
        String newHash = enc.encode(newPassword);

        // Update database
        jdbc.update(
                """
                UPDATE users
                SET password_hash = ?
                WHERE username = ?
                """,
                newHash,
                username
        );

        return Map.of(
                "message",
                "Password changed successfully"
        );
    }


    // CREATE SESSION

    private Map<String, Object> session(
            String role,
            String id,
            String name) {

        String token = store.issue(
                new Principal(role, id, name)
        );

        return Map.of(
                "token", token,
                "role", role,
                "id", id,
                "name", name
        );
    }
}