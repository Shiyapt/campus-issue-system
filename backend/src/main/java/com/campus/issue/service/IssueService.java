package com.campus.issue.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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

    public void changeStatus(long id, String status, String note, String by) {
        jdbc.update("UPDATE issues SET status=? WHERE id=?", status, id);
        jdbc.update("INSERT INTO issue_updates(issue_id,status,note,by_name) VALUES (?,?,?,?)", id, status, note, by);
    }
}
