package com.campus.issue.controller;

import com.campus.issue.auth.AuthStore.Principal;
import com.campus.issue.service.IssueService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final JdbcTemplate jdbc;
    private final IssueService issues;
    public AdminController(JdbcTemplate jdbc, IssueService issues) { this.jdbc = jdbc; this.issues = issues; }

    /** All issues from students and staff, with AI-bot verification result */
    @GetMapping("/issues")
    public List<Map<String, Object>> all() { return jdbc.queryForList("SELECT * FROM issues ORDER BY id DESC"); }

    /** Send job to management database */
    @PostMapping("/issues/{id}/forward")
    public Map<String, String> forward(@PathVariable long id, @RequestAttribute("principal") Principal p) {
        requirePending(id);
        issues.changeStatus(id, "SENT_TO_MANAGEMENT", "Forwarded by admin", p.name());
        return Map.of("status", "SENT_TO_MANAGEMENT");
    }

    /** Reject fake request */
    @PostMapping("/issues/{id}/reject")
    public Map<String, String> reject(@PathVariable long id, @RequestBody Map<String, String> b, @RequestAttribute("principal") Principal p) {
        requirePending(id);
        issues.changeStatus(id, "REJECTED", b.getOrDefault("reason", "Rejected as fake"), p.name());
        return Map.of("status", "REJECTED");
    }

    /** Resolve notifications (include staff name) */
    @GetMapping("/notifications")
    public List<Map<String, Object>> notifications() {
        return jdbc.queryForList("SELECT n.id,n.message,n.created_at,i.token_id,i.title FROM notifications n JOIN issues i ON i.id=n.issue_id ORDER BY n.id DESC");
    }

    private void requirePending(long id) {
        String s = (String) issues.get(id).get("status");
        if (!s.equals("AI_VERIFIED") && !s.equals("AI_FLAGGED"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue already processed");
    }
}
