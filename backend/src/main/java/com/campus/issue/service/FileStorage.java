package com.campus.issue.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorage {
    private final Path root;
    public FileStorage(@Value("${app.upload-dir}") String dir) throws IOException {
        root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }
    public String save(MultipartFile f) throws IOException {
        if (f == null || f.isEmpty()) return null;
        String orig = f.getOriginalFilename() == null ? "file" : f.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        String name = UUID.randomUUID() + "_" + orig;
        Files.copy(f.getInputStream(), root.resolve(name));
        return name;
    }
    public Path resolve(String name) {
        Path p = root.resolve(name).normalize();
        if (!p.startsWith(root)) throw new IllegalArgumentException("Bad path");
        return p;
    }
}
