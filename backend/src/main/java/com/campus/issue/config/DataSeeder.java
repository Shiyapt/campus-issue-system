package com.campus.issue.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds demo data. Replace with real student/staff/admin data in production. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final JdbcTemplate jdbc;
    public DataSeeder(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override public void run(String... args) {
        var enc = new BCryptPasswordEncoder();
        if (jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class) == 0) {
            jdbc.update("INSERT INTO users(username,password_hash,role,name) VALUES (?,?,?,?)", "admin", enc.encode("admin123"), "ADMIN", "Campus Admin");
            jdbc.update("INSERT INTO users(username,password_hash,role,name) VALUES (?,?,?,?)", "mgmt1", enc.encode("mgmt123"), "MANAGEMENT", "Management Staff 1");
        }
        jdbc.update("INSERT IGNORE INTO students VALUES ('1AB21CS001','Demo Student','2003-05-10','QR-STU-001')");
        jdbc.update("INSERT IGNORE INTO college_staff VALUES ('EMP001','Demo Faculty','QR-EMP-001')");
    }
}
