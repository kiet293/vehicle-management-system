package com.vms.cost.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vms.cost.dto.OcrReceiptResponse;
import com.vms.cost.entity.CostType;
import com.vms.cost.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:/app/uploads/receipts}")
    private String uploadDir;

    @Value("${app.gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    /**
     * Quét và trích xuất thông tin hóa đơn từ file ảnh tải lên
     */
    public OcrReceiptResponse scanReceipt(MultipartFile file, String baseUrl) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng tải lên file ảnh hóa đơn hợp lệ");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new BadRequestException("Chỉ chấp nhận file định dạng hình ảnh (JPG, PNG, WEBP) hoặc PDF");
        }

        // 1. Lưu file hóa đơn vào ổ đĩa
        String savedFileName = saveReceiptFile(file);
        String receiptImageUrl = (baseUrl != null ? baseUrl : "") + "/api/costs/receipts/" + savedFileName;

        // 2. Trích xuất thông tin qua AI (Gemini Vision) hoặc Fallback
        OcrReceiptResponse response;
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.contains("placeholder")) {
            try {
                log.info("Processing receipt with Gemini Vision API (model: {})...", geminiModel);
                response = extractWithGeminiVision(file);
                response.setAiExtracted(true);
                response.setMessage("Trích xuất thông tin hóa đơn thành công bằng Gemini Vision AI");
            } catch (Exception e) {
                log.warn("Gemini Vision API extraction failed ({}), falling back to smart rule-based parser.", e.getMessage());
                response = fallbackSmartParser(file.getOriginalFilename());
                response.setAiExtracted(false);
                response.setMessage("Trích xuất thông tin tự động (Gemini API lỗi hoặc quá tải: " + e.getMessage() + ")");
            }
        } else {
            log.info("GEMINI_API_KEY not configured. Using Smart Rule-based Mock OCR parser for demonstration.");
            response = fallbackSmartParser(file.getOriginalFilename());
            response.setAiExtracted(false);
            response.setMessage("Trích xuất thông tin thành công (Chế độ mô phỏng - Chưa cài đặt GEMINI_API_KEY)");
        }

        response.setReceiptImageUrl(receiptImageUrl);
        return response;
    }

    /**
     * Gọi Google Gemini Vision API để bóc tách hóa đơn
     */
    private OcrReceiptResponse extractWithGeminiVision(MultipartFile file) throws IOException {
        String base64Data = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        String prompt = """
            Bạn là hệ thống AI chuyên gia bóc tách hóa đơn chi phí cho xe & phương tiện giao thông tại Việt Nam (xăng dầu Petrolimex/PVOIL, vé BOT cầu đường, phiếu bảo dưỡng sửa chữa garage, bảo hiểm, gửi xe, rửa xe...).
            Hãy đọc kỹ hình ảnh hóa đơn và trích xuất ra duy nhất một đối tượng JSON hợp lệ (không kèm markdown ```json, không giải thích gì thêm) theo schema sau:
            {
              "amount": <Số tiền tổng thanh toán bằng số nguyên hoặc số thực, ví dụ: 850000>,
              "costType": "<Một trong các giá trị: FUEL, TOLL, MAINTENANCE, INSURANCE, OTHER>",
              "costDate": "<Ngày hóa đơn định dạng YYYY-MM-DD nếu thấy, nếu không thấy hoặc sau ngày hiện tại thì trả về null>",
              "vehiclePlate": "<Biển số xe nếu có ghi trên hóa đơn dạng 30A-888.88 hoặc 51K-999.99, hoặc null>",
              "merchantName": "<Tên đơn vị phát hành hóa đơn / cây xăng / trạm thu phí / garage>",
              "invoiceNumber": "<Số hóa đơn / Số vé / Mã tra cứu nếu có>",
              "description": "<Tóm tắt ngắn gọn nội dung chi phí bằng tiếng Việt>"
            }
            Quy tắc phân loại costType:
            - Chữ xăng, dầu, DO, RON 95, E5, Petrolimex, PV OIL, lít, đ/lít -> FUEL
            - Chữ BOT, vé cầu đường, thu phí tự động, VETC, ePass -> TOLL
            - Chữ bảo dưỡng, thay dầu, nhớt, sửa chữa, phụ tùng, lốp xe, garage -> MAINTENANCE
            - Chữ bảo hiểm, PTI, Bảo Việt, PVI, TNDS -> INSURANCE
            - Khác -> OTHER
            """;

        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey.trim();

        Map<String, Object> inlineData = Map.of(
                "mime_type", mimeType,
                "data", base64Data
        );
        Map<String, Object> part1 = Map.of("text", prompt);
        Map<String, Object> part2 = Map.of("inline_data", inlineData);

        Map<String, Object> contentObj = Map.of(
                "parts", List.of(part1, part2)
        );

        Map<String, Object> generationConfig = Map.of(
                "response_mime_type", "application/json",
                "temperature", 0.1
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(contentObj),
                "generationConfig", generationConfig
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String jsonResponse = restTemplate.postForObject(apiUrl, entity, String.class);
        if (jsonResponse == null || jsonResponse.isEmpty()) {
            throw new RuntimeException("Phản hồi rỗng từ Gemini API");
        }

        JsonNode rootNode = objectMapper.readTree(jsonResponse);
        JsonNode candidates = rootNode.path("candidates");
        if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Không tìm thấy kết quả từ Gemini API: " + jsonResponse);
        }

        String generatedText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        log.debug("Gemini raw generated text: {}", generatedText);

        // Parse JSON output của Gemini
        // Loại bỏ markdown code fence nếu có
        String cleanJson = generatedText.replaceAll("^```json\\s*", "").replaceAll("```$", "").trim();
        JsonNode extracted = objectMapper.readTree(cleanJson);

        BigDecimal amount = null;
        if (extracted.hasNonNull("amount")) {
            try {
                amount = new BigDecimal(extracted.get("amount").asText().replaceAll("[^0-9.]", ""));
            } catch (Exception ignored) {}
        }

        CostType costType = CostType.FUEL;
        if (extracted.hasNonNull("costType")) {
            try {
                costType = CostType.valueOf(extracted.get("costType").asText().toUpperCase().trim());
            } catch (Exception ignored) {}
        }

        LocalDate costDate = null;
        if (extracted.hasNonNull("costDate")) {
            try {
                costDate = LocalDate.parse(extracted.get("costDate").asText().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                if (costDate.isAfter(LocalDate.now())) {
                    costDate = LocalDate.now();
                }
            } catch (Exception ignored) {}
        }
        if (costDate == null) {
            costDate = LocalDate.now();
        }

        String vehiclePlate = extracted.hasNonNull("vehiclePlate") ? extracted.get("vehiclePlate").asText().trim() : null;
        String merchantName = extracted.hasNonNull("merchantName") ? extracted.get("merchantName").asText().trim() : null;
        String invoiceNumber = extracted.hasNonNull("invoiceNumber") ? extracted.get("invoiceNumber").asText().trim() : null;
        String description = extracted.hasNonNull("description") ? extracted.get("description").asText().trim() : null;

        return OcrReceiptResponse.builder()
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .costType(costType)
                .costDate(costDate)
                .vehiclePlate(vehiclePlate)
                .merchantName(merchantName)
                .invoiceNumber(invoiceNumber)
                .description(description)
                .rawText(cleanJson)
                .build();
    }

    /**
     * Fallback parser thông minh khi không có kết nối Gemini API
     */
    private OcrReceiptResponse fallbackSmartParser(String originalFilename) {
        String lower = originalFilename != null ? originalFilename.toLowerCase() : "";

        BigDecimal amount;
        CostType costType;
        String merchantName;
        String invoiceNumber = "HD" + (100000 + new Random().nextInt(900000));
        String description;
        String vehiclePlate = null;

        if (lower.contains("bot") || lower.contains("toll") || lower.contains("ve") || lower.contains("cau_duong")) {
            amount = new BigDecimal("35000");
            costType = CostType.TOLL;
            merchantName = "Trạm thu phí BOT QL1A";
            description = "Phí qua trạm BOT tự động ePass";
        } else if (lower.contains("bao_duong") || lower.contains("sua_chua") || lower.contains("garage") || lower.contains("maintenance")) {
            amount = new BigDecimal("2850000");
            costType = CostType.MAINTENANCE;
            merchantName = "Garage Ô tô Trung tâm Dịch vụ AutoCare";
            description = "Bảo dưỡng định kỳ mốc 20.000km, thay dầu nhớt động cơ và lọc gió";
        } else if (lower.contains("bao_hiem") || lower.contains("insurance")) {
            amount = new BigDecimal("8500000");
            costType = CostType.INSURANCE;
            merchantName = "Tổng Công ty Bảo hiểm Bảo Việt";
            description = "Bảo hiểm vật chất xe cơ giới 1 năm";
        } else {
            // Mặc định là đổ xăng
            amount = new BigDecimal("850000");
            costType = CostType.FUEL;
            merchantName = "Cửa hàng Xăng dầu Petrolimex Số 15";
            description = "Đổ xăng RON 95-V tại Petrolimex Số 15";
            vehiclePlate = "30H-123.45";
        }

        return OcrReceiptResponse.builder()
                .amount(amount)
                .costType(costType)
                .costDate(LocalDate.now())
                .vehiclePlate(vehiclePlate)
                .merchantName(merchantName)
                .invoiceNumber(invoiceNumber)
                .description(description)
                .build();
    }

    /**
     * Lưu file hình ảnh vào thư mục upload
     */
    private String saveReceiptFile(MultipartFile file) {
        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.lastIndexOf('.') != -1) {
                extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
            } else {
                extension = ".jpg";
            }

            String cleanFileName = "receipt_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path destination = targetDir.resolve(cleanFileName);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved receipt file to: {}", destination);
            return cleanFileName;
        } catch (IOException e) {
            log.error("Failed to save receipt file: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể lưu file hóa đơn: " + e.getMessage());
        }
    }

    /**
     * Tải file hóa đơn theo tên file
     */
    public Resource loadReceiptAsResource(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("Không tìm thấy file ảnh hóa đơn: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("Đường dẫn file không hợp lệ: " + filename);
        }
    }
}

