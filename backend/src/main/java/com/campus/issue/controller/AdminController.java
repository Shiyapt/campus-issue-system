package com.campus.issue.controller;

import com.campus.issue.service.IssueService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/** Admin = college-wide READ-ONLY monitoring. No endpoint here changes an issue. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final JdbcTemplate jdbc;
    private final IssueService issues;
    public AdminController(JdbcTemplate jdbc, IssueService issues) { this.jdbc = jdbc; this.issues = issues; }

    @GetMapping("/issues")
    public List<Map<String, Object>> all() { return jdbc.queryForList("SELECT * FROM issues ORDER BY id DESC"); }

    /** Full history (public + internal) for monitoring */
    @GetMapping("/issues/{id}/updates")
    public List<Map<String, Object>> updates(@PathVariable long id) { return issues.history(id); }

    @GetMapping("/report")
    public Map<String, Object> report() {
        return Map.of(
            "total", jdbc.queryForObject("SELECT COUNT(*) FROM issues", Integer.class),
            "byStatus", jdbc.queryForList("SELECT status, COUNT(*) AS count FROM issues GROUP BY status ORDER BY count DESC"),
            "byCategory", jdbc.queryForList("SELECT category, COUNT(*) AS count FROM issues GROUP BY category ORDER BY count DESC"),
            "byManagement", jdbc.queryForList("SELECT COALESCE(assigned_management,'Not yet picked up') AS name, COUNT(*) AS count FROM issues GROUP BY name ORDER BY count DESC"));
    }

    @GetMapping("/notifications")
    public List<Map<String, Object>> notifications() {
        return jdbc.queryForList("SELECT n.id,n.message,n.created_at,i.token_id,i.title FROM notifications n JOIN issues i ON i.id=n.issue_id ORDER BY n.id DESC");
    }
}
