# Product Requirements Document (PRD)

> **Dự án:** Vehicle Management System (VMS) - Hệ Thống Quản Lý Đội Xe Doanh Nghiệp Phân Tán  
> **Tài liệu tham chiếu:** Đồ án Môn học Điện toán đám mây & Kiến trúc Microservices (Cloud Computing & Microservices Architecture Specification)  
> **Phiên bản:** 1.1.0 | **Ngày ban hành:** 03/10/2026 | **Tác giả:** Principal Technical Product Manager & Lead Architect

---

## 1. Mục tiêu Sản phẩm (Product Goals)

### 1.1 Vấn đề của người dùng (User Problems)
Tại các doanh nghiệp sở hữu đội xe nội bộ (xe đưa đón cán bộ nhân viên, xe bán tải công vụ, xe vận chuyển hàng hóa nội bộ), công tác quản lý hiện nay chủ yếu dựa vào bảng tính Excel rời rạc hoặc sổ tay viết tay, dẫn tới các điểm nghẽn nghiêm trọng:
1. **Thất thoát & khó đối soát chi phí (Cost Leakage & Reconciliation Bottleneck):** Quản lý không có công cụ đối chiếu tức thời giữa lộ trình di chuyển với hóa đơn xăng dầu, vé cầu đường BOT, chi phí sửa chữa phát sinh dọc đường do tài xế nộp về.
2. **Điểm mù trạng thái phương tiện (Fleet Visibility Blind Spots):** Không nắm bắt được thời gian thực xe nào đang rảnh (*Available*), xe nào đang trong chuyến công tác (*In-Use*), xe nào đang nằm xưởng (*Under Maintenance*), gây lãng phí công suất đội xe.
3. **Quên hạn bảo dưỡng & rủi ro pháp lý (Compliance & Maintenance Oversight):** Không có cơ chế cảnh báo tự động khi xe đạt mốc km bảo trì định kỳ hoặc đến hạn đăng kiểm, dẫn đến nguy cơ mất an toàn kỹ thuật và bị xử phạt hành chính khi lưu thông.
4. **Hệ thống phân tán thiếu tính cô lập (Lack of Fault Isolation in Legacy Systems):** Các hệ thống Monolith cũ nếu gặp sự cố ở module kế toán hoặc module gửi mail sẽ làm sập toàn bộ ứng dụng, chặn đứng việc điều phối xe.

### 1.2 Giải pháp & Mô hình tham chiếu (Product Solution)
Hệ thống **Vehicle Management System (VMS)** được thiết kế như một nền tảng quản trị đội xe doanh nghiệp đa dịch vụ (*Microservices-based Fleet Management Platform*), lấy cảm hứng từ các giải pháp quản lý hạm đội chuẩn công nghiệp (như Samsara, Fleetio), nhưng được tinh chỉnh tối ưu cho quy mô doanh nghiệp vừa và nhỏ:
* **Kiến trúc phân tán Microservices:** Tách biệt độc lập 5 domain nghiệp vụ (User, Vehicle, Cost, Email, Report) sau một API Gateway tập trung, áp dụng triệt để nguyên tắc *Database-per-Service*.
* **Tự động hóa cảnh báo (Automated Alerting Engine):** Tự động phát hiện ngưỡng bảo dưỡng và chi phí bất thường để gửi cảnh báo qua Email.
* **Chuẩn Cloud-Native:** Toàn bộ hệ thống được đóng gói container hóa (Dockerized) để sẵn sàng triển khai môi trường máy chủ ảo đám mây (*Cloud VPS*) với chi phí tối ưu.

### 1.3 Phạm vi đối tượng (Target Audience)
* **Giai đoạn ban đầu (Initial Release):** Đội ngũ vận hành nội bộ công ty bao gồm: Ban Quản trị (*System Administrator*), Trưởng phòng Hành chính/Điều phối Đội xe (*Fleet Manager*), và Tài xế/Nhân viên lái xe (*Company Drivers*).
* **Định hướng tương lai (Future Horizon):** Mở rộng API cho đối tác sửa chữa gara bên ngoài (*Third-party Garages*) và tích hợp thiết bị giám sát hành trình GPS/OBD-II trực tiếp từ cổng xe.

---

## 2. Phạm vi và Cốt lõi (Scope & Non-Goals)

### 2.1 Phạm vi cốt lõi (In-Scope)
Hệ thống phân ranh giới domain rõ ràng thành 5 microservices độc lập:

1. **User & Identity Domain (`user-service`):**
   * Quản lý định danh, xác thực tập trung qua JWT (*JSON Web Token*).
   * Phân quyền dựa trên vai trò (*Role-Based Access Control - RBAC*): `ADMIN`, `MANAGER`, `DRIVER`.
   * Quản lý hồ sơ nhân sự, tài xế và trạng thái tài khoản.
2. **Vehicle Domain (`vehicle-service`):**
   * Quản lý danh mục phương tiện, thông số kỹ thuật (biển số, hãng, dòng, số chỗ, tải trọng).
   * Quản lý vòng đời trạng thái phương tiện (`AVAILABLE`, `IN_USE`, `MAINTENANCE`).
   * Phân công tài xế chịu trách nhiệm chính và theo dõi số km tích lũy (*Odometer Tracking*).
3. **Expense & Cost Domain (`cost-service`):**
   * Ghi nhận các loại phiếu chi: Nhiên liệu (*Fuel*), Cầu đường (*Toll BOT*), Bảo trì (*Maintenance*), Bảo hiểm (*Insurance*), Khác (*Other*).
   * Lưu trữ metadata hóa đơn, gắn kết chi phí với xe và tài xế bằng khóa ngoại mềm (*Soft Foreign Key*).
   * Lọc và tra cứu chi phí đa chiều theo thời gian, theo loại và theo từng đầu xe.
4. **Notification Domain (`email-service`):**
   * Dịch vụ phi trạng thái (*Stateless Service*) tích hợp SMTP (Google Gmail API/SMTP).
   * Tự động gửi email thông báo bảo dưỡng định kỳ và cảnh báo chi phí đột biến.
   * Gửi thông báo phân công xe cho tài xế.
5. **Analytics & Reporting Domain (`report-service`):**
   * Tổng hợp chỉ số KPI hạm đội (Tổng xe, tỷ lệ khả dụng, tổng chi phí tháng).
   * Cung cấp dữ liệu chuỗi thời gian (*Time-series Data*) cho biểu đồ biến động chi phí 12 tháng.
   * Cơ cấu tỷ trọng chi phí và danh sách các xe tiêu hao chi phí cao nhất (*Top High-Cost Vehicles*).

### 2.2 Nằm ngoài phạm vi (Non-Goals / Future Features)
Để kiểm soát rủi ro phình phạm vi (*Scope Creep*) và tập trung hoàn thành đồ án chất lượng cao trong thời gian quy định, các tính năng sau **CHẮC CHẮN CHƯA THỰC HIỆN** trong giai đoạn này:
* **Non-Goal 01 (Real-time GPS Tracking):** Không gắn thiết bị phần cứng GPS để vẽ bản đồ thời gian thực trên bản đồ Google Maps. Vị trí và số km dựa trên kê khai chỉ số công-tơ-mét (*Odometer manual reporting*).
* **Non-Goal 02 (Payment Gateway Integration):** Không tích hợp cổng thanh toán trực tuyến (VNPAY, Momo, Stripe) để trừ tiền tài xế. Hệ thống chỉ ghi nhận dòng tiền đối soát kế toán.
* **Non-Goal 03 (Native Mobile App):** Không phát triển ứng dụng di động riêng biệt (Android/iOS Native). Sử dụng giao diện Web Responsive tối ưu trên trình duyệt di động cho tài xế.
* **Non-Goal 04 (Multi-Tenant Architecture):** Không hỗ trợ kiến trúc đa doanh nghiệp thuê chung hạ tầng. Hệ thống phục vụ một doanh nghiệp duy nhất với toàn bộ tài nguyên chuyên biệt.

---

## 3. Ràng buộc Hệ thống (System Constraints)

### 3.1 Ràng buộc về Tech Stack & Kiến trúc
* **Backend:** Ngôn ngữ Java 21 LTS; Framework Spring Boot 3.3.4; Quản lý gói bằng Maven Wrapper.
* **Frontend:** React 18, Vite Bundler, TypeScript 5.x; Styling bằng Tailwind CSS kết hợp Lucide React Icon System; Biểu đồ bằng Chart.js / Recharts.
* **Cơ sở dữ liệu:** MySQL 8.0 Engine InnoDB. Bắt buộc cấu trúc phân tách logic 4 schemas (`user_db`, `vehicle_db`, `cost_db`, `report_db`). Tuyệt đối không dùng câu lệnh `JOIN` xuyên cơ sở dữ liệu (*Cross-database JOIN*).
* **API Gateway:** Spring Cloud Gateway chạy ở cổng 8080 làm điểm truy cập duy nhất (*Single Entry Point*), xử lý CORS, phân luồng routing và kiểm tra sơ bộ Token Header.

### 3.2 Ràng buộc Vận hành Mạng & Môi trường Cloud VPS
* **Môi trường Container:** Bắt buộc 100% dịch vụ phải chạy được thông qua Docker Compose trên bridge network `vehicle-management-network`.
* **Giao tiếp nội bộ:** Các microservices gọi nhau thông qua service name nội bộ (ví dụ: `http://user-service:8081`), cấm tuyệt đối hardcode `localhost` hoặc IP tĩnh trong code backend.
* **Máy chủ mục tiêu:** Triển khai trên Linux VPS (Ubuntu 22.04 LTS x64, tối thiểu 2 vCPU, 4GB RAM).
* **Cơ chế suy thoái mềm (Graceful Degradation):** Nếu `email-service` hoặc `report-service` bị lỗi/tắt, luồng nghiệp vụ tạo xe (`vehicle-service`) và ghi chi phí (`cost-service`) vẫn phải ghi nhận thành công vào Database mà không được văng lỗi 500 ra màn hình người dùng.

---

## 4. Yêu cầu Chức năng (Functional Requirements - FR)

### FR-01: Xác thực & Cấp quyền Truy cập Tập trung (Authentication & Authorization)
* **Tên & Mô tả:** Cho phép người dùng đăng nhập hệ thống bằng tài khoản được cấp, tạo JWT và phân quyền sử dụng màn hình tương ứng.
* **Chi tiết dữ liệu & hành vi:**
  * **Trường dữ liệu tối thiểu:** `username` (VARCHAR 50, Unique), `password` (BCrypt Hash), `role` (ENUM: `ADMIN`, `MANAGER`, `DRIVER`), `status` (ENUM: `ACTIVE`, `LOCKED`).
  * **Xử lý đăng nhập:** Người dùng gửi `POST /api/v1/users/login`. Backend kiểm tra hash mật khẩu. Nếu đúng, sinh JWT Token có thời hạn sống 24 giờ chứa Payload: `{ userId, username, role, exp }`.
  * **Cơ chế phân quyền:** API Gateway và các Service Controller kiểm tra `Authorization: Bearer <token>` trên mỗi Request. Trả về `401 Unauthorized` nếu thiếu/hết hạn token; trả về `403 Forbidden` nếu người dùng không đủ quyền hạn vai trò.
* **Acceptance Signals:**
  1. Người dùng nhập sai mật khẩu -> Hệ thống hiển thị Toast thông báo đỏ: *"Tên đăng nhập hoặc mật khẩu không chính xác"*.
  2. Đăng nhập thành công bằng tài khoản `DRIVER` -> Hệ thống tự động chuyển hướng vào màn hình cá nhân tài xế, thanh điều hướng (*Sidebar*) ẩn toàn bộ mục "Quản lý Tài khoản" và "Dashboard Báo cáo".
  3. Khi gửi Request không đính kèm Token vào API `/api/v1/users` -> Hệ thống lập tức trả về mã HTTP `401`.

---

### FR-02: Quản lý Nhân sự & Hồ sơ Tài xế (User & Driver Management)
* **Tên & Mô tả:** Quản trị viên (`ADMIN`) quản lý danh sách toàn bộ nhân viên, thông tin giấy phép lái xe và trạng thái hoạt động.
* **Chi tiết dữ liệu & hành vi:**
  * **Trường dữ liệu tối thiểu:** `id` (PK), `full_name`, `email`, `phone`, `driver_license_number`, `driver_license_class` (B2, C, D, E), `role`, `status`.
  * **Luồng CRUD:** `POST /api/v1/users` (Tạo tài khoản mới), `GET /api/v1/users` (Danh sách có phân trang và lọc theo Role), `PUT /api/v1/users/{id}` (Cập nhật), `PATCH /api/v1/users/{id}/status` (Khóa/Kích hoạt tài khoản).
  * **Ràng buộc:** Email và Username không được trùng lặp trong hệ thống.
* **Acceptance Signals:**
  1. Admin bấm nút "Thêm nhân viên", nhập form với email đã tồn tại -> Form hiển thị lỗi dưới input: *"Email này đã được sử dụng"*.
  2. Admin bấm chuyển toggle trạng thái sang "LOCKED" của một tài xế -> Tài xế đó đang online bị đá văng ra trang Login tại lần gọi API tiếp theo.

---

### FR-03: Quản lý Danh mục & Hồ sơ Phương tiện (Vehicle Fleet Registry)
* **Tên & Mô tả:** Quản lý đội xe (`MANAGER` và `ADMIN`) quản lý hồ sơ kỹ thuật, thông số và trạng thái pháp lý của toàn bộ xe.
* **Chi tiết dữ liệu & hành vi:**
  * **Trường dữ liệu tối thiểu:** `id` (PK), `license_plate` (Biển số xe, Unique, định dạng chuẩn VN ví dụ: `29A-123.45`), `brand` (Hãng sản xuất: Toyota, Ford, Hyundai...), `model` (Dòng xe), `vehicle_type` (SEDAN, SUV, PICKUP, VAN, TRUCK), `seat_capacity` (Số chỗ ngồi), `manufacture_year` (Năm sản xuất), `current_odometer` (Số km hiện tại, INT >= 0), `status` (`AVAILABLE`, `IN_USE`, `MAINTENANCE`), `assigned_driver_id` (Khóa ngoại mềm tham chiếu `users.id`).
  * **Luồng tương tác:**
    * Thêm mới xe: `POST /api/v1/vehicles`. Mặc định trạng thái khởi tạo là `AVAILABLE`.
    * Cập nhật xe: `PUT /api/v1/vehicles/{id}`. Cho phép thay đổi thông tin kỹ thuật hoặc gán tài xế.
    * Xóa xe: `DELETE /api/v1/vehicles/{id}`. Chuyển trạng thái sang `DECOMMISSIONED` (Soft Delete) nếu xe đã phát sinh chi phí lịch sử để bảo toàn dữ liệu tài chính.
* **Acceptance Signals:**
  1. Tại màn hình Danh sách Xe, mỗi xe hiển thị thẻ Badge màu tương ứng: Xanh lá cho `AVAILABLE`, Xanh dương cho `IN_USE`, Đỏ/Vàng cho `MAINTENANCE`.
  2. Nhập biển số đã có trong hệ thống -> Hệ thống báo lỗi validation ngay lập tức: *"Biển số xe đã tồn tại"*.
  3. Có thanh tìm kiếm theo Biển số và bộ lọc Dropdown theo Hãng xe/Trạng thái; kết quả bảng phản hồi ngay lập tức trong vòng < 200ms.

---

### FR-04: Phân công Phương tiện & Cập nhật Công-tơ-mét (Vehicle Dispatch & Odometer Update)
* **Tên & Mô tả:** Điều phối xe cho tài xế và ghi nhận số km vận hành thực tế sau mỗi chuyến đi.
* **Chi tiết dữ liệu & hành vi:**
  * **Quy tắc trạng thái:**
    * Khi gán tài xế và xác nhận bắt đầu chuyến: Chuyển trạng thái xe từ `AVAILABLE` -> `IN_USE`.
    * Khi tài xế kết thúc chuyến và bàn giao xe: Nhập chỉ số công-tơ-mét mới (`new_odometer`).
  * **Ràng buộc logic:** Chỉ số `new_odometer` bắt buộc phải **lớn hơn hoặc bằng** `current_odometer` hiện tại của xe. Nếu nhập nhỏ hơn, từ chối cập nhật và báo lỗi dữ liệu phi logic.
* **Acceptance Signals:**
  1. Tài xế thao tác bàn giao xe với số km `15.000` trong khi số km hiện tại là `15.200` -> Giao diện chặn lại và hiển thị cảnh báo: *"Số km cập nhật không được nhỏ hơn số km hiện tại (15.200 km)"*.
  2. Bàn giao xe hợp lệ -> Trạng thái xe trên Dashboard của Manager tự động nhảy về `AVAILABLE`, và số km của xe tăng lên chính xác.

---

### FR-05: Quản lý Phiếu Chi phí & Hóa đơn Vận hành (Fleet Cost & Expense Logging)
* **Tên & Mô tả:** Ghi nhận và phân loại mọi khoản chi phí phát sinh gắn liền với từng đầu xe, hỗ trợ đính kèm hóa đơn chứng từ.
* **Chi tiết dữ liệu & hành vi:**
  * **Trường dữ liệu tối thiểu:** `id` (PK), `vehicle_id` (FK mềm tham chiếu xe), `driver_id` (FK mềm tham chiếu người chi), `cost_type` (`FUEL`, `TOLL`, `MAINTENANCE`, `INSURANCE`, `OTHER`), `amount` (DECIMAL, > 0), `odometer_at_cost` (Số km lúc chi), `cost_date` (Ngày chi, YYYY-MM-DD), `description` (Ghi chú chi tiết), `receipt_image_url` (Đường dẫn ảnh chứng từ/hóa đơn).
  * **Luồng tương tác:**
    * Tài xế/Quản lý gửi `POST /api/v1/costs` để tạo phiếu chi.
    * Xem lịch sử chi phí: `GET /api/v1/costs?vehicleId=...&fromDate=...&toDate=...`.
    * Xóa phiếu chi (Chỉ dành riêng cho `ADMIN` và `MANAGER`): `DELETE /api/v1/costs/{id}`.
* **Acceptance Signals:**
  1. Người dùng nhập số tiền âm (ví dụ `-500000`) -> Hệ thống báo lỗi: *"Số tiền chi phí phải lớn hơn 0"*.
  2. Số tiền được format chuẩn tiền tệ Việt Nam (ví dụ: gõ `2500000` -> hiển thị `2.500.000 ₫`).
  3. Màn hình chi phí có bộ lọc chọn khoảng ngày (*Date Range Picker*) và lọc theo từng loại chi phí; tổng tiền của các phiếu đang hiển thị được tự động tính tổng ở chân bảng (*Table Footer*).

---

### FR-06: Tự động hóa Cảnh báo & Gửi Thông báo Email (Automated Alerting Engine)
* **Tên & Mô tả:** Tự động giám sát ngưỡng hoạt động của xe và chi phí để gửi thông báo kịp thời tới Quản lý và Tài xế qua Email SMTP.
* **Chi tiết dữ liệu & hành vi:**
  * **Các kịch bản kích hoạt gửi email tự động:**
    1. *Cảnh báo bảo dưỡng (Maintenance Trigger):* Khi xe chạy vượt quá 5.000 km kể từ lần bảo dưỡng trước hoặc còn 7 ngày là đến ngày hẹn đăng kiểm.
    2. *Cảnh báo chi phí bất thường (High Expense Trigger):* Bất kỳ phiếu chi nào có số tiền vượt quá ngưỡng quy định (mặc định > 5.000.000 VNĐ cho một lần đổ xăng/sửa chữa).
    3. *Thông báo giao xe (Assignment Notification):* Gửi email thông báo cho tài xế khi được quản lý bàn giao xe mới.
  * **Giao thức:** Tích hợp Spring Boot Starter Mail qua cổng SMTP 587 (TLS) sử dụng App Password an toàn.
* **Acceptance Signals:**
  1. Quản lý tạo phiếu bảo dưỡng định kỳ cho xe -> Trong vòng < 5 giây, hộp thư Gmail của tài xế phụ trách nhận được email với tiêu đề chuẩn: *"[VMS] Thông báo lịch bảo dưỡng xe Biển số: 29A-123.45"*.
  2. Nếu mất kết nối Internet hoặc cấu hình SMTP sai -> Service ghi nhận lỗi vào log file, không làm treo ứng dụng và trả về cờ trạng thái `email_sent: false`.

---

### FR-07: Thống kê Trực quan & Bảng Điều khiển Phân tích (Analytics Dashboard)
* **Tên & Mô tả:** Cung cấp cho Ban Quản trị và Quản lý đội xe cái nhìn toàn cảnh về tình hình sức khỏe và tài chính của đội xe.
* **Chi tiết dữ liệu & hành vi:**
  * **Các khối dữ liệu hiển thị (Widgets):**
    * *Thẻ số liệu KPI (Metric Cards):* Tổng số xe, Xe sẵn sàng, Xe đang chạy, Xe bảo dưỡng, Tổng chi phí phát sinh trong tháng hiện tại.
    * *Biểu đồ cột chi phí 12 tháng (Monthly Expense Trend):* Trục hoành là tháng (T1..T12), trục tung là số tiền (VNĐ).
    * *Biểu đồ tròn cơ cấu chi phí (Expense Breakdown):* Tỷ lệ phần trăm tiền Nhiên liệu, Vé cầu đường, Bảo trì.
    * *Bảng Top 5 xe tốn kém nhất:* Hiển thị Biển số xe, Tài xế phụ trách, Số lần sửa chữa và Tổng chi phí đã tiêu tốn.
  * **API Endpoint:** `GET /api/v1/reports/summary`, `GET /api/v1/reports/cost-trends`.
* **Acceptance Signals:**
  1. Khi mở trang Dashboard, các thẻ KPI và biểu đồ hiển thị hiệu ứng Loading mượt mà (*Skeleton Card*), sau đó nạp dữ liệu hoàn tất trong < 500ms.
  2. Dữ liệu biểu đồ phản ánh chính xác 100% khớp với tổng tiền trong module `cost-service`. Khi thêm một phiếu chi mới bên module Cost, quay lại Dashboard chỉ số tổng tiền cập nhật ngay lập tức.

---

### FR-08: Định tuyến & Lọc Bảo vệ API Gateway (Gateway Routing & Security Filter)
* **Tên & Mô tả:** Điểm tiếp nhận duy nhất cho toàn bộ Frontend, thực hiện định tuyến động tới các Microservices nội bộ và kiểm soát lưu lượng.
* **Chi tiết dữ liệu & hành vi:**
  * Định tuyến URL chuẩn hóa:
    * `/api/v1/users/**` -> `http://user-service:8081`
    * `/api/v1/vehicles/**` -> `http://vehicle-service:8082`
    * `/api/v1/costs/**` -> `http://cost-service:8083`
    * `/api/v1/emails/**` -> `http://email-service:8084`
    * `/api/v1/reports/**` -> `http://report-service:8085`
  * Cấu hình CORS tập trung: Cho phép Origin từ Web Frontend (`http://localhost:5173` và IP VPS Cloud).
* **Acceptance Signals:**
  1. Frontend chỉ cần cấu hình duy nhất một biến môi trường `VITE_API_BASE_URL=http://<IP_GATEWAY>:8080`, toàn bộ Request đều đi qua cổng này mà không gặp lỗi CORS.
  2. Bất kỳ Request nào gọi sai đường dẫn (ví dụ `/api/v1/unknown`) -> Gateway phản hồi ngay mã HTTP `404 Not Found` dạng JSON chuẩn.

---

## 5. Yêu cầu Phi Chức năng (Non-Functional Requirements - NFR)

### NFR-01: Hiệu năng & Tốc độ phản hồi (Performance & Responsiveness)
* **Thời gian phản hồi API (Latency):** 95% số yêu cầu API thông thường (CRUD dữ liệu danh mục) qua Gateway phải có thời gian phản hồi `< 300ms` trong điều kiện tải bình thường.
* **Tốc độ tải trang Dashboard:** Thời gian hiển thị lần đầu (*First Contentful Paint - FCP*) của ứng dụng React Frontend `< 1.2s`.
* **Tối ưu hóa tài nguyên JVM:** Mỗi microservice Java Spring Boot được cấu hình giới hạn bộ nhớ JVM Heap: `-Xms128m -Xmx256m` để đảm bảo tổng thể cả 6 services chạy mượt mà trên máy chủ VPS có RAM 4GB.

### NFR-02: Bảo mật & Quyền riêng tư (Security & Privacy)
* **Mã hóa thông tin đăng nhập:** Mật khẩu người dùng bắt buộc mã hóa bằng thuật toán **BCrypt** với độ phức tạp tối thiểu 10 vòng (*Strength factor = 10*). Tuyệt đối cấm lưu mật khẩu dạng văn bản thuần (*Plain-text*).
* **Bảo vệ Secret & Credentials:** Không lưu bất kỳ mật khẩu Database, JWT Secret, hoặc mật khẩu Gmail SMTP trong mã nguồn Git. 100% bí mật phải được nạp thông qua biến môi trường (`.env`).
* **Cô lập mạng máy chủ:** Cổng cơ sở dữ liệu MySQL `3306` chỉ mở trong mạng nội bộ Docker bridge `vehicle-management-network`, không mở công khai ra Internet khi deploy lên VPS production.

### NFR-03: Tính sẵn sàng & Toàn vẹn dữ liệu (Reliability & Data Integrity)
* **Toàn vẹn giao dịch (ACID Transactions):** Tất cả các thao tác thay đổi dữ liệu liên quan đến nhiều bảng trong cùng 1 service phải được bọc trong annotation `@Transactional`. Rollback 100% nếu xảy ra lỗi giữa chừng.
* **Tính độc lập lỗi (Fault Isolation):** Sự cố tại các service phụ trợ (`email-service`, `report-service`) không được phép làm gián đoạn các luồng nghiệp vụ cốt lõi tại `vehicle-service` và `user-service`.
* **Tính bền vững dữ liệu (Persistence):** Toàn bộ dữ liệu của 4 schemas MySQL được ánh xạ vào Docker Volume `mysql_data`, đảm bảo khởi động lại hoặc build lại container thì dữ liệu không bao giờ bị mất (*Zero Data Loss*).

### NFR-04: Đa ngôn ngữ, Kiểu chữ & Mã hóa (Typography & Encoding)
* **Hỗ trợ Unicode:** Toàn bộ hệ thống (Database, API Gateway, Spring Boot Jackson, Frontend) sử dụng thống nhất bảng mã **UTF-8 (utf8mb4)** để hỗ trợ tiếng Việt có dấu hoàn hảo, không bị lỗi font hay ký tự lạ (*Mojibake*).
* **Hệ thống phông chữ (Typography):** Ứng dụng sử dụng phông chữ hình học hiện đại **Inter / Roboto** tối ưu cho hiển thị bảng biểu số liệu và dashboard kỹ thuật.
* **Quy chuẩn định dạng địa phương:**
  * Tiền tệ: Hiển thị định dạng VNĐ có phân cách hàng nghìn bằng dấu chấm (Ví dụ: `15.000.000 ₫`).
  * Ngày tháng: Hiển thị chuẩn Việt Nam `DD/MM/YYYY` trên giao diện, truyền nhận qua API chuẩn ISO-8601 (`YYYY-MM-DD`).

### NFR-05: Trải nghiệm người dùng nền tảng (Platform Usability & Accessibility)
* **Trạng thái phản hồi trực quan (UI Feedback):** Mọi hành động thêm/sửa/xóa đều phải có thông báo tức thời (*Toast Notification*) hiển thị trong 3 giây.
* **Trạng thái tải & Rỗng (Loading & Empty States):** Khi đang tải dữ liệu bảng biểu phải có hiệu ứng Skeleton Loading; khi bảng không có dữ liệu phải hiển thị hình minh họa và thông báo: *"Chưa có dữ liệu nào được ghi nhận"*.
* **Xác nhận thao tác nguy hiểm (Destructive Action Confirmation):** Khi người dùng bấm xóa một phương tiện hoặc tài khoản, bắt buộc phải bật hộp thoại xác nhận (*Confirmation Modal*): *"Bạn có chắc chắn muốn xóa không?"* trước khi gửi lệnh lên Server.

---

## 6. Lộ trình Triển khai Phân kỳ (Phase Implementation Roadmap)

Lộ trình phát triển được thiết kế chặt chẽ theo 4 giai đoạn, phân bổ cân bằng cho nhóm 4 thành viên:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LỘ TRÌNH 4 GIAI ĐOẠN TRIỂN KHAI DỰ ÁN VMS                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
  Phase 1: Khung nền tảng (Base Setup)     ───► ĐÃ HOÀN THÀNH (100% Base Skeleton)
  Phase 2: Phát triển Độc lập Module       ───► 4 Người làm song song trên 4 nhánh Feature
  Phase 3: Tích hợp & Kiểm thử Toàn diện   ───► Gộp nhánh vào 'dev', test liên service
  Phase 4: Đóng gói & Triển khai Cloud VPS ───► Deploy Docker Compose lên máy chủ VPS
```

### Bảng Phân kỳ Chi tiết & Phân công Công việc:

| Giai đoạn (Phase) | Trọng tâm Triển khai | Yêu cầu Chức năng (FR) liên quan | Người phụ trách chính |
| :--- | :--- | :--- | :--- |
| **Phase 1: Hạ tầng Cơ sở** *(Hoàn thành)* | Thiết lập 6 Services, Docker Compose, Database schemas, Gateway routing, Cấu trúc Frontend module. | **FR-08** (Gateway Routing), Hạ tầng Docker & MySQL | Cả nhóm (Leader chủ trì) |
| **Phase 2.1: Domain Người dùng** *(Tuần 1-2)* | Hoàn thiện bảng `users`, mã hóa BCrypt, phát hành JWT token, phân quyền RBAC, màn hình Login và CRUD User. | **FR-01**, **FR-02** | **Thành viên 1** (`feature/user-service`) |
| **Phase 2.2: Domain Phương tiện** *(Tuần 1-2)* | Hoàn thiện bảng `vehicles`, nghiệp vụ trạng thái xe, phân công tài xế, cập nhật số km, danh sách xe và modal tạo xe. | **FR-03**, **FR-04** | **Thành viên 2** (`feature/vehicle-service`) |
| **Phase 2.3: Domain Chi phí** *(Tuần 1-2)* | Hoàn thiện bảng `costs`, phân loại nhiên liệu/cầu đường/bảo trì, tính tổng chi phí theo xe, form nhập và lọc chi phí. | **FR-05** | **Thành viên 3** (`feature/cost-service`) |
| **Phase 2.4: Domain Báo cáo & Email** *(Tuần 1-2)* | Cấu hình JavaMailSender, logic gửi mail cảnh báo bảo dưỡng; tính toán KPI, vẽ biểu đồ Chart.js trên Dashboard. | **FR-06**, **FR-07** | **Thành viên 4** (`feature/report-email-service`) |
| **Phase 3: Tích hợp Hệ thống** *(Tuần 3)* | Merge các nhánh feature vào `dev`. Kiểm thử kết nối liên thông từ Frontend qua Gateway tới các DB. Sửa lỗi hồi quy (*Regression testing*). | Toàn bộ từ **FR-01** đến **FR-08** | Cả nhóm 4 người |
| **Phase 4: Triển khai VPS & Nghiệm thu** *(Tuần 4)* | Merge vào `main`. Thuê máy chủ Cloud VPS, chạy `docker compose up --build -d`, cấu hình Nginx Reverse Proxy, làm slide báo cáo. | **NFR-01** đến **NFR-05**, Triển khai Cloud Production | Cả nhóm 4 người |

---

## 7. Lời kết Định hướng Tuân thủ cho Đội ngũ Kỹ sư

Tài liệu PRD này là bản cam kết kỹ thuật duy nhất xác định phạm vi và tiêu chuẩn chất lượng của hệ thống **Vehicle Management System (VMS)**. 

Tất cả 4 thành viên trong nhóm phát triển được yêu cầu:
1. **Tuyệt đối bám sát ranh giới Domain:** Không sửa file nằm ngoài thư mục microservice được phân công.
2. **Tuân thủ triệt để Tiêu chuẩn API & Schema:** Dữ liệu phản hồi phải bọc trong `ApiResponse<T>`, không tự ý đổi kiểu dữ liệu các trường khóa ngoại mềm (`userId`, `vehicleId`).
3. **Mỗi tính năng hoàn thành chỉ được coi là đạt yêu cầu (*Done Definition*) khi và chỉ khi vượt qua đầy đủ các *Acceptance Signals* tương ứng đã định nghĩa trong tài liệu này.**
