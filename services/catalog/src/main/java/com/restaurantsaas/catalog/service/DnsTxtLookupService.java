package com.restaurantsaas.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Resolves TXT records via Google DNS-over-HTTPS (no extra dependencies).
 * Used to verify custom domain ownership.
 */
@Service
public class DnsTxtLookupService {

    private static final Logger log = LoggerFactory.getLogger(DnsTxtLookupService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public DnsTxtLookupService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * @param host    hostname (e.g. menu.example.com)
     * @param needle  substring that must appear in a TXT record (e.g. restaurant-saas-verify=token)
     */
    public boolean txtRecordsContain(String host, String needle) {
        if (host == null || host.isBlank() || needle == null || needle.isBlank()) {
            return false;
        }
        String name = host.trim().toLowerCase();
        try {
            String url = "https://dns.google/resolve?name="
                    + URLEncoder.encode(name, StandardCharsets.UTF_8)
                    + "&type=TXT";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200 || res.body() == null) {
                return false;
            }
            JsonNode root = objectMapper.readTree(res.body());
            if (root.path("Status").asInt(-1) != 0) {
                return false;
            }
            JsonNode answers = root.path("Answer");
            if (!answers.isArray()) {
                return false;
            }
            for (JsonNode ans : answers) {
                if (ans.path("type").asInt() != 16) {
                    continue;
                }
                String data = ans.path("data").asText("");
                String normalized = stripTxtQuotes(data).toLowerCase();
                if (normalized.contains(needle.toLowerCase())) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.warn("DNS TXT lookup failed for host {}: {}", name, e.getMessage());
            return false;
        }
    }

    private static String stripTxtQuotes(String data) {
        if (data == null) {
            return "";
        }
        String s = data.trim();
        while (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
            s = s.substring(1, s.length() - 1).trim();
        }
        return s;
    }
}
