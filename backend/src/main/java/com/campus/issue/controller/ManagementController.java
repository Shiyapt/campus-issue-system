package com.campus.issue.controller;

import com.campus.issue.auth.AuthStore.Principal;
import com.campus.issue.service.IssueService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/**
 * Management owns the whole lifecycle. College staff never log in: management RECORDS the work staff do.
 * Each update can carry a public remark (reporter sees it) and/or an internal remark (management/admin only).
 */
@RestController
@RequestMapping("/api/management")
public class ManagementController {
    private static final Map<String, List<String>> NEXT = Map.of(
            "SENT_TO_MANAGEMENT", List.of("UNDER_REVIEW"),
            "UNDER_REVIEW", List.of("APPROVED", "REJECTED", "ON_HOLD"),
            "APPROVED", List.of("STAFF_ASSIGNED", "ON_HOLD"),
            "STAFF_ASSIGNED", List.of("IN_PROGRESS", "ON_HOLD"),
            "IN_PROGRESS", List.of("STAFF_COMPLETED", "ON_HOLD"),
            "STAFF_COMPLETED", List.of("UNDER_VERIFICATION"),
            "UNDER_VERIFICATION", List.of("RESOLVED", "IN_PROGRESS", "ON_HOLD"),
            "ON_HOLD", List.of("UNDER_REVIEW", "IN_PROGRESS"));
    private final JdbcTemplate jdbc;
    private final IssueService issues;
    public ManagementController(JdbcTemplate jdbc, IssueService issues) { this.jdbc = jdbc; this.issues = issues; }

    @GetMapping("/issues")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (var row : jdbc.queryForList("SELECT * FROM issues ORDER BY id DESC")) {
            var m = new HashMap<>(row);
            m.put("next_statuses", NEXT.getOrDefault((String) row.get("status"), List.of()));
            out.add(m);
        }
        return out;
    }

    @GetMapping("/issues/{id}/updates")
    public List<Map<String, Object>> updates(@PathVariable long id) { return issues.history(id); }

    /** Body: { status?, staffName?, publicNote?, internalNote? }. Omit status to only add a remark. */
    @PostMapping("/issues/{id}/progress")
    public Map<String, Object> progress(@PathVariable long id, @RequestBody Map<String, String> b, @RequestAttribute("principal") Principal p) {
        var issue = issues.get(id);
        String cur = (String) issue.get("status");
        String next = clean(b.get("status"));
        String pub = clean(b.get("publicNote")), internal = clean(b.get("internalNote"));

        if (next == null) {
            if (pub == null && internal == null) throw bad("Enter a remark or choose a new status");
            next = cur;
        } else {
            if (!NEXT.getOrDefault(cur, List.of()).contains(next)) throw bad("Cannot move from " + cur + " to " + next);
            if (next.equals("STAFF_ASSIGNED")) {
                String staff = clean(b.get("staffName"));
                if (staff == null) throw bad("Staff name is required");
                jdbc.update("UPDATE issues SET assigned_to=? WHERE id=?", staff, id);
                if (pub == null) pub = "Your issue has been assigned to the concerned staff.";
                internal = "Staff recorded: " + staff + (internal == null ? "" : " - " + internal);
            }
            if (next.equals("REJECTED") && pub == null) throw bad("Give the reporter a reason for rejection");
        }

        jdbc.update("UPDATE issues SET assigned_management=COALESCE(assigned_management,?) WHERE id=?", p.name(), id);
        if (!next.equals(cur)) { issues.moveTo(id, next); issues.addUpdate(id, next, pub, "PUBLIC", p.name()); }
        else if (pub != null) issues.addUpdate(id, next, pub, "PUBLIC", p.name());
        if (internal != null) issues.addUpdate(id, next, internal, "INTERNAL", p.name());

        if (next.equals("RESOLVED") && !cur.equals("RESOLVED")) {
            String staff = (String) issues.get(id).get("assigned_to");
            String by = staff != null ? staff : p.name();
            jdbc.update("UPDATE issues SET resolved_by_name=? WHERE id=?", by, id);
            jdbc.update("INSERT INTO notifications(issue_id,message) VALUES (?,?)", id, "Issue " + issue.get("token_id") + " resolved by " + by);
        }
        return Map.of("status", next);
    }

    private static String clean(String s) { return s == null || s.isBlank() ? null : s.trim(); }
    private static ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
}
