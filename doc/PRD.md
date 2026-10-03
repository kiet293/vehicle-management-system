# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)

# DỰ ÁN: HỆ THỐNG QUẢN LÝ ĐỘI XE DOANH NGHIỆP (VEHICLE MANAGEMENT SYSTEM - VMS)

* **Môn học:** Điện toán đám mây & Kiến trúc Microservices
* **Kiến trúc:** Microservices Architecture (Spring Boot 3 + React TypeScript + MySQL + Docker)
* **Mục tiêu triển khai:** Máy chủ ảo đám mây (Cloud VPS - Ubuntu/Docker)
* **Quy mô nhóm:** 4 Thành viên
* **Phiên bản tài liệu:** v1.0.0
* **Ngày tạo:** 03/10/2026

---

## 1. TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIỆP VỤ (EXECUTIVE SUMMARY)

### 1.1. Bối cảnh & Vấn đề thực tế (Problem Statement)
Các doanh nghiệp sở hữu đội xe nội bộ (xe đưa đón cán bộ nhân viên, xe bán tải công vụ, xe giao hàng) hiện nay thường quản lý rời rạc qua sổ sách hoặc file Excel:
* **Khó khăn trong kiểm soát chi phí:** Chi phí đổ xăng, vé cầu đường BOT, bảo dưỡng định kỳ khó đối soát và dễ thất thoát.
* **Theo dõi trạng thái xe kém:** Không nắm được xe nào đang rảnh, xe nào đang đi công tác, xe nào đang nằm xưởng sửa chữa.
* **Bỏ quên lịch bảo trì/đăng kiểm:** Gây nguy cơ mất an toàn giao thông và bị phạt hành chính do không có hệ thống cảnh báo tự động.
* **Thiếu số liệu tổng hợp:** Ban lãnh đạo không có số liệu tức thời để đánh giá hiệu suất sử dụng xe và tối ưu chi phí vận hành.

### 1.2. Mục tiêu giải pháp (Proposed Solution)
Xây dựng hệ thống **Vehicle Management System (VMS)** dựa trên **Kiến trúc Microservices** hiện đại, sẵn sàng triển khai trên hạ tầng **Cloud VPS**:
1. **Số hóa toàn diện vòng đời phương tiện:** Quản lý lý lịch xe, phân công tài xế, theo dõi trạng thái vận hành.
2. **Minh bạch tài chính:** Ghi nhận và phân loại chi tiết từng khoản chi phí phát sinh theo từng xe.
3. **Tự động hóa cảnh báo:** Tự động gửi email cảnh báo bảo dưỡng định kỳ và chi phí bất thường.
4. **Trực quan hóa số liệu:** Cung cấp Dashboard biểu đồ phân tích chi phí, tỷ trọng và hiệu suất đội xe.
5. **Chuẩn Cloud-Native:** Toàn bộ hệ thống được container hóa bằng Docker, sẵn sàng deploy lên môi trường đám mây VPS.

---

## 2. PHÂN QUYỀN NGƯỜI DÙNG (ROLE-BASED ACCESS CONTROL - RBAC)

Hệ thống phân chia 3 vai trò rõ ràng với ma trận phân quyền:

```text
┌────────────────────────────────┬───────────┬─────────────┬───────────┐
│ Chức năng                      │   ADMIN   │   MANAGER   │  DRIVER   │
├────────────────────────────────┼───────────┼─────────────┼───────────┤
│ Quản lý tài khoản người dùng   │    CRUD   │   Chỉ xem   │   Không   │
│ Phân quyền tài xế / quản lý    │    Có     │    Không    │   Không   │
│ Quản lý danh mục phương tiện   │    CRUD   │    CRUD     │   Chỉ xem │
│ Cập nhật trạng thái xe         │    Có     │    Có       │    Có     │
│ Ghi nhận / Quản lý chi phí     │    CRUD   │    CRUD     │ Chỉ gửi   │
│ Xem Dashboard / Thống kê       │  Toàn bộ  │  Toàn bộ    │   Không   │
│ Gửi email thông báo/cảnh báo   │    Có     │    Có       │   Không   │
│ Cấu hình hệ thống              │    Có     │    Không    │   Không   │
└────────────────────────────────┴───────────┴─────────────┴───────────┘
```

* **ADMIN (Quản trị viên cấp cao):** Toàn quyền quản trị tài khoản, phân quyền, cấu hình hệ thống, xem toàn bộ chi phí và báo cáo của công ty.
* **MANAGER (Quản lý đội xe):** Phụ trách trực tiếp quản lý xe, duyệt chi phí, lên lịch bảo dưỡng xe, điều phối phương tiện và theo dõi báo cáo vận hành.
* **DRIVER (Tài xế / Nhân viên lái xe):** Xem thông tin xe được phân công, cập nhật trạng thái xe (Bắt đầu chạy / Hoàn thành chuyến), gửi phiếu kê khai chi phí (tiền xăng, phí BOT, sửa chữa phát sinh).

---

## 3. KIẾN TRÚC KỸ THUẬT (TECHNICAL ARCHITECTURE)

### 3.1. Sơ đồ luồng dữ liệu tổng thể

```text
                           [ Trình duyệt / Client ]
                                      │
                                      ▼ (HTTPS / HTTP Port 80, 443)
                 ┌──────────────────────────────────────────┐
                 │          Nginx Reverse Proxy             │
                 └────────────────────┬─────────────────────┘
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼ (Port 5173 / Static Web)                        ▼ (Port 8080)
┌─────────────────────────┐                       ┌─────────────────────────┐
│ Frontend (React + Vite) │                       │ Spring Cloud API Gateway│
└─────────────────────────┘                       └────────────┬────────────┘
                                                               │ (JWT Filter, Route)
          ┌──────────────────────┬──────────────────────┬──────┴───────────────┬──────────────────────┐
          │                      │                      │                      │                      │
          ▼                      ▼                      ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   User Service   │   │ Vehicle Service  │   │   Cost Service   │   │  Report Service  │   │  Email Service   │
│   (Port 8081)    │   │   (Port 8082)    │   │   (Port 8083)    │   │   (Port 8085)    │   │   (Port 8084)    │
└─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘
          │                      │                      │                      │                      │
          ▼                      ▼                      ▼                      ▼                      ▼
     ┌─────────┐            ┌─────────┐            ┌─────────┐            ┌─────────┐           [ Gmail SMTP ]
     │ user_db │            │vehicle_db            │ cost_db │            │report_db│
     └─────────┘            └─────────┘            └─────────┘            └─────────┘
     └───────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
                                   [ MySQL 8.0 ]
```

### 3.2. Ngăn xếp công nghệ (Technology Stack)
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS / Vanilla CSS, Lucide React Icons, Chart.js / Recharts.
* **Backend:** Java 21 LTS, Spring Boot 3.3.4, Spring Cloud Gateway, Spring Data JPA, Spring Security & JWT, Lombok, Hibernate Validator.
* **Database:** MySQL 8.0 (Áp dụng Database-per-service logical separation).
* **Communication:** RESTful APIs qua API Gateway, Inter-service communication qua HTTP REST Client.
* **Deployment & Cloud:** Docker & Docker Compose, Nginx, Linux Cloud VPS (Ubuntu 22.04 / 24.04).

---

## 4. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 4.1. Module 1: Quản lý Người dùng & Xác thực (`user-service`)
* **FR-1.1: Xác thực & Cấp phát Token:** Đăng nhập bằng `username`/`password`. Trả về JWT Token có chứa `userId`, `username`, `role` với thời gian hết hạn (expiration).
* **FR-1.2: Quản lý danh sách nhân sự:** Cho phép Admin tạo mới, cập nhật thông tin, kích hoạt hoặc khóa tài khoản của Quản lý và Tài xế.
* **FR-1.3: Thông tin cá nhân (Profile):** Người dùng xem và cập nhật thông tin cá nhân (Họ tên, SĐT, Email, Bằng lái xe của tài xế).
* **FR-1.4: Phân quyền API:** Chặn truy cập trái phép bằng cách kiểm tra JWT và vai trò tại API Gateway / Service Filter.

### 4.2. Module 2: Quản lý Đội xe (`vehicle-service`)
* **FR-2.1: Quản lý danh mục xe (CRUD):** 
  * Thêm, sửa, xóa, tìm kiếm xe theo biển số (`license_plate`), hãng xe (`brand`), dòng xe (`model`), năm sản xuất.
  * Phân loại xe: Xe 4 chỗ, xe 7 chỗ, xe 16 chỗ, xe bán tải, xe tải nhỏ.
* **FR-2.2: Quản lý trạng thái xe (Lifecycle Status):**
  * `AVAILABLE`: Sẵn sàng nhận nhiệm vụ.
  * `IN_USE`: Đang được sử dụng / đang chạy trên đường.
  * `MAINTENANCE`: Đang bảo dưỡng / sửa chữa trong xưởng.
* **FR-2.3: Phân công xe (Vehicle Assignment):** Gán xe cho tài xế phụ trách chính (`driver_id`), ghi nhận ngày nhận xe và số km hiện tại (Odometer).
* **FR-2.4: Lịch bảo dưỡng & Đăng kiểm:** Ghi nhận chu kỳ bảo dưỡng (theo số km hoặc số tháng), ngày đến hạn đăng kiểm tiếp theo.

### 4.3. Module 3: Quản lý Chi phí Vận hành (`cost-service`)
* **FR-3.1: Ghi nhận chi phí phát sinh:**
  * Tạo phiếu chi gắn với một xe cụ thể (`vehicle_id`): Tiền đổ xăng (`FUEL`), Phí cầu đường BOT (`TOLL`), Sửa chữa bảo dưỡng (`MAINTENANCE`), Bảo hiểm (`INSURANCE`), Chi phí khác (`OTHER`).
  * Thông tin bao gồm: Số tiền (`amount`), Ngày chi (`cost_date`), Địa điểm, Số km tại thời điểm chi, Ghi chú, Link ảnh hóa đơn (`receipt_image_url`).
* **FR-3.2: Lọc & Tra cứu chi phí:** Tra cứu lịch sử chi phí theo khoảng thời gian (`from_date` - `to_date`), lọc theo từng xe, lọc theo loại chi phí.
* **FR-3.3: Tổng hợp chi phí theo xe:** API tính tổng chi phí đã tiêu tốn của một xe trong một tháng hoặc một năm để phục vụ bài toán khấu hao.

### 4.4. Module 4: Thông báo & Cảnh báo Tự động (`email-service`)
* **FR-4.1: Cấu hình gửi mail SMTP:** Kết nối dịch vụ gửi email qua Google SMTP (`smtp.gmail.com`).
* **FR-4.2: Cảnh báo bảo dưỡng định kỳ:** Tự động gửi email đến Quản lý khi xe đạt ngưỡng số km cần bảo dưỡng hoặc sắp hết hạn đăng kiểm.
* **FR-4.3: Cảnh báo chi phí bất thường:** Gửi email thông báo khi có khoản chi vượt định mức cho phép (ví dụ một phiếu đổ xăng vượt quá 3.000.000 VNĐ).
* **FR-4.4: Gửi thông báo thủ công:** Cho phép Quản lý soạn nội dung và gửi email thông báo công việc đến tài xế ngay trên giao diện web.

### 4.5. Module 5: Báo cáo Thống kê & Dashboard (`report-service`)
* **FR-5.1: KPI Metrics tổng quan:**
  * Tổng số xe công ty sở hữu, số xe đang vận hành, số xe đang nằm xưởng.
  * Tổng chi phí vận hành toàn đội xe trong tháng hiện tại và % tăng/giảm so với tháng trước.
* **FR-5.2: Biểu đồ trực quan:**
  * Biểu đồ cột (Bar Chart): Xu hướng biến động chi phí vận hành qua 12 tháng.
  * Biểu đồ tròn (Doughnut Chart): Cơ cấu chi phí (Nhiên liệu chiếm bao nhiêu %, Cầu đường %, Bảo dưỡng %).
  * Biểu đồ trạng thái: Tỷ lệ phân bổ trạng thái xe.
* **FR-5.3: Top xe tiêu hao chi phí cao nhất:** Bảng xếp hạng các xe có chi phí bảo trì và nhiên liệu tốn kém nhất để doanh nghiệp cân nhắc thanh lý hoặc đổi mới.

---

## 5. THIẾT KẾ DỮ LIỆU SƠ BỘ (DATA SCHEMAS)

> **Nguyên tắc cốt lõi:** Mỗi service quản lý 1 Database độc lập. Liên kết dữ liệu giữa các service sử dụng **khóa ngoại mềm (Soft Reference ID)**, tuyệt đối không dùng FOREIGN KEY cứng giữa các cơ sở dữ liệu.

```sql
-- Database: user_db (user-service)
TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- 'ADMIN', 'MANAGER', 'DRIVER'
    driver_license VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database: vehicle_db (vehicle-service)
TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL, -- 'SEDAN', 'SUV', 'VAN', 'PICKUP', 'TRUCK'
    seat_capacity INT DEFAULT 5,
    manufacture_year INT,
    current_odometer INT DEFAULT 0, -- Số km đã chạy
    assigned_driver_id BIGINT,      -- ID tài xế từ user-service (Soft FK)
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'IN_USE', 'MAINTENANCE'
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database: cost_db (cost-service)
TABLE costs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,     -- ID xe từ vehicle-service (Soft FK)
    driver_id BIGINT,               -- ID người chi từ user-service (Soft FK)
    cost_type VARCHAR(30) NOT NULL, -- 'FUEL', 'TOLL', 'MAINTENANCE', 'INSURANCE', 'OTHER'
    amount DECIMAL(12, 2) NOT NULL,
    odometer INT,                   -- Số km lúc phát sinh chi phí
    cost_date DATE NOT NULL,
    description TEXT,
    receipt_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database: report_db (report-service)
TABLE daily_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    total_vehicles INT DEFAULT 0,
    active_vehicles INT DEFAULT 0,
    maintenance_vehicles INT DEFAULT 0,
    daily_total_cost DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. CHUẨN ĐỒNG BỘ RESTful API (API CONTRACT CONVENTIONS)

Tất cả các Microservices phải tuân thủ nghiêm ngặt định dạng phản hồi chuẩn:

### 6.1. Định dạng phản hồi chung (Common ApiResponse)
```json
{
  "success": true,
  "code": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-10-03T11:20:00Z"
}
```

### 6.2. Định dạng lỗi chuẩn (Common ErrorResponse)
```json
{
  "success": false,
  "code": 400,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    "Biển số xe không được để trống",
    "Số tiền chi phí phải lớn hơn 0"
  ],
  "timestamp": "2026-10-03T11:20:00Z"
}
```

---

## 7. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

1. **Hiệu năng & Khả năng đáp ứng:** Thời gian phản hồi API qua Gateway trung bình `< 300ms` trong điều kiện tải bình thường.
2. **Bảo mật:**
   * Mật khẩu mã hóa bằng chuẩn BCrypt.
   * Giao tiếp giữa Frontend và Backend bảo vệ bằng JWT token (gửi qua Header `Authorization: Bearer <token>`).
   * Không lưu mật khẩu hoặc Secret Key cứng trong mã nguồn (toàn bộ nạp qua biến môi trường `.env`).
3. **Tính sẵn sàng & Khả năng mở rộng:** Các dịch vụ hoạt động độc lập; nếu `cost-service` hoặc `email-service` tạm thời gặp sự cố, `vehicle-service` và `user-service` vẫn tiếp tục hoạt động bình thường.
4. **Chuẩn thiết kế UI/UX:**
   * Giao diện Dashboard hiện đại, phông chữ Inter chuẩn nét, sử dụng bảng màu HSL hài hòa.
   * Hiển thị đầy đủ trạng thái Loading (Skeleton), Bảng phân trang (Pagination), Hộp thoại xác nhận trước khi xóa (Confirm Modal).
   * Định dạng tiền tệ VNĐ (ví dụ `1.500.000 ₫`) và ngày tháng định dạng Việt Nam (`DD/MM/YYYY`).

---

## 8. KẾ HOẠCH TRIỂN KHAI LÊN CLOUD VPS (DEPLOYMENT ARCHITECTURE)

### 8.1. Thông số máy chủ VPS khuyến nghị
* **Hệ điều hành:** Ubuntu 22.04 LTS hoặc 24.04 LTS x64
* **Cấu hình tối thiểu:** 2 CPU Cores, 4GB RAM (hoặc 2GB RAM + 4GB Swap), 25GB SSD
* **Phần mềm cài đặt:** Docker Engine, Docker Compose plugin, Git

### 8.2. Quy trình triển khai 4 bước trên VPS
```bash
# Bước 1: SSH vào VPS và Clone mã nguồn
ssh root@<IP_VPS>
git clone https://github.com/kiet293/vehicle-management-system.git
cd vehicle-management-system

# Bước 2: Tạo file biến môi trường production từ file mẫu
cp .env.example .env
cp frontend/.env.example frontend/.env
# Chỉnh sửa IP_VPS hoặc Domain vào file .env

# Bước 3: Khởi động toàn bộ hệ thống bằng Docker Compose
docker compose up --build -d

# Bước 4: Kiểm tra trạng thái các container
docker compose ps
```

### 8.3. Thiết lập Nginx & Domain Public (Tùy chọn nâng cao)
* Cấu hình Nginx làm Reverse Proxy đón cổng 80/443 của VPS định tuyến vào cổng 5173 (Frontend) và cổng 8080 (API Gateway).
* Cài đặt SSL miễn phí với Let's Encrypt Certbot (`certbot --nginx -d vms.yourdomain.com`).

---

## 9. BẢNG PHÂN CHIA CÔNG VIỆC CHI TIẾT CHO 4 THÀNH VIÊN (WBS)

```text
┌───────────────┬──────────────────────────────────┬─────────────────────────────┐
│ Thành viên    │ Phạm vi phụ trách                │ Nhánh Git & Nhiệm vụ chính  │
├───────────────┼──────────────────────────────────┼─────────────────────────────┤
│ THÀNH VIÊN 1  │ User Service (Backend + Front)   │ feature/user-service        │
│               │ - Xác thực JWT, Quản lý nhân sự  │ - Viết Login, CRUD User     │
│               │                                  │ - Phân quyền Admin/Manager  │
├───────────────┼──────────────────────────────────┼─────────────────────────────┤
│ THÀNH VIÊN 2  │ Vehicle Service (Backend + Front)│ feature/vehicle-service     │
│               │ - Quản lý xe, Lịch bảo dưỡng     │ - CRUD danh mục xe          │
│               │ - Gán tài xế, Trạng thái xe      │ - Bộ lọc trạng thái & Modal │
├───────────────┼──────────────────────────────────┼─────────────────────────────┤
│ THÀNH VIÊN 3  │ Cost Service (Backend + Front)   │ feature/cost-service        │
│               │ - Quản lý chi phí xăng, cầu đường│ - CRUD phiếu chi phí        │
│               │ - Lịch sử chi tiêu & Hóa đơn     │ - Thống kê chi phí theo xe  │
├───────────────┼──────────────────────────────────┼─────────────────────────────┤
│ THÀNH VIÊN 4  │ Report Service + Email Service   │ feature/report-email-service│
│               │ - Dashboard biểu đồ phân tích    │ - Tổng hợp số liệu KPI      │
│               │ - Tự động hóa gửi mail cảnh báo  │ - Tích hợp biểu đồ Chart.js │
│               │                                  │ - Gửi mail SMTP cảnh báo    │
└───────────────┴──────────────────────────────────┴─────────────────────────────┘
```

---

## 10. LỘ TRÌNH PHÁT TRIỂN & TIÊU CHÍ NGHIỆM THU (ROADMAP & ACCEPTANCE)

### Giai đoạn 1: Base Project & Phân chia khung (ĐÃ HOÀN THÀNH ✅)
* [x] Xây dựng khung 6 Spring Boot Services + API Gateway.
* [x] Cấu hình Docker Compose 8 containers & MySQL 4 databases.
* [x] Cấu trúc Frontend phân tách 5 modules độc lập.
* [x] Đẩy mã nguồn chuẩn lên nhánh `main` và `dev` trên GitHub.

### Giai đoạn 2: Phát triển độc lập từng Module (2 - 3 Tuần)
* [ ] 4 thành viên hoàn thiện Entity, DTO, Repository, Service và Controller theo PRD.
* [ ] 4 thành viên hoàn thiện giao diện Frontend trong `frontend/src/modules/` tương ứng.
* [ ] Kiểm thử nội bộ từng service qua Swagger/Postman và giao diện web.

### Giai đoạn 3: Tích hợp & Kiểm thử toàn diện (1 Tuần)
* [ ] Tạo Pull Request gộp từng nhánh tính năng vào nhánh `dev`.
* [ ] Kiểm thử luồng thông suốt từ Frontend -> API Gateway -> Microservices -> Database.
* [ ] Kiểm thử gửi email cảnh báo tự động.

### Giai đoạn 4: Đóng gói & Triển khai Cloud VPS (1 Tuần)
* [ ] Merge nhánh `dev` vào nhánh `main`.
* [ ] Thuê VPS (hoặc dùng trial AWS/DigitalOcean/Google Cloud).
* [ ] Chạy `docker compose up --build -d` trên VPS và kiểm tra IP Public.
* [ ] Chuẩn bị slide báo cáo, quay video demo hệ thống và tài liệu nộp môn học.
