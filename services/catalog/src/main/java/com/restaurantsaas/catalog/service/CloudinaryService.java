package com.restaurantsaas.catalog.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.restaurantsaas.catalog.config.CloudinaryConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Cloudinary Java SDK uses raw {@link Map} types ({@code ObjectUtils.asMap}, upload/destroy results);
 * unchecked casts are confined here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final CloudinaryConfig cloudinaryConfig;

    /**
     * Upload file to Cloudinary
     * @param file The file to upload
     * @param folder Optional folder path in Cloudinary
     * @return Public URL of the uploaded file
     * @throws IOException If upload fails
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (!cloudinaryConfig.isConfigured()) {
            throw new IllegalStateException("Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
        }

        try {
            // Generate unique public ID
            String publicId = folder != null && !folder.isEmpty() 
                ? folder + "/" + UUID.randomUUID().toString()
                : "menu-files/" + UUID.randomUUID().toString();

            // Upload options
            Map<String, Object> uploadOptions = (Map<String, Object>) ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", "auto", // Auto-detect: image, video, raw, etc.
                "folder", folder != null && !folder.isEmpty() ? folder : "menu-files",
                "overwrite", false,
                "use_filename", false,
                "unique_filename", true
            );

            // Upload file
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader().upload(
                file.getBytes(),
                uploadOptions
            );

            // Get secure URL (HTTPS)
            String url = (String) uploadResult.get("secure_url");
            log.info("File uploaded to Cloudinary: {}", url);
            
            return url;
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Delete file from Cloudinary by URL
     * @param fileUrl The public URL of the file
     * @return true if deletion was successful
     */
    public boolean deleteFile(String fileUrl) {
        if (!cloudinaryConfig.isConfigured()) {
            log.warn("Cloudinary is not configured, cannot delete file");
            return false;
        }

        try {
            // Extract public ID from URL
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
            String publicId = extractPublicIdFromUrl(fileUrl);
            String resourceType = extractResourceTypeFromUrl(fileUrl);
            
            if (publicId == null || publicId.isEmpty()) {
                log.warn("Could not extract public ID from URL: {}", fileUrl);
                return false;
            }

            // Delete file
            Map<String, Object> deleteOptions = ObjectUtils.asMap("resource_type", resourceType);
            Map<String, Object> deleteResult = (Map<String, Object>) cloudinary.uploader().destroy(publicId, deleteOptions);
            
            String result = (String) deleteResult.get("result");
            boolean success = "ok".equals(result) || "not found".equals(result);
            
            if (success) {
                log.info("File deleted from Cloudinary: {}", publicId);
            } else {
                log.warn("Failed to delete file from Cloudinary (resourceType={}): {}", resourceType, publicId);
            }
            
            return success;
        } catch (Exception e) {
            log.error("Error deleting file from Cloudinary: {}", fileUrl, e);
            return false;
        }
    }

    private String extractResourceTypeFromUrl(String url) {
        if (url == null) {
            return "image";
        }
        if (url.contains("/raw/upload/")) {
            return "raw";
        }
        if (url.contains("/video/upload/")) {
            return "video";
        }
        return "image";
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param url Cloudinary URL
     * @return Public ID or null if extraction fails
     */
    private String extractPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        try {
            // Cloudinary URL format examples:
            // https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            // https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
            // https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}
            
            // Extract the part after /upload/
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                return null;
            }

            String afterUpload = url.substring(uploadIndex + "/upload/".length());
            
            // Remove version prefix if present (v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.indexOf("/") > 0) {
                int versionEnd = afterUpload.indexOf("/");
                afterUpload = afterUpload.substring(versionEnd + 1);
            }

            // Remove file extension
            int lastDot = afterUpload.lastIndexOf(".");
            if (lastDot > 0) {
                afterUpload = afterUpload.substring(0, lastDot);
            }

            // Remove folder prefix if it's in the URL
            // The public ID should include the folder, but we might need to handle it
            return afterUpload;
        } catch (Exception e) {
            log.error("Error extracting public ID from URL: {}", url, e);
            return null;
        }
    }

    /**
     * Check if Cloudinary is configured
     * @return true if configured
     */
    public boolean isConfigured() {
        return cloudinaryConfig.isConfigured();
    }
}
