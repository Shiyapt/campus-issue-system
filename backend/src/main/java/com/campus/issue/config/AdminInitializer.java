package com.campus.issue.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public AdminInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {

        createUser(
                "admin",
                "Admin@123",
                "ADMIN",
                "Campus Admin"
        );

        createUser(
                "mgmt1",
                "Mgmt@123",
                "MANAGEMENT",
                "Management Staff 1"
        );
    }

    private void createUser(
            String username,
            String password,
            String role,
            String name) {

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = ?",
                Integer.class,
                username
        );

        if (count != null && count > 0) {

            System.out.println(
                    username + " already exists. Password unchanged."
            );

            return;
        }

        String hashedPassword = encoder.encode(password);

        jdbc.update(
                """
                INSERT INTO users
                (username, password_hash, role, name)
                VALUES (?, ?, ?, ?)
                """,
                username,
                hashedPassword,
                role,
                name
        );

        System.out.println(
                username + " account created successfully."
        );
    }
}