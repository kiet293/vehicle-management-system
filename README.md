# Hệ Thống Quản Lý Phương Tiện (Vehicle Management System - VMS)

> **Đồ án môn học: Điện toán đám mây & Kiến trúc Microservices**  
> Dự án khung nền tảng khởi tạo (Base Project Skeleton) cho Hệ thống Quản lý Phương tiện giao thông.

---

## 1. Tổng Quan Dự Án

**Vehicle Management System (VMS)** là hệ thống quản lý đội xe và phương tiện giao thông dành cho doanh nghiệp, được xây dựng theo mô hình **Kiến trúc Microservices** hiện đại, độc lập và có khả năng mở rộng cao.

Dự án hiện tại là **Base Project** (Khung dự án cơ sở):
* Đã thiết lập hoàn chỉnh cơ sở hạ tầng, mạng nội bộ Docker, định tuyến API Gateway, 4 cơ sở dữ liệu riêng biệt trên MySQL 8.0, và giao diện Frontend React Dashboard.
* Chưa triển khai các nghiệp vụ chi tiết (Đăng nhập, CRUD Xe, Quản lý Chi phí, Gửi Email, Báo cáo thống kê) theo đúng lộ trình phân kỳ phát triển của đồ án.

---

## 2. Kiến Trúc Hệ Thống (Architecture)

Hệ thống hoạt động theo mô hình Microservices chuẩn. Toàn bộ lưu lượng truy cập từ phía người dùng Client sẽ đi qua **API Gateway** trung tâm trước khi được định tuyến tới các dịch vụ nghiệp vụ nội bộ:

```text
                                [ Trình duyệt Client ]
                                           │
                                           ▼ (Port 5173 / 80)
                         ┌───────────────────────────────────┐
                         │      Frontend (React + Vite)      │
                         └───────────────────────────────────┘
                                           │
                                           ▼ (HTTP / Port 8080)
                         ┌───────────────────────────────────┐
                         │    API Gateway (Spring Cloud)     │
                         └───────────────────────────────────┘
                                           │
             ┌──────────────┬──────────────┴─────┬──────────────┬──────────────┐
             │              │                    │              │              │
             ▼              ▼                    ▼              ▼              ▼
     ┌──────────────┐┌──────────────┐    ┌──────────────┐┌──────────────┐┌──────────────┐
     │ User Service ││Vehicle Service│   │ Cost Service ││Email Service ││Report Service│
     │ (Cổng 8081)  ││ (Cổng 8082)  │    │ (Cổng 8083)  ││ (Cổng 8084)  ││ (Cổng 8085)  │
     └──────┬───────┘└──────┬───────┘    └──────┬───────┘└──────────────┘└──────┬───────┘
            │               │                   │          (Không lưu DB)       │
            └───────────────┼───────────────────┼───────────────────────────────┘
                            ▼                   ▼
                     ┌───────────────────────────────────┐
                     │             MySQL 8.0             │
                     │ (user_db, vehicle_db,             │
                     │  cost_db, report_db)              │
                     └───────────────────────────────────┘
```

### Mạng nội bộ Docker (Docker Network)
* Toàn bộ 8 dịch vụ kết nối với nhau qua bridge network: `vehicle-management-network`.
* Việc giao tiếp giữa các dịch vụ bên trong Docker sử dụng **tên dịch vụ (service name)** (ví dụ: `http://user-service:8081`), **tuyệt đối không dùng `localhost`**.

---

## 3. Công Nghệ Sử Dụng

| Thành phần | Công nghệ | Phiên bản | Mục đích |
| :--- | :--- | :--- | :--- |
| **Ngôn ngữ Backend** | Java (OpenJDK) | 21 (LTS) | Môi trường thực thi backend chính |
| **Framework Backend** | Spring Boot | 3.3.4 | Nền tảng xây dựng các Microservices |
| **API Gateway** | Spring Cloud Gateway | 2023.0.3 | Điểm tiếp nhận request, định tuyến, CORS |
| **Build Tool** | Apache Maven | 3.9+ | Quản lý thư viện và vòng đời dự án Java |
| **Cơ sở dữ liệu** | MySQL Server | 8.0 | Hệ quản trị CSDL quan hệ (4 schema riêng) |
| **Frontend UI** | React + TypeScript + Vite | 18.3 / 5.4 | Giao diện Dashboard SPA Dark-mode |
| **Icons & Styling** | Lucide React + Vanilla CSS | Mới nhất | Hệ thống giao diện trực quan, glassmorphism |
| **Containerization** | Docker & Docker Compose | Spec mới nhất | Đóng gói và điều phối toàn bộ hệ thống |
| **Web Server** | Nginx | 1.25+ | Cấu hình Reverse Proxy chuẩn bị cho tương lai |

---

## 4. Danh Sách Dịch Vụ & Bảng Phân Bổ Cổng (Port)

| Tên Dịch Vụ | Cổng Host | URL Nội Bộ Docker | Cơ Sở Dữ Liệu | Tiền Tố Route (Gateway) | Endpoint Health Check |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Frontend** | `5173` | `http://frontend:5173` | — | `/` | — |
| **API Gateway** | `8080` | `http://api-gateway:8080` | — | `/api/**` | `http://localhost:8080/actuator/health` |
| **User Service** | `8081` | `http://user-service:8081` | `user_db` | `/api/auth/**`, `/api/users/**` | `http://localhost:8081/actuator/health` |
| **Vehicle Service** | `8082` | `http://vehicle-service:8082` | `vehicle_db` | `/api/vehicles/**` | `http://localhost:8082/actuator/health` |
| **Cost Service** | `8083` | `http://cost-service:8083` | `cost_db` | `/api/costs/**` | `http://localhost:8083/actuator/health` |
| **Email Service** | `8084` | `http://email-service:8084` | *(Stateless)* | `/api/email/**` | `http://localhost:8084/actuator/health` |
| **Report Service** | `8085` | `http://report-service:8085` | `report_db` | `/api/reports/**` | `http://localhost:8085/actuator/health` |
| **MySQL Server** | `3306` | `http://mysql:3306` | 4 Schemas | — | `mysqladmin ping` |

---

## 5. Cấu Trúc Thư Mục Dự Án

```text
vehicle-management-system/
│
├── api-gateway/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/gateway/
│           │   └── ApiGatewayApplication.java
│           └── resources/
│               └── application.yml
│
├── user-service/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/user/
│           │   ├── UserServiceApplication.java
│           │   ├── controller/
│           │   ├── service/
│           │   ├── repository/
│           │   ├── entity/
│           │   ├── dto/
│           │   ├── config/
│           │   └── exception/
│           └── resources/
│               └── application.yml
│
├── vehicle-service/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/vehicle/
│           │   ├── VehicleServiceApplication.java
│           │   └── [các package: controller, service, repository,...]
│           └── resources/
│               └── application.yml
│
├── cost-service/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/cost/
│           │   ├── CostServiceApplication.java
│           │   └── [các package: controller, service, repository,...]
│           └── resources/
│               └── application.yml
│
├── email-service/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/email/
│           │   ├── EmailServiceApplication.java
│           │   └── [các package: controller, service, repository,...]
│           └── resources/
│               └── application.yml
│
├── report-service/
│   └── backend/
│       ├── Dockerfile
│       ├── pom.xml
│       └── src/main/
│           ├── java/com/vms/report/
│           │   ├── ReportServiceApplication.java
│           │   └── [các package: controller, service, repository,...]
│           └── resources/
│               └── application.yml
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env
│   ├── .env.example
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── modules/
│       │   ├── user/          <-- Phân hệ User (TV1: components, pages, services, types)
│       │   ├── vehicle/       <-- Phân hệ Vehicle (TV2: components, pages, services, types)
│       │   ├── cost/          <-- Phân hệ Cost (TV3: components, pages, services, types)
│       │   ├── email/         <-- Phân hệ Email (TV4: components, pages, services, types)
│       │   └── report/        <-- Phân hệ Report & Dashboard (TV5: components, pages, services, types)
│       ├── components/
│       │   └── common/        <-- UI dùng chung (Button, Modal, Loading, ErrorMessage, Navbar)
│       ├── hooks/
│       ├── layouts/
│       ├── routes/
│       ├── services/
│       │   ├── api.ts
│       │   └── healthService.ts
│       ├── types/
│       │   ├── common.ts
│       │   └── index.ts
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       └── vite-env.d.ts
│
├── mysql/
│   └── init/
│       └── 01-init-databases.sql       <-- Tự động tạo 4 DB: user_db, vehicle_db, cost_db, report_db
│
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
│
├── docker-compose.yml                  <-- Quản lý khởi chạy 8 containers
├── .env                                <-- Biến môi trường hoạt động
├── .env.example                        <-- Mẫu biến môi trường
├── .gitignore
└── README.md
```

---

## 6. Hướng Dẫn Chạy Dự Án Bằng Docker Compose (Khuyên Dùng)

Đây là cách chuẩn hóa và thuận tiện nhất để chạy toàn bộ hệ sinh thái của đồ án trên mọi máy tính.

### Điều kiện tiên quyết:
* Máy tính đã cài đặt và **đang mở ứng dụng Docker Desktop** (icon cá voi chuyển sang màu xanh lá cây).

---

### Bước 1: Chuẩn bị file biến môi trường
Kiểm tra xem thư mục gốc đã có file `.env` chưa. Nếu chưa có, copy từ file mẫu:
```bash
cp .env.example .env
```

---

### Bước 2: Khởi động hệ thống

#### 🟢 Cách 1: Khởi động nhanh hàng ngày (Khuyên dùng)
Khi code chưa có sửa đổi lớn hoặc đã build trước đó, bạn chỉ cần chạy:
```bash
docker compose up -d
```
* Cờ `-d` (*detached*): Giúp các container chạy ngầm dưới nền, giải phóng cửa sổ terminal ngay lập tức.

#### 🔨 Cách 2: Khởi động kèm biên dịch lại code mới
Khi bạn vừa **sửa code Java, sửa frontend, hoặc đổi cấu hình**:
```bash
docker compose up --build -d
```

---

### Bước 3: Truy cập và sử dụng
* **Giao diện Dashboard:** [http://localhost:5173](http://localhost:5173)  
  *(Trên màn hình có nút **"Ping All Health Checks"**, bấm vào để kiểm tra toàn bộ 6 service đang kết nối)*
* **API Gateway:** [http://localhost:8080](http://localhost:8080)
* **Kiểm tra sức khỏe Gateway:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

### Bước 4: Tắt hệ thống khi nghỉ
Khi kết thúc phiên làm việc:
```bash
docker compose down
```
> Dữ liệu bảng và thiết lập của MySQL sẽ được lưu an toàn trong Docker Volume (`mysql_data`), không bị mất khi chạy lệnh này.  
> Nếu bạn muốn xóa sạch dữ liệu database để tạo lại từ đầu: `docker compose down -v`.

---

### 📋 Bảng tra cứu các lệnh Docker Compose thường dùng

| Nhu cầu công việc | Lệnh chạy |
| :--- | :--- |
| **Bật nhanh hàng ngày** | `docker compose up -d` |
| **Bật và build lại code mới** | `docker compose up --build -d` |
| **Tắt toàn bộ hệ thống** | `docker compose down` |
| **Xem các container đang chạy** | `docker compose ps` |
| **Xem log toàn bộ các service** | `docker compose logs -f` |
| **Xem log 1 service cụ thể** | `docker compose logs -f api-gateway`<br>`docker compose logs -f user-service` |
| **Khởi động lại 1 service** | `docker compose restart api-gateway` |

---

## 7. Hướng Dẫn Chạy Cục Bộ Từng Phần (Không Dùng Docker)

Nếu cần debug sâu từng dòng code Java trên IDE (IntelliJ IDEA / Eclipse / VS Code):

### 1. Chuẩn bị MySQL Server
Đảm bảo MySQL đang chạy ở cổng `localhost:3306`. Chạy script trong file [mysql/init/01-init-databases.sql](file:///d:/code/dientoandammay/vehicle-management-system/mysql/init/01-init-databases.sql) để tạo 4 databases.

### 2. Chạy Backend bằng Maven
Mở terminal tại thư mục backend của service cần chạy:

```bash
# 1. Chạy API Gateway (Cổng 8080)
cd api-gateway/backend
mvn spring-boot:run

# 2. Chạy User Service (Cổng 8081)
cd user-service/backend
mvn spring-boot:run

# 3. Chạy Vehicle Service (Cổng 8082)
cd vehicle-service/backend
mvn spring-boot:run

# 4. Chạy Cost Service (Cổng 8083)
cd cost-service/backend
mvn spring-boot:run

# 5. Chạy Email Service (Cổng 8084)
cd email-service/backend
mvn spring-boot:run

# 6. Chạy Report Service (Cổng 8085)
cd report-service/backend
mvn spring-boot:run
```

*(Hoặc mở trực tiếp file `...Application.java` trong IntelliJ IDEA và bấm nút **Run**).*

### 3. Chạy Frontend bằng Vite
Mở terminal tại thư mục `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: [http://localhost:5173](http://localhost:5173).

---

## 8. Kiểm Tra Các Endpoint Sức Khỏe (Health Checks)

Tất cả các dịch vụ Spring Boot đều tích hợp sẵn Spring Boot Actuator:

| Dịch vụ | Lệnh kiểm tra | Kết quả mong đợi |
| :--- | :--- | :---: |
| **API Gateway** | `curl http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| **User Service** | `curl http://localhost:8081/actuator/health` | `{"status":"UP"}` |
| **Vehicle Service** | `curl http://localhost:8082/actuator/health` | `{"status":"UP"}` |
| **Cost Service** | `curl http://localhost:8083/actuator/health` | `{"status":"UP"}` |
| **Email Service** | `curl http://localhost:8084/actuator/health` | `{"status":"UP"}` |
| **Report Service** | `curl http://localhost:8085/actuator/health` | `{"status":"UP"}` |

---

## 9. Danh Mục Biến Môi Trường (.env)

Tất cả các thông số bảo mật, mật khẩu CSDL và cấu hình mạng đều được quản lý tập trung qua file `.env`, không bị hardcode trong mã nguồn:

| Tên biến | Ý nghĩa | Giá trị mặc định |
| :--- | :--- | :--- |
| `MYSQL_ROOT_PASSWORD` | Mật khẩu tài khoản `root` của MySQL | `rootpassword` |
| `DB_USERNAME` | Tên user ứng dụng kết nối MySQL | `vms_user` |
| `DB_PASSWORD` | Mật khẩu user ứng dụng | `vms_password` |
| `DB_HOST` | Hostname của CSDL | `mysql` (Docker) / `localhost` (cục bộ) |
| `DB_PORT` | Cổng CSDL MySQL | `3306` |
| `VITE_API_BASE_URL` | Địa chỉ API Gateway mà Frontend gọi | `http://localhost:8080` |
| `JWT_SECRET` | Khóa bí mật ký JWT (dành cho phân hệ Auth sau này) | *(Placeholder)* |
| `MAIL_USERNAME` | Email gửi thông báo SMTP | *(Placeholder)* |
| `MAIL_PASSWORD` | Mật khẩu ứng dụng gửi mail | *(Placeholder)* |

---

## 10. Kế Hoạch & Các Bước Tiếp Theo

1. **Khung nền tảng (Base Project):** Đã hoàn tất 100% cấu trúc, build và kiểm thử chạy thông suốt cả 8 containers.
2. **Giai đoạn tiếp theo:** Bắt đầu tiến hành xây dựng các tính năng nghiệp vụ theo yêu cầu của nhóm (User Service & Authentication, Quản lý Phương tiện, v.v.).
