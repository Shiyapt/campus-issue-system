package com.campus.issue.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

@Service
public class IssueService {
    private final JdbcTemplate jdbc;
    public IssueService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<String, Object> get(long id) {
        var l = jdbc.queryForList("SELECT * FROM issues WHERE id=?", id);
        if (l.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found");
        return l.get(0);
    }

    public void moveTo(long id, String status) { jdbc.update("UPDATE issues SET status=? WHERE id=?", status, id); }

    /** visibility: PUBLIC (reporter can see) or INTERNAL (management/admin only) */
    public void addUpdate(long id, String status, String note, String visibility, String by) {
        jdbc.update("INSERT INTO issue_updates(issue_id,status,note,visibility,by_name) VALUES (?,?,?,?,?)", id, status, note, visibility, by);
    }

    public List<Map<String, Object>> history(long id) {
        return jdbc.queryForList("SELECT id,status,note,visibility,by_name,created_at FROM issue_updates WHERE issue_id=? ORDER BY id", id);
    }
}
