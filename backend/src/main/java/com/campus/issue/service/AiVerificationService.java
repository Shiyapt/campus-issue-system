package com.campus.issue.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

/** AI-bot placeholder: rule-based scoring. Replace verify() with a call to a real model/API. */
@Service
public class AiVerificationService {
    public record Result(int score, String remark) { public boolean passed() { return score >= 60; } }
    private static final List<String> SPAM = List.of("test test", "asdf", "lorem", "xxxx", "fake");

    public Result verify(String title, String description, MultipartFile selfie, MultipartFile video) {
        int score = 40;
        String d = description.toLowerCase();
        if (description.trim().length() >= 40) score += 25;
        if (title.trim().length() >= 8) score += 10;
        if (selfie != null && !selfie.isEmpty()) score += 10;
        if (video != null && !video.isEmpty()) score += 15;
        for (String s : SPAM) if (d.contains(s)) score -= 40;
        score = Math.max(0, Math.min(100, score));
        return new Result(score, score >= 60 ? "Looks genuine" : "Possible fake / low-detail request - admin review needed");
    }
}
