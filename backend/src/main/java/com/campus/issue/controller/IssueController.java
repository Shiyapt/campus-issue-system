package com.campus.issue.controller;

import com.campus.issue.auth.AuthStore.Principal;
import com.campus.issue.service.*;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class IssueController {
    private final JdbcTemplate jdbc;
    private final FileStorage files;
    private final AiVerificationService ai;
    public IssueController(JdbcTemplate jdbc, FileStorage files, AiVerificationService ai) {
        this.jdbc = jdbc; this.files = files; this.ai = ai;
    }

    /** Student / staff submit an issue (selfie + video mandatory, photo + voice note optional) */
    @PostMapping(value = "/issues", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> submit(@RequestAttribute("principal") Principal p,
                                      @RequestParam String title, @RequestParam String description, @RequestParam String category,
                                      @RequestParam("selfie") MultipartFile selfie, @RequestParam("video") MultipartFile video,
                                      @RequestParam(value = "photo", required = false) MultipartFile photo,
                                      @RequestParam(value = "voice", required = false) MultipartFile voice) throws IOException {
        var result = ai.verify(title, description, selfie, video);
        String token = "ISS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String status = result.passed() ? "AI_VERIFIED" : "AI_FLAGGED";

        jdbc.update("""
            INSERT INTO issues(token_id,reporter_type,reporter_id,reporter_name,title,description,category,
              selfie_path,video_path,photo_path,voice_path,status,ai_score,ai_remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                token, p.role(), p.id(), p.name(), title, description, category,
                files.save(selfie), files.save(video), files.save(photo), files.save(voice),
                status, result.score(), result.remark());
        long id = jdbc.queryForObject("SELECT id FROM issues WHERE token_id=?", Long.class, token);
        jdbc.update("INSERT INTO issue_updates(issue_id,status,note,by_name) VALUES (?,?,?,?)", id, status, result.remark(), "AI Bot");
        return Map.of("tokenId", token, "status", status);
    }

    /** Public tracking by token id - exposes status timeline only, never media/details */
    @GetMapping("/issues/track/{token}")
    public Map<String, Object> track(@PathVariable String token) {
        var l = jdbc.queryForList("SELECT id,token_id,title,category,status,created_at FROM issues WHERE token_id=?", token);
        if (l.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token id");
        var issue = new HashMap<>(l.get(0));
        var history = jdbc.queryForList("SELECT status,note,created_at FROM issue_updates WHERE issue_id=? ORDER BY id", issue.remove("id"));
        issue.put("history", history);
        return issue;
    }

    /** Media streaming - admin / management only */
    @GetMapping("/files/{name}")
    public ResponseEntity<Resource> file(@PathVariable String name) throws IOException {
        Path p = files.resolve(name);
        if (!Files.exists(p)) return ResponseEntity.notFound().build();
        String type = Optional.ofNullable(Files.probeContentType(p)).orElse("application/octet-stream");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(type)).body(new FileSystemResource(p));
    }
}
