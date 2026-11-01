package com.campus.issue.controller;

import com.campus.issue.auth.AuthStore.Principal;
import com.campus.issue.service.IssueService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/** Management portal: verify -> send request to staff -> resolve (only updates the DB) */
@RestController
@RequestMapping("/api/management")
public class ManagementController {
    private static final Map<String, String> NEXT = Map.of(
            "SENT_TO_MANAGEMENT", "VERIFIED",
            "VERIFIED", "STAFF_REQUESTED",
            "STAFF_REQUESTED", "RESOLVED");
    private final JdbcTemplate jdbc;
    private final IssueService issues;
    public ManagementController(JdbcTemplate jdbc, IssueService issues) { this.jdbc = jdbc; this.issues = issues; }

    @GetMapping("/issues")
    public List<Map<String, Object>> list() {
        return jdbc.queryForList("SELECT * FROM issues WHERE status IN ('SENT_TO_MANAGEMENT','VERIFIED','STAFF_REQUESTED','RESOLVED') ORDER BY id DESC");
    }

    /** Move an issue one step forward in the pipeline */
    @PostMapping("/issues/{id}/progress")
    public Map<String, String> progress(@PathVariable long id, @RequestBody Map<String, String> b, @RequestAttribute("principal") Principal p) {
        var issue = issues.get(id);
        String next = NEXT.get((String) issue.get("status"));
        if (next == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nothing further to do for this issue");

        String note = b.getOrDefault("note", "");
        if (next.equals("STAFF_REQUESTED")) {
            String staff = b.get("staffName");
            if (staff == null || staff.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Staff name required");
            jdbc.update("UPDATE issues SET assigned_to=? WHERE id=?", staff, id);
            note = "Request sent to " + staff + (note.isBlank() ? "" : " - " + note);
        }
        issues.changeStatus(id, next, note, p.name());

        if (next.equals("RESOLVED")) {
            String staff = (String) issue.get("assigned_to");
            jdbc.update("UPDATE issues SET resolved_by_name=? WHERE id=?", staff, id);
            jdbc.update("INSERT INTO notifications(issue_id,message) VALUES (?,?)", id,
                    "Issue " + issue.get("token_id") + " resolved by " + staff);
        }
        return Map.of("status", next);
    }
}
