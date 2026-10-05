# KẾ HOẠCH TRIỂN KHAI — VEHICLE SERVICE (Người 2)

> **Mục đích tài liệu:** Đây là "bộ nhớ" xuyên suốt các phiên làm việc. Khi mở phiên chat mới, chỉ cần đọc file này là tiếp tục được mà không cần đọc lại toàn bộ codebase.
>
> **Người thực hiện:** Người 2 – VEHICLE SERVICE
> **Branch:** `feature/vehicle-service`
> **Base:** `dev`
> **Trạng thái tài liệu:** Sẽ cập nhật `[x]` / `[ ]` sau mỗi mục hoàn thành.

---

## 0. QUY ẮN BẮT BUỘC ĐỌC TRƯỚC KHI CODE

### 0.1 Phạm vi sở hữu (KHÔNG được sửa ngoài phạm vi này)

| Được sửa | Tuyệt đối KHÔNG sửa |
|---|---|
| `vehicle-service/**` | `frontend/src/modules/user/**` |
| `frontend/src/modules/vehicle/**` | `frontend/src/modules/cost/**` |
| `vehicle-service/backend/src/test/**` | `frontend/src/modules/report/**` |
| `doc/VEHICLE_PLAN.md` (file này) | `frontend/src/modules/email/**` |
| | `user-service/**`, `cost-service/**`, `report-service/**`, `email-service/**` |
| | `api-gateway/**`, `mysql/**`, `docker-compose.yml` |

> Ngoại lệ duy nhất được phép: `frontend/src/types/index.ts` — **chỉ thêm type mới**, không sửa/xóa type đang được module khác dùng.

### 0.2 Luật Git bắt buộc

```
1. Mỗi mục (#5, #6, #7, #8) = 1 commit riêng. KHÔNG gộp.
2. Trước mỗi mục:  git fetch origin && git rebase origin/dev
3. Chỉ add file thuộc phạm vi mình. KHÔNG `git add .`
4. KHÔNG commit file cá nhân (phanCongViec.txt)
5. KHÔNG push trực tiếp lên dev/main
```

Commit message theo Conventional Commits (khớp style repo hiện tại):
- `feat(vehicle): ...`
- `refactor(vehicle): ...`
- `test(vehicle): ...`

### 0.3 Kiểm tra trước khi commit (bắt buộc)

Máy này **KHÔNG có Maven/Java cài trên host**. Phải build bằng Docker.

```powershell
# Backend compile check (bắt buộc pass trước khi commit)
docker build -t vms-vehicle-service:verify ./vehicle-service/backend
# -> phải thấy "BUILD SUCCESS"
```

```powershell
# Frontend typecheck (bắt buộc pass trước khi commit)
cd frontend
npx tsc --noEmit
# -> phải exit code 0, không output lỗi
```

### 0.4 Môi trường test API

Port 3306 trên máy đã bị MySQL local (`MySQL80`) chiếm → `docker compose up` sẽ FAIL.
Dùng cách sau để test:

```powershell
docker network create vms-verify-net
docker run -d --name vms-verify-mysql --network vms-verify-net `
  -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=vehicle_db -p 3307:3306 mysql:8.0
Start-Sleep -Seconds 30
docker exec vms-verify-mysql mysqladmin ping -uroot -prootpassword

docker run -d --name vms-verify-vehicle --network vms-verify-net -p 18082:8082 `
  -e SERVER_PORT=8082 -e DB_HOST=vms-verify-mysql -e DB_PORT=3306 `
  -e DB_NAME=vehicle_db -e DB_USERNAME=root -e DB_PASSWORD=rootpassword `
  vms-vehicle-service:verify
Start-Sleep -Seconds 35
# Base URL test: http://localhost:18082
```

Dọn dẹp sau khi test:
```powershell
docker rm -f vms-verify-vehicle vms-verify-mysql
docker network rm vms-verify-net
docker rmi vms-vehicle-service:verify
```

---

## 1. BỐI CẢNH KIẾN TRÚC (đọc để không phá vỡ luồng hiện có)

### 1.1 Backend hiện có

```
vehicle-service/backend/src/main/java/com/vms/vehicle/
├── VehicleServiceApplication.java
├── common/ApiResponse.java              # {success, message, data, timestamp}
├── config/
│   ├── AppConfig.java                    # RestTemplate bean (cho EmailClient)
│   ├── DataInitializer.java              # seed 5 xe mẫu nếu DB rỗng
│   └── package-info.java
├── controller/VehicleController.java    # @RequestMapping({"/api/vehicles", "/api/v1/vehicles"})
├── dto/
│   ├── VehicleDTO.java                   # có static fromEntity()
│   ├── CreateVehicleRequest.java         # đã có @Valid annotations
│   ├── UpdateVehicleRequest.java
│   ├── AssignDriverRequest.java
│   ├── ReturnVehicleRequest.java
│   └── UpdateVehicleStatusRequest.java
├── entity/
│   ├── Vehicle.java                      # @Table(name="vehicles")
│   ├── VehicleStatus.java                # AVAILABLE, IN_USE, MAINTENANCE, DECOMMISSIONED
│   └── VehicleType.java                  # SEDAN, SUV, PICKUP, VAN, TRUCK
├── exception/
│   ├── BadRequestException.java           # -> HTTP 400
│   ├── ResourceNotFoundException.java     # -> HTTP 404
│   └── GlobalExceptionHandler.java        # 6 handler
├── repository/
│   ├── VehicleRepository.java             # extends JpaRepository + JpaSpecificationExecutor
│   └── VehicleSpecifications.java        # filterBy(status, brand, search)
└── service/
    ├── VehicleService.java               # @Service trực tiếp, KHÔNG có interface/impl
    └── EmailClient.java                   # fault isolation, nuốt exception
```

### 1.2 Endpoint backend hiện có (đã verify 28 test pass)

| Method | Path | Query/Body | Trạng thái |
|---|---|---|---|
| GET | `/api/vehicles`, `/api/v1/vehicles` | `?status=&brand=&search=` | ✅ |
| GET | `/api/vehicles/{id}` | — | ✅ |
| POST | `/api/vehicles` | CreateVehicleRequest | ✅ 201 |
| PUT | `/api/vehicles/{id}` | UpdateVehicleRequest | ✅ |
| DELETE | `/api/vehicles/{id}` | — | ✅ soft-delete → DECOMMISSIONED |
| POST | `/api/vehicles/{id}/assign` | AssignDriverRequest | ✅ |
| POST | `/api/vehicles/{id}/return` | ReturnVehicleRequest | ✅ |
| PUT/PATCH | `/api/vehicles/{id}/status` | UpdateVehicleStatusRequest | ✅ |

**Gateway** đã route cả 2 prefix (`api-gateway/.../application.yml:18-21`):
```yaml
- id: vehicle-service
  uri: ${VEHICLE_SERVICE_URL:http://vehicle-service:8082}
  predicates:
    - Path=/api/vehicles/**, /api/v1/vehicles/**
```
→ Thêm endpoint mới phải dùng 1 trong 2 prefix này, KHÔNG được tạo prefix thứ 3.

### 1.3 Nghiệp vụ đã có (đừng phá vỡ)

| Rule | Nơi thực hiện |
|---|---|
| Ngưỡng bảo dưỡng 5.000 km → auto chuyển `MAINTENANCE` | `VehicleService.returnVehicle()` |
| Hoàn thành BD → reset `lastMaintenanceOdometer = currentOdometer` | `VehicleService.updateStatus()` |
| Chỉ xe `AVAILABLE` mới được bàn giao tài xế | `VehicleService.assignDriver()` |
| `newOdometer` phải ≥ `currentOdometer` | `VehicleService.returnVehicle()` |
| `lastMaintenanceOdometer` ≤ `currentOdometer` | `VehicleService.updateVehicle()` |
| Biển số tự chuẩn hóa `29a88888` → `29A-888.88` | `VehicleService.normalizePlate()` |
| `maintenanceDue` = `(current - lastMaintenance) >= 5000` | `VehicleDTO.fromEntity()` |

### 1.4 Frontend hiện có

```
frontend/src/modules/vehicle/
├── pages/VehiclePage.tsx       # 1174 dòng — MONOLITH, cần tách (mục #6)
└── services/vehicleService.ts  # 8 hàm, đã gọi đúng qua /api/vehicles
frontend/src/modules/vehicle/components/   # CHỈ có .gitkeep
```

**Types chuẩn** nằm ở `frontend/src/types/index.ts` (KHÔNG tạo file types riêng cho module — đã xóa file rác `modules/vehicle/types/index.ts` ở nhóm P0):

```ts
export type VehicleType = 'SEDAN' | 'SUV' | 'PICKUP' | 'VAN' | 'TRUCK';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  vehicleType: VehicleType;
  seatCapacity: number;
  manufactureYear: number;
  currentOdometer: number;
  lastMaintenanceOdometer: number;
  status: VehicleStatus;
  assignedDriverId?: number;
  assignedDriverName?: string;
  imageUrl?: string;
  maintenanceDue: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

**Component dùng chung** có sẵn (`frontend/src/components/common/`):
`Modal`, `ConfirmModal`, `Button`, `Skeleton`, `TableSkeleton`, `EmptyState`, `ErrorMessage`, `Loading`

**CSS classes có sẵn:** `glass-panel`, `form-input`, `form-select`, `form-textarea`, `form-group`, `form-label`, `form-error-msg`, `input-error`, `btn` (+`btn-primary|secondary|danger|sm|icon`), `badge` (+`badge-success|info|warning|danger|neutral`), `data-table`, `data-table-container`, `mono`

**Context:** `useToast()` → `{showToast(type, message)}` với type `'success' | 'error' | 'warning'`; `useAuth()` → `{user}` với `user.role: 'ADMIN'|'MANAGER'|'DRIVER'`

### 1.5 Quy tắc phân quyền đang áp dụng trong UI

```ts
const isDriver = user?.role === 'DRIVER';
```
| Hành động | Điều kiện hiển thị |
|---|---|
| Nút "+ Thêm xe mới" | `!isDriver` |
| Nút "Bàn giao xe" | `status === 'AVAILABLE' && !isDriver` |
| Nút "Trả xe / Bàn giao" | `status === 'IN_USE'` (ai cũng được) |
| Nút "Bảo dưỡng xong" | `status === 'MAINTENANCE' && !isDriver` |
| Nút "Sửa xe" | `!isDriver` |
| Nút "Ngừng khai thác" | `!isDriver && status !== 'DECOMMISSIONED'` |

---

## 2. ĐÃ HOÀN THÀNH (nhóm P0 — không làm lại)

| # | Việc | Commit |
|---|---|---|
| P0-1 | Xóa file rác `frontend/src/modules/vehicle/types/index.ts` | `c39cb37` |
| P0-2 | Thêm `spring-boot-starter-validation` + jakarta annotations vào 5 DTO + `@Valid` | `c39cb37`, `0458d8c` |
| P0-3 | `GlobalExceptionHandler`: thêm 4 handler (validation, malformed body, type mismatch, data integrity) | `0458d8c` |
| P0-4 | `VehicleSpecifications.filterBy()` + `JpaSpecificationExecutor` thay filter in-memory | `0458d8c` |
| P0-5 | Bổ sung rule: năm SX ≤ năm hiện tại, lastMaint ≤ currentOdo, chỉ assign xe AVAILABLE | `0458d8c` |

Verify: Docker BUILD SUCCESS + 28 API test pass + `tsc --noEmit` exit 0.

---

## 3. DANH SÁCH 4 MỤC CẦN LÀM

| # | Tên | Loại | Phụ thuộc | Ước lượng |
|---|---|---|---|---|
| **#5** | Bộ lọc hãng xe (UI) | Feature nhỏ | không | 1 giờ |
| **#6** | Tách components | Refactor | nên làm SAU #5 | 2-3 giờ |
| **#7** | Unit test backend | Test | không | 2-3 giờ |
| **#8** | Nhật ký hành trình | Feature lớn | không | 3-4 giờ |

**Thứ tự đề xuất:** #5 → #7 → #8 → #6 (làm #6 cuối vì sau #5 và #8 UI sẽ thay đổi nhiều, tách component sẽ dễ hơn vì không phải làm 2 lần)

---

## 4. MỤC #5 — BỘ LỌC HÃNG XE TRÊN UI

### 4.1 Vấn đề hiện tại

Backend **đã hỗ trợ** param `brand` (`VehicleSpecifications.filterBy()` dòng 24-26), nhưng frontend **hardcode `undefined`**:

```typescript
// frontend/src/modules/vehicle/pages/VehiclePage.tsx:90-94  — SAI, cần sửa
const data = await vehicleService.getVehicles(
  statusFilter === 'ALL' ? undefined : statusFilter,
  undefined,      // <-- brand luôn undefined
  search
);
```

PRD `FR-03` Acceptance Signal #3 yêu cầu rõ: *"Có thanh tìm kiếm theo Biển số và bộ lọc Dropdown theo **Hãng xe**/Trạng thái"*.

### 4.2 Mục tiêu

Thêm dropdown "Hãng xe" vào thanh filter, hoạt động độc lập và kết hợp với `search` + `statusFilter`.

### 4.3 Thiết kế

**4.3.1 Backend — KHÔNG cần sửa gì.** Param `brand` đã hoạt động, đã verify test #7 (case-insensitive `?brand=ford` trả về 2 xe Ford).

**4.3.2 Lấy danh sách hãng — không hardcode**

Hãng xe là dữ liệu động (thêm xe mới có thể là hãng mới). Lấy từ DB:

**Bước 1** — thêm method vào `VehicleRepository.java`:
```java
@Query("SELECT DISTINCT v.brand FROM Vehicle v WHERE v.brand IS NOT NULL AND v.brand <> '' ORDER BY v.brand ASC")
List<String> findDistinctBrands();
```

**Bước 2** — thêm vào `VehicleDTO.java` (giữ nguyên `fromEntity()`, chỉ thêm field + setter tự động do Lombok):
```java
private List<String> brands;
```
Import thêm `java.util.List`.

**Bước 3** — `VehicleController.java`, thêm endpoint mới **BÊN DƯỚI** method `getAllVehicles()`:
```java
@GetMapping("/brands")
public ResponseEntity<ApiResponse<List<String>>> getBrands() {
    return ResponseEntity.ok(ApiResponse.success(vehicleService.getBrands()));
}
```
> Endpoint này khai báo SAU `/{id}` trong file nhưng Spring match theo độ chính xác (`/brands` không phải số nên không đụng `/{id}`). Nếu lo lắng, đặt nó TRƯỚC `/{id}` cho chắc.

**Bước 4** — `VehicleService.java`, thêm method:
```java
public List<String> getBrands() {
    return vehicleRepository.findDistinctBrands();
}
```

**4.3.3 Frontend**

`frontend/src/modules/vehicle/services/vehicleService.ts` — thêm:
```typescript
getBrands: async (): Promise<string[]> => {
  const res = await apiClient.get<ApiResponse<string[]>>('/api/vehicles/brands');
  return res.data.data || [];
},
```

`VehiclePage.tsx` — 5 thay đổi:

| Vị trí | Thay đổi |
|---|---|
| State | thêm `const [brands, setBrands] = useState<string[]>([]);` cạnh `statusFilter` |
| State | thêm `const [brandFilter, setBrandFilter] = useState<string>('ALL');` |
| Effect | thêm effect load brands 1 lần (dependency `[]`, KHÔNG vào debounce effect) |
| `fetchVehicles()` | truyền `brandFilter === 'ALL' ? undefined : brandFilter` vào tham số thứ 2 |
| Debounce dep | thêm `brandFilter` vào mảng dependency của `useEffect` debounce (dòng 108) |
| JSX | chèn `<select>` Hãng xe NGAY TRƯỚC `<select>` Trạng thái (dòng ~435-451) |
| Empty state | sửa điều kiện `search \|\| statusFilter !== 'ALL'` → thêm `\|\| brandFilter !== 'ALL'` |
| Reset filter | trong `onAction` của EmptyState, thêm `setBrandFilter('ALL')` |

JSX dropdown (copy style `form-select` sẵn có):
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
    Hãng xe:
  </span>
  <select
    value={brandFilter}
    onChange={(e) => setBrandFilter(e.target.value)}
    className="form-select"
    style={{ width: 'auto', minWidth: '150px' }}
  >
    <option value="ALL">Tất cả hãng</option>
    {brands.map((b) => (
      <option key={b} value={b}>{b}</option>
    ))}
  </select>
</div>
```

### 4.4 Tiêu chí nghiệm thu

- [x] `GET /api/vehicles/brands` trả `{"success":true,"data":["Ford","Hyundai","Toyota","VinFast"]}`
- [x] `GET /api/vehicles?brand=Toyota` chỉ trả xe Toyota
- [x] `GET /api/vehicles?brand=toyota` (lowercase) cho kết quả **giống hệt** (case-insensitive)
- [x] `GET /api/vehicles?status=AVAILABLE&brand=Toyota&search=29` lọc đồng thời 3 điều kiện
- [x] Dropdown Hãng xe xuất hiện cạnh dropdown Trạng thái
- [x] Đổi hãng xe → bảng cập nhật trong ≤300ms (debounce)
- [x] Xóa bộ lọc (EmptyState) reset cả `brandFilter`
- [x] `docker build` BUILD SUCCESS
- [x] `npx tsc --noEmit` exit 0
- [x] Regression P0 vẫn đúng: assign → IN_USE, return → AVAILABLE, 4 case validation trả 400
- [ ] So sánh screenshot UI trước/sau (cần chạy `docker compose up --build` + trình duyệt)

### 4.5 Commit

```
feat(vehicle): add brand filter dropdown to fleet management UI
```
File dự kiến: `VehicleRepository.java`, `VehicleDTO.java`, `VehicleController.java`, `VehicleService.java`, `vehicleService.ts`, `VehiclePage.tsx`

---

## 5. MỤC #7 — UNIT TEST BACKEND

### 5.1 Vấn đề

`pom.xml` đã có `spring-boot-starter-test` nhưng **không có thư mục `src/test`**. Toàn bộ service chưa có test nào — đây là điểm bị trừ khi chấm đồ án.

### 5.2 Mục tiêu

Test cho `VehicleService` — lớp chứa toàn bộ nghiệp vụ. Dùng Mockito thuần (không cần DB thật, không cần Testcontainers) để test chạy nhanh và không phụ thuộc môi trường.

### 5.3 Thư mục cần tạo

```
vehicle-service/backend/src/test/
├── resources/
│   └── application-test.yml            # H2 in-memory, ddl-auto create-drop, email url -> localhost:1
└── java/com/vms/vehicle/
    ├── service/
    │   ├── VehicleServiceTest.java      # 41 test — Mockito thuần, không cần DB
    │   └── EmailClientTest.java         #  5 test — fault isolation
    ├── dto/
    │   └── VehicleDTOTest.java          #  5 test
    ├── controller/
    │   └── VehicleControllerValidationTest.java   # 27 test — @WebMvcTest
    └── integration/
        └── VehicleApiIntegrationTest.java          # 17 test — @SpringBootTest + H2
```

### 5.4 Dependency cần thêm vào pom.xml

Đã thêm **chỉ 1 dependency** (`mockito-junit-jupiter` KHÔNG cần vì `spring-boot-starter-test` đã kéo sẵn):
```xml
<!-- H2 database cho integration test -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

### 5.5 Nội dung từng test class (thực tế đã implement)

**5.5.1 `VehicleServiceTest.java`** — unit test thuần Mockito

```java
@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private EmailClient emailClient;
    @InjectMocks private VehicleService vehicleService;

    // Helper tạo entity hợp lệ
    private Vehicle buildVehicle() {
        return Vehicle.builder()
            .id(1L).licensePlate("29A-888.88").brand("Toyota").model("Camry")
            .vehicleType(VehicleType.SEDAN).seatCapacity(5).manufactureYear(2023)
            .currentOdometer(15000).lastMaintenanceOdometer(15000)
            .status(VehicleStatus.AVAILABLE)
            .build();
    }
```

Danh sách test case **bắt buộc có** (map theo rule ở mục 1.3):

| # | Tên test | Setup | Expect |
|---|---|---|---|
| 1 | `createVehicle_normalizesPlate` | plate input `" 29a88888 "` | `saved.getLicensePlate() == "29A-888.88"` |
| 2 | `createVehicle_throwsWhenDuplicatePlate` | `existsByLicensePlate` → true | `BadRequestException`, msg chứa "đã được đăng ký" |
| 3 | `createVehicle_throwsWhenYearInFuture` | year = currentYear+1 | `BadRequestException`, msg chứa "vượt quá năm" |
| 4 | `createVehicle_defaultsStatusAvailable` | input hợp lệ | `saved.getStatus() == AVAILABLE` |
| 5 | `createVehicle_setsBothOdometersToInitial` | initialOdometer = 5000 | current == lastMaintenance == 5000 |
| 6 | `getVehicleById_throwsWhenNotFound` | `findById` → empty | `ResourceNotFoundException` |
| 7 | `getVehicleById_returnsDto` | `findById` → vehicle | dto.id == 1 |
| 8 | `updateVehicle_throwsWhenLastMaintExceedsCurrent` | lastMaint > current | `BadRequestException` |
| 9 | `updateVehicle_ignoresNullFields` | request chỉ có brand | các field khác giữ nguyên giá trị cũ |
| 10 | `assignDriver_setsInUseAndDriver` | status AVAILABLE | `status == IN_USE`, `assignedDriverName` đúng |
| 11 | `assignDriver_throwsWhenNotAvailable` | status = MAINTENANCE | `BadRequestException`, msg chứa "SẴN SÀNG" |
| 12 | `assignDriver_triggersEmailClient` | có driverEmail | verify `emailClient.sendAssignmentNotification(...)` được gọi |
| 13 | ~~`assignDriver_emailFailureDoesNotThrow`~~ | — | **ĐÃ BỎ — test sai chỗ, xem `EmailClientTest`** |
| 14 | `returnVehicle_throwsWhenKmDecreases` | newOdo < currentOdo | `BadRequestException` |
| 15 | `returnVehicle_clearsDriver` | xe IN_USE có driver | `assignedDriverId` và `assignedDriverName` == null |
| 16 | `returnVehicle_setsAvailableWhenUnderThreshold` | delta km = 4000 | `status == AVAILABLE` |
| 17 | `returnVehicle_setsMaintenanceWhenOverThreshold` | delta km = 6000 | `status == MAINTENANCE` |
| 18 | `returnVehicle_triggersMaintenanceEmail` | delta km = 6000 | verify `emailClient.sendMaintenanceAlert(...)` |
| 19 | `returnVehicle_allowsEqualKm` | newOdo == currentOdo | không throw |
| 20 | `softDeleteVehicle_setsDecommissioned` | bất kỳ status | `status == DECOMMISSIONED` |
| 21 | `softDeleteVehicle_keepsHistory` | — | `currentOdometer` KHÔNG bị đổi |
| 22 | `updateStatus_resetsLastMaintenanceWhenFinishing` | MAINTENANCE → AVAILABLE | `lastMaintenanceOdometer == currentOdometer` |
| 23 | `updateStatus_doesNotResetLastMaintenance` | IN_USE → AVAILABLE | `lastMaintenanceOdometer` giữ nguyên |
| 24 | `getAllVehicles_usesSpecificationFilter` | — | verify `findAll(any(Specification.class))` được gọi |
| 25 | `getAllVehicles_sortsByIdDesc` | 3 xe id 1,2,3 | kết quả [3,2,1] |
| 26 | `getAllVehicles_mapsMaintenanceDue` | delta km >= 5000 | `dto.maintenanceDue == true` |

**Quy tắc mock bắt buộc** (sai chỗ này test sẽ fail giả):
```java
// Khi service gọi save(), phải trả về chính object đó.
// PHẢI dùng lenient() vì nhiều test không gọi save() -> UnnecessaryStubbingException
lenient().when(vehicleRepository.save(any(Vehicle.class)))
    .thenAnswer(invocation -> invocation.getArgument(0));
```

⚠️ `assignDriver_emailFailureDoesNotThrow` trong bản kế hoạch là **SAI** — đã bỏ.
`VehicleService` không try/catch; fault isolation nằm bên trong `EmailClient`.
Test đúng chỗ là `EmailClientTest.swallowsTransportFailure` (mock `RestTemplate` ném `ResourceAccessException`).

**5.5.2 `VehicleDTOTest.java`**
| # | Test | Expect |
|---|---|---|
| 1 | `fromEntity_mapsAllFields` | 15 field khớp entity |
| 2 | `fromEntity_nullSafe` | `fromEntity(null)` → `null` |
| 3 | `fromEntity_maintenanceDueTrue` | delta = 5000 → true |
| 4 | `fromEntity_maintenanceDueFalse` | delta = 4999 → false |
| 5 | `fromEntity_handlesNullDriver` | `assignedDriverId == null` |

**5.5.3 ~~`VehicleSpecificationsTest.java`~~ — ĐÃ BỎ (quyết định có chủ ý)**

Logic SQL của `VehicleSpecifications` **không test riêng**, vì:
- Nó là một `Specification` lambda phụ thuộc `CriteriaBuilder` → mock rất rối, giá trị thấp.
- Đã được cover **đầy đủ và thật** bởi `VehicleApiIntegrationTest$Filtering` (6 test: status, brand case-insensitive, search 4 field, filter kết hợp, distinct brands, sort). Test thật đáng tin hơn test mock.
- `VehicleServiceTest$GetAllVehicles` verify service có delegate đúng sang `findAll(Specification)`.

→ Không tạo file này.

**5.5.4 `VehicleControllerValidationTest.java`** — `@WebMvcTest`

Kiểm tra validation trả **400** (không phải 500):
```java
@WebMvcTest(VehicleController.class)
class VehicleControllerValidationTest {
    @Autowired MockMvc mockMvc;
    @MockBean VehicleService vehicleService;

    @Test void createVehicle_missingPlate_returns400() throws Exception {
        mockMvc.perform(post("/api/vehicles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"brand":"Toyota","model":"Vios","vehicleType":"SEDAN",
                     "seatCapacity":5,"manufactureYear":2023}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test void createVehicle_blankPlate_returns400()
    @Test void createVehicle_nullVehicleType_returns400()
    @Test void createVehicle_negativeSeats_returns400()
    @Test void createVehicle_yearBefore1990_returns400()
    @Test void createVehicle_negativeInitialOdo_returns400()
    @Test void assignDriver_blankDriverName_returns400()
    @Test void assignDriver_invalidEmail_returns400()
    @Test void returnVehicle_nullOdometer_returns400()
    @Test void updateStatus_missingStatus_returns400()
    @Test void getVehicleById_invalidId_returns400()
}
```

**5.5.5 `VehicleApiIntegrationTest.java`** — end-to-end với H2

Cần file `src/test/resources/application-test.yml`:
```yaml
server:
  port: 0
spring:
  datasource:
    url: jdbc:h2:mem:vehicle_test;DB_CLOSE_DELAY=-1;MODE=MySQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    database-platform: org.hibernate.dialect.H2Dialect
  main:
    banner-mode: off
services:
  email-service-url: http://localhost:9999
```

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VehicleApiIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired VehicleRepository vehicleRepository;

    @BeforeEach void cleanUp() {
        vehicleRepository.deleteAll();
        // Tắt DataInitializer trong test để dữ liệu do test kiểm soát
    }
```

Test case bắt buộc:
| # | Test | Expect |
|---|---|---|
| 1 | `fullCrudLifecycle` | POST → GET → PUT → DELETE, status đổi đúng từng bước |
| 2 | `duplicatePlateReturns400` | POST 2 lần cùng biển số → lần 2 = 400 |
| 3 | `filterByStatus` | tạo 3 xe 3 status → lọc đúng số lượng |
| 4 | `filterByBrand_caseInsensitive` | `?brand=toyota` == `?brand=Toyota` |
| 5 | `searchAcrossFields` | search tìm được theo plate, brand, model, driverName |
| 6 | `uniqueConstraintAtDatabaseLevel` | verify `license_plate` có UNIQUE trong schema |
| 7 | `assignThenReturnTrip` | assign → IN_USE; return → AVAILABLE, km tăng đúng |
| 8 | `maintenanceThresholdAutoTriggers` | trả xe vượt 5000km → MAINTENANCE |

> **Quan trọng:** `EmailClient` gọi HTTP tới `localhost:9999` (không tồn tại) → try/catch nuốt lỗi. Test vẫn PASS nhờ fault isolation. Đây là hành vi **có chủ ý**, không phải bug.

### 5.6 Chạy test

Vì máy không có Maven, chạy trong Docker:
```powershell
# Chạy test trong container builder
docker run --rm -v "${PWD}/vehicle-service/backend:/app" -w /app `
  maven:3.9.8-eclipse-temurin-21-alpine mvn test

# Hoặc dùng compose (đổi Dockerfile tạm thời KHÔNG khuyến nghị)
```

Kết quả mong đợi: `Tests run: 45+, Failures: 0, Errors: 0`

### 5.7 Tiêu chí nghiệm thu

- [x] Có thư mục `src/test/java/com/vms/vehicle/`
- [x] `VehicleServiceTest` — 41 test, pass 100% (khớp 8 nhóm nghiệp vụ: create/read/update/assign/return/softDelete/updateStatus/filter/brands)
- [x] `VehicleDTOTest` — 5 test
- [x] `VehicleControllerValidationTest` — 27 test, mọi case invalid trả 400
- [x] `EmailClientTest` — 5 test, chứng minh fault isolation nuốt lỗi email
- [x] `VehicleApiIntegrationTest` — 17 test end-to-end với H2
- [x] **TỔNG: 95 test, 0 failure, BUILD SUCCESS**
- [x] Không test nào phụ thuộc mạng ngoài (`emailClient` được `@MockBean`; test profile trỏ `email-service-url` về `localhost:1`)
- [x] Test chạy được không cần MySQL (`application-test.yml` dùng H2 in-memory, `ddl-auto: create-drop`)
- [x] `docker build` vẫn BUILD SUCCESS

**Lệnh chạy test (máy không có Maven):**
```powershell
docker run --rm -v "${PWD}/vehicle-service/backend:/app" -w /app maven:3.9.9-eclipse-temurin-21 mvn -B test
```

**Ghi chú khi viết test (tiết kiệm thời gian cho phiên sau):**
- `VehicleServiceTest.setUp()` stub `save()` dùng `lenient()`, nếu không các test không gọi `save` sẽ fail với `UnnecessaryStubbing`.
- `@Nested` class + `@BeforeEach` của class cha: stub của class cha áp dụng cho mọi nested class.
- `getAllVehicles` sắp xếp `id` **giảm dần** → khi assert thứ tự phải tính ngược lại.
- Fault isolation nằm trong `EmailClient`, **không** phải trong `VehicleService` → test phải mock `RestTemplate` chứ không `doThrow` trên `emailClient`.

### 5.8 Commit

```
test(vehicle): add unit and integration tests for vehicle service
```

---

## 6. MỤC #8 — NHẬT KÝ HÀNH TRÌNH (Trip Log)

### 6.1 Vấn đề

`doc/FEATURE_SPECIFICATION.md` FR-04, mục "Persistence & Access behavior" yêu cầu:
> *"Mỗi lần bàn giao và nhận xe đều được ghi lại vào nhật ký hành trình của xe để đối soát sau này."*

Hiện tại `assignDriver()` và `returnVehicle()` chỉ cập nhật trạng thái trên `vehicles` — **không lưu lịch sử**. Mất dữ liệu vận hành.

### 6.2 Mục tiêu

Mỗi lần bàn giao / trả xe tạo 1 bản ghi lịch sử, có thể tra cứu và hiển thị trên UI.

### 6.3 Quyết định thiết kế (đã chốt)

| Quyết định | Lý do |
|---|---|
| Bảng mới `vehicle_trips` trong `vehicle_db` | Cùng service, cùng DB — không vi phạm nguyên tắc "mỗi service 1 DB" |
| `assigned_driver_id` là khóa ngoại **mềm** (Long, không FK constraint) | Không được JOIN xuyên `user_db` |
| Không thêm endpoint list vào Gateway | Gateway đã route `/api/vehicles/**` → tự động có |
| `notes` của `ReturnVehicleRequest` **được dùng** | Hiện frontend gửi nhưng backend bỏ qua — đây là lỗi, sẽ sửa luôn |

### 6.4 Backend — Bước 1: Entity

File mới: `vehicle-service/backend/src/main/java/com/vms/vehicle/entity/TripStatus.java`
```java
package com.vms.vehicle.entity;

public enum TripStatus {
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
```

File mới: `vehicle-service/backend/src/main/java/com/vms/vehicle/entity/VehicleTrip.java`
```java
package com.vms.vehicle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_trips", indexes = {
    @Index(name = "idx_trip_vehicle", columnList = "vehicle_id"),
    @Index(name = "idx_trip_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "vehicle_plate", nullable = false, length = 20)
    private String vehiclePlate;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "start_odometer", nullable = false)
    private Integer startOdometer;

    @Column(name = "end_odometer")
    private Integer endOdometer;

    @Column(name = "distance_km")
    private Integer distanceKm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

> `ddl-auto: update` sẽ tự tạo bảng khi service restart. **Không cần** sửa `mysql/init/01-init-databases.sql`.

### 6.5 Backend — Bước 2: DTO

File mới: `dto/VehicleTripDTO.java`
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleTripDTO {
    private Long id;
    private Long vehicleId;
    private String vehiclePlate;
    private Long driverId;
    private String driverName;
    private Integer startOdometer;
    private Integer endOdometer;
    private Integer distanceKm;
    private TripStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String notes;
    private Integer durationMinutes;   // endedAt - startedAt, tính lúc map

    public static VehicleTripDTO fromEntity(VehicleTrip trip) {
        if (trip == null) return null;
        Integer duration = null;
        if (trip.getEndedAt() != null) {
            duration = (int) Duration.between(trip.getStartedAt(), trip.getEndedAt()).toMinutes();
        }
        return VehicleTripDTO.builder()
                .id(trip.getId())
                .vehicleId(trip.getVehicleId())
                .vehiclePlate(trip.getVehiclePlate())
                .driverId(trip.getDriverId())
                .driverName(trip.getDriverName())
                .startOdometer(trip.getStartOdometer())
                .endOdometer(trip.getEndOdometer())
                .distanceKm(trip.getDistanceKm())
                .status(trip.getStatus())
                .startedAt(trip.getStartedAt())
                .endedAt(trip.getEndedAt())
                .notes(trip.getNotes())
                .durationMinutes(duration)
                .build();
    }
}
```
Imports: `java.time.Duration`, `java.time.LocalDateTime`.

### 6.6 Backend — Bước 3: Repository

File mới: `repository/VehicleTripRepository.java`
```java
package com.vms.vehicle.repository;

import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.VehicleTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleTripRepository extends JpaRepository<VehicleTrip, Long> {

    List<VehicleTrip> findAllByVehicleIdOrderByStartedAtDesc(Long vehicleId);

    Optional<VehicleTrip> findFirstByVehicleIdAndStatusOrderByStartedAtDesc(Long vehicleId, TripStatus status);
}
```

### 6.7 Backend — Bước 4: Service

`VehicleService.java` — inject thêm repository:
```java
private final VehicleTripRepository vehicleTripRepository;
```
(`@RequiredArgsConstructor` sẽ tự tự sinh constructor — chỉ cần khai báo field.)

**6.7.1** Sửa `assignDriver()` — thêm đoạn tạo trip **SAU** khi save vehicle, **TRƯỚC** khi gửi email:
```java
vehicleTripRepository.save(VehicleTrip.builder()
        .vehicleId(vehicle.getId())
        .vehiclePlate(vehicle.getLicensePlate())
        .driverId(request.getDriverId())
        .driverName(request.getDriverName().trim())
        .startOdometer(vehicle.getCurrentOdometer())
        .status(TripStatus.IN_PROGRESS)
        .startedAt(LocalDateTime.now())
        .build());
```

**6.7.2** Sửa `returnVehicle()` — đóng trip đang mở **SAU** khi cập nhật odometer:
```java
int newOdometer = request.getNewOdometer();
int startKm = vehicle.getCurrentOdometer();
vehicle.setCurrentOdometer(newOdometer);
vehicle.setAssignedDriverId(null);
vehicle.setAssignedDriverName(null);

vehicleTripRepository.findFirstByVehicleIdAndStatusOrderByStartedAtDesc(
                vehicle.getId(), TripStatus.IN_PROGRESS)
        .ifPresent(trip -> {
            trip.setEndOdometer(newOdometer);
            trip.setDistanceKm(newOdometer - trip.getStartOdometer());
            trip.setEndedAt(LocalDateTime.now());
            trip.setStatus(TripStatus.COMPLETED);
            if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
                trip.setNotes(request.getNotes().trim());
            }
            vehicleTripRepository.save(trip);
        });
```
> Phần logic `kmSinceLastMaintenance` hiện có **giữ nguyên**, đặt sau đoạn trên.

**6.7.3** Sửa `softDeleteVehicle()` — huỷ trip đang mở (xe bị thu hồi giữa chừng):
```java
vehicleTripRepository.findFirstByVehicleIdAndStatusOrderByStartedAtDesc(
                vehicle.getId(), TripStatus.IN_PROGRESS)
        .ifPresent(trip -> {
            trip.setStatus(TripStatus.CANCELLED);
            trip.setEndedAt(LocalDateTime.now());
            trip.setEndOdometer(vehicle.getCurrentOdometer());
            trip.setNotes("Xe bị ngừng khai thác trong khi đang chạy chuyến.");
            vehicleTripRepository.save(trip);
        });
vehicle.setStatus(VehicleStatus.DECOMMISSIONED);
```

**6.7.4** Thêm 2 method đọc lịch sử:
```java
public List<VehicleTripDTO> getTripsByVehicle(Long vehicleId) {
    if (!vehicleRepository.existsById(vehicleId)) {
        throw new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + vehicleId);
    }
    return vehicleTripRepository.findAllByVehicleIdOrderByStartedAtDesc(vehicleId).stream()
            .map(VehicleTripDTO::fromEntity)
            .collect(Collectors.toList());
}

public VehicleTripDTO getCurrentTrip(Long vehicleId) {
    return vehicleTripRepository
            .findFirstByVehicleIdAndStatusOrderByStartedAtDesc(vehicleId, TripStatus.IN_PROGRESS)
            .map(VehicleTripDTO::fromEntity)
            .orElse(null);
}
```
Imports cần thêm vào `VehicleService.java`:
```java
import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.VehicleTrip;
import com.vms.vehicle.repository.VehicleTripRepository;
import java.time.LocalDateTime;
```
(`VehicleTripDTO` đã nằm trong `com.vms.vehicle.dto` — service đang import `dto.*` nên không cần thêm.)

### 6.8 Backend — Bước 5: Controller

`VehicleController.java` — thêm 2 endpoint, đặt **TRƯỚC** `/{id}` để chắc chắn không bị shadow:
```java
@GetMapping("/{id}/trips")
public ResponseEntity<ApiResponse<List<VehicleTripDTO>>> getTripsByVehicle(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(vehicleService.getTripsByVehicle(id)));
}

@GetMapping("/{id}/trips/current")
public ResponseEntity<ApiResponse<VehicleTripDTO>> getCurrentTrip(@PathVariable Long id) {
    VehicleTripDTO trip = vehicleService.getCurrentTrip(id);
    if (trip == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Xe hiện không có chuyến đi nào đang chạy"));
    }
    return ResponseEntity.ok(ApiResponse.success(trip));
}
```

**API mới:**
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/vehicles/{id}/trips` | Lịch sử hành trình, mới nhất trước |
| GET | `/api/vehicles/{id}/trips/current` | Chuyến đang chạy (404 nếu không có) |

### 6.9 Backend — Bước 6: Report Service (liên quan, CẦN THẬN TRỌNG)

`report-service` **đọc** dữ liệu từ `vehicle_db`? Phải kiểm tra trước. Nếu report-service có entity `Vehicle` dùng chung bảng `vehicles`, thêm bảng `vehicle_trips` **không** ảnh hưởng (bảng mới, không đụng bảng cũ). Không cần sửa report-service.

### 6.10 Frontend

**`frontend/src/types/index.ts`** — THÊM (không sửa type cũ):
```ts
export type TripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface VehicleTrip {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverId?: number;
  driverName?: string;
  startOdometer: number;
  endOdometer?: number;
  distanceKm?: number;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  durationMinutes?: number;
}
```

**`vehicleService.ts`** — thêm:
```typescript
getTrips: async (vehicleId: number): Promise<VehicleTrip[]> => {
  const res = await apiClient.get<ApiResponse<VehicleTrip[]>>(`/api/vehicles/${vehicleId}/trips`);
  return res.data.data || [];
},

getCurrentTrip: async (vehicleId: number): Promise<VehicleTrip> => {
  const res = await apiClient.get<ApiResponse<VehicleTrip>>(`/api/vehicles/${vehicleId}/trips/current`);
  return res.data.data;
},
```
Thêm `VehicleTrip` vào import từ `'../../../types'`.

**Component mới:** `frontend/src/modules/vehicle/components/VehicleTripHistoryModal.tsx`

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}
```
Nội dung:
- Dùng `<Modal title={\`Nhật ký hành trình: ${vehicle.licensePlate}\`} maxWidth="760px">`
- `useEffect` load `vehicleService.getTrips(vehicle.id)` khi mở
- Loading → `<Skeleton>`; rỗng → `<EmptyState icon={<Gauge/>} title="Chưa có chuyến đi nào" .../>`; lỗi → banner + nút Thử lại
- Bảng: **Bắt đầu** | **Kết thúc** | **Quãng đường** | **Thời lượng** | **Tài xế** | **Trạng thái** | **Ghi chú**
- Badge màu: `IN_PROGRESS` → `badge-info` (ĐANG CHẠY), `COMPLETED` → `badge-success` (HOÀN TẤT), `CANCELLED` → `badge-danger` (ĐÃ HỦY)
- Số km format `toLocaleString('vi-VN')`
- Thời lượng: `${durationMinutes} phút` hoặc `${Math.floor(m/60)}h ${m%60}p` nếu ≥60

**`VehiclePage.tsx`** — thêm nút xem lịch sử:
- State mới: `const [isTripHistoryOpen, setIsTripHistoryOpen] = useState(false);`
- Trong action buttons (cả Grid view dòng ~623 và Table view dòng ~723), thêm nút:
```tsx
<button
  onClick={() => { setSelectedVehicle(v); setIsTripHistoryOpen(true); }}
  className="btn btn-secondary btn-icon"
  style={{ width: '32px', height: '32px' }}
  title="Nhật ký hành trình"
>
  <History size={14} />
</button>
```
- Import `History` từ `lucide-react`
- Render modal ở cuối, cùng cấp các modal khác:
```tsx
{selectedVehicle && (
  <VehicleTripHistoryModal
    isOpen={isTripHistoryOpen}
    onClose={() => setIsTripHistoryOpen(false)}
    vehicle={selectedVehicle}
  />
)}
```

### 6.11 Tiêu chí nghiệm thu

**Backend:**
- [ ] `docker build` BUILD SUCCESS
- [ ] Bảng `vehicle_trips` được tạo tự động (kiểm tra: `docker exec ... mysql -u... -e "DESC vehicle_db.vehicle_trips"`)
- [ ] `POST /{id}/assign` → tạo trip `IN_PROGRESS`, `startOdometer` = odometer hiện tại
- [ ] `POST /{id}/return` → trip chuyển `COMPLETED`, `distanceKm = endOdo - startOdo`, `durationMinutes > 0`
- [ ] `notes` từ ReturnVehicleRequest được lưu vào trip
- [ ] `DELETE /{id}` khi đang có trip `IN_PROGRESS` → trip thành `CANCELLED`
- [ ] `GET /{id}/trips` trả danh sách **mới nhất trước**
- [ ] `GET /{id}/trips/current` trả trip đang chạy; 404 khi xe không chạy
- [ ] `GET /{id}/trips` với id không tồn tại → 404
- [ ] Thêm trip KHÔNG làm hỏng luồng assign/return cũ (chạy lại 28 test P0)
- [ ] `mvn test` (nếu đã làm #7) vẫn pass

**Frontend:**
- [ ] `npx tsc --noEmit` exit 0
- [ ] Nút lịch sử hiện trên cả Grid và Table view
- [ ] Modal mở ra, load dữ liệu đúng
- [ ] Hiển thị đầy đủ: quãng đường, thời lượng, tài xế, trạng thái, ghi chú
- [ ] Xe chưa có chuyến nào → EmptyState đúng
- [ ] Lỗi mạng → banner + Thử lại
- [ ] Số km format `1.500 km` kiểu Việt Nam
- [ ] Không có lỗi console

### 6.12 Commit

```
feat(vehicle): add trip history tracking for vehicle dispatch lifecycle
```

---

## 7. MỤC #6 — TÁCH COMPONENTS

### 7.1 Vấn đề

`VehiclePage.tsx` dài **1174 dòng** — chứa state, 8 handler, 2 view render, 5 modal. `components/` chỉ có `.gitkeep`. Khó bảo trì, khó review, khó test.

### 7.2 Mục tiêu

Tách thành component có trách nhiệm rõ ràng. **`VehiclePage.tsx` mục tiêu < 250 dòng.**

### 7.3 Cấu trúc đích

```
frontend/src/modules/vehicle/
├── components/
│   ├── StatusBadge.tsx                    # badge trạng thái
│   ├── VehicleFilters.tsx                 # search + brand + status + view toggle
│   ├── VehicleCardGrid.tsx                # view dạng thẻ
│   ├── VehicleDataTable.tsx               # view dạng bảng
│   ├── VehicleRowActions.tsx              # nút hành động dùng chung 2 view
│   ├── VehicleFormModal.tsx               # modal thêm + sửa (1 component, 2 mode)
│   ├── AssignDriverModal.tsx              # modal bàn giao tài xế
│   ├── ReturnVehicleModal.tsx             # modal trả xe + validate km
│   ├── DeleteVehicleModal.tsx             # confirm soft-delete
│   └── VehicleTripHistoryModal.tsx        # (tạo ở mục #8)
├── pages/
│   └── VehiclePage.tsx                    # orchestrator, < 250 dòng
├── services/
│   └── vehicleService.ts
└── utils/
    └── vehicleFormat.ts                   # formatPlate, km, duration
```

### 7.4 Nguyên tắc tách

| Nguyên tắc | Giải thích |
|---|---|
| **Không đổi hành vi** | Refactor thuần — UI phải giống hệt trước, kể cả inline style |
| **Giữ inline style** | Không refactor sang CSS module / Tailwind — ngoài phạm vi |
| **Mỗi component nhận `isDriver`** | Quyền phụ thuộc role, truyền prop thay vì gọi `useAuth()` bên trong (dễ test) |
| **Modal tự quản lý form state** | `isOpen` false → reset state, tránh rò rỉ dữ liệu giữa 2 lần mở |
| **Props callback rõ ràng** | `onSuccess: () => void` để parent refetch, không tự fetch lại |
| **Business logic gọi API nằm ở parent** | Component chỉ render + gọi callback |

### 7.5 Chi tiết từng component

**7.5.1 `StatusBadge.tsx`** — chuyển `getStatusBadge()` (hiện ở `VehiclePage.tsx:327-338`)
```typescript
interface Props { status: VehicleStatus }
export const StatusBadge: React.FC<Props> = ({ status }) => { ... }
```
Bảng màu giữ nguyên: AVAILABLE→`badge-success`+CheckCircle2, IN_USE→`badge-info`+Clock, MAINTENANCE→`badge-warning`+Wrench, DECOMMISSIONED→`badge-danger`.

**7.5.2 `utils/vehicleFormat.ts`**
```typescript
export const formatPlate = (val: string): string => { ... }   // từ dòng 119-131
export const formatKm = (km: number): string => km.toLocaleString('vi-VN') + ' km';
export const formatDuration = (minutes: number): string => { ... }  // dùng cho #8
```

**7.5.3 `VehicleFilters.tsx`** — JSX dòng 402-472
```typescript
interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: VehicleStatus | 'ALL';
  onStatusChange: (v: VehicleStatus | 'ALL') => void;
  brandFilter: string;                       // từ #5
  onBrandChange: (v: string) => void;
  brands: string[];                         // từ #5
  viewMode: 'GRID' | 'TABLE';
  onViewModeChange: (v: 'GRID' | 'TABLE') => void;
}
```

**7.5.4 `VehicleCardGrid.tsx`** — JSX dòng 511-679
```typescript
interface Props {
  vehicles: Vehicle[];
  isDriver: boolean;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;         // từ #8
}
```

**7.5.5 `VehicleDataTable.tsx`** — JSX dòng 680-769, props giống `VehicleCardGrid`.

**7.5.6 `VehicleRowActions.tsx`** — gom logic nút dùng chung 2 view
```typescript
interface Props {
  vehicle: Vehicle;
  isDriver: boolean;
  compact?: boolean;      // true = Table view (nút chữ), false = Grid (nút icon)
  onAssign / onReturn / onFinishMaintenance / onEdit / onDelete / onViewTrips
}
```
Điều kiện hiển thị giữ nguyên bảng ở mục 1.5.

**7.5.7 `VehicleFormModal.tsx`** — gộp 2 modal add/edit (dòng 771-1000)
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CREATE' | 'EDIT';
  vehicle: Vehicle | null;    // null khi CREATE
  onSubmit: (data: CreateVehicleData | UpdateVehicleData) => Promise<void>;
}
```
Khác biệt CREATE vs EDIT:
| Field | CREATE | EDIT |
|---|---|---|
| Biển số | ✅ nhập được, tự format | ❌ disabled (đổi biển số phải qua API khác) |
| Km ban đầu | ✅ có | ❌ không (dùng `currentOdometer`) |
| Tiêu đề | "Thêm phương tiện mới vào đội xe" | "Chỉnh sửa xe: {plate}" |
| Nút | "Thêm phương tiện" | "Lưu thay đổi" |

**7.5.8 `AssignDriverModal.tsx`** — dòng 1002-1058. Props: `isOpen, onClose, vehicle, onAssign(driverId, driverName, driverEmail)`. Giữ nguyên empty-state "Hiện không có tài xế nào sẵn sàng".

**7.5.9 `ReturnVehicleModal.tsx`** — dòng 1060-1156. Props: `isOpen, onClose, vehicle, onReturn(newOdometer, notes)`. Mang theo validate km inline (dòng 172-193).

**7.5.10 `DeleteVehicleModal.tsx`** — dòng 1158-1169, bọc `ConfirmModal`.

### 7.6 `VehiclePage.tsx` sau khi tách (mục tiêu)

```typescript
// 1. imports gọn
// 2. state (giữ nguyên tên)
// 3. fetchVehicles()
// 4. debounce effect
// 5. 8 handler (open*/handle*/confirm*) — giữ nguyên logic
// 6. return JSX: banner + header + <VehicleFilters/> + render view + 5 modal
```

### 7.7 Tiêu chí nghiệm thu

- [ ] `VehiclePage.tsx` < 250 dòng
- [ ] `components/` có đủ 10 file theo mục 7.3
- [ ] `utils/vehicleFormat.ts` có `formatPlate`, `formatKm`
- [ ] `npx tsc --noEmit` exit 0
- [ ] `npm run build` thành công
- [ ] **So sánh UI trước/sau: KHÔNG đổi** (chụp screenshot 2 chế độ GRID/TABLE, mỗi modal)
- [ ] Tất cả luồng vẫn chạy: thêm, sửa, xóa, bàn giao, trả xe, bảo dưỡng, lọc, tìm kiếm, xem lịch sử
- [ ] Role DRIVER vẫn bị ẩn đúng các nút không được phép
- [ ] Không còn import thừa / biến không dùng

### 7.8 Commit

```
refactor(vehicle): extract vehicle page into reusable components
```

---

## 8. CHECKLIST CHUNG TRƯỚC KHI TẠO PULL REQUEST

- [ ] Cả 4 mục #5 #6 #7 #8 đã commit, mỗi mục 1 commit
- [ ] `docker build -t vms-vehicle-service:verify ./vehicle-service/backend` → BUILD SUCCESS
- [ ] `cd frontend && npx tsc --noEmit` → exit 0
- [ ] `docker run --rm -v ... mvn test` → 0 failure (nếu đã làm #7)
- [ ] Test tay qua Gateway: `docker compose up --build -d` rồi mở http://localhost:5173
- [ ] Không sửa file ngoài phạm vi mục 0.1
- [ ] `git log --oneline origin/dev..HEAD` xem lại đúng 4 commit
- [ ] `git diff --stat origin/dev..HEAD` không có file lạ
- [ ] Đã cập nhật mục 2 và checkbox trong file này
- [ ] Push: `git push origin feature/vehicle-service`
- [ ] Tạo PR: https://github.com/kiet293/vehicle-management-system/pull/new/feature/vehicle-service

---

## 9. NHẬT KÝ TIẾN ĐỘ (cập nhật sau mỗi mục)

| Ngày | Mục | Commit | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 2026-10-05 | P0 (4 bug) | `c39cb37`, `0458d8c` | ✅ xong | 28 API test pass, tsc exit 0 |
| 2026-10-05 | Kế hoạch chi tiết | (file này) | ✅ xong | doc/VEHICLE_PLAN.md |
| 2026-10-05 | #5 Brand filter | (xem git log) | ✅ xong | /brands trả 4 hãng; filter brand case-insensitive + kết hợp status/search; regression P0 pass; tsc exit 0 |
| | #7 Unit test | (xem git log) | ✅ xong | **95 test, 0 failure**: service 41, DTO 5, controller validation 27, email 5, integration 17 |
| | #8 Trip log | — | ⬜ chưa làm | |
| | #6 Tách components | — | ⬜ chưa làm | làm CUỐI |

---

## 10. PHỤ LỤC — THAM CHIẾU NHANH

### 10.1 Seed data hiện tại (`DataInitializer.java`)

| id | Biển số | Hãng | Model | Loại | Chỗ | Năm | km | lastMaint | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 29A-888.88 | Toyota | Camry 2.5Q | SEDAN | 5 | 2023 | 15000 | 15000 | AVAILABLE |
| 2 | 30H-123.45 | Ford | Ranger Wildtrak | PICKUP | 5 | 2022 | 38500 | 35000 | IN_USE (driver 3) |
| 3 | 51K-999.99 | Hyundai | SantaFe Calligraphy | SUV | 7 | 2023 | 24800 | 20000 | AVAILABLE |
| 4 | 29B-456.78 | Ford | Transit Luxury | VAN | 16 | 2021 | 62000 | 55000 | MAINTENANCE |
| 5 | 30E-777.77 | VinFast | VF8 Plus | SUV | 5 | 2024 | 8200 | 5000 | AVAILABLE |

→ Danh sách hãng sau #5 sẽ là: `["Ford", "Hyundai", "Toyota", "VinFast"]`

### 10.2 Lệnh test API hay dùng

```powershell
$b = "http://localhost:18082"
Invoke-RestMethod "$b/api/v1/vehicles?status=AVAILABLE" | ConvertTo-Json -Depth 4
Invoke-RestMethod "$b/api/v1/vehicles?brand=ford" | ConvertTo-Json -Depth 4
Invoke-RestMethod "$b/api/v1/vehicles?search=29A" | ConvertTo-Json -Depth 4
Invoke-RestMethod "$b/api/v1/vehicles/1/trips" | ConvertTo-Json -Depth 4
```

### 10.3 Cảnh báo thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `mvn: command not found` | Máy chưa cài Maven | Dùng `docker build` hoặc `docker run maven:...` |
| `ports are not available: 3306` | MySQL local đang chạy | Dùng MySQL ở port 3307 (mục 0.4) |
| `404` khi gọi `/api/vehicles/brands` | Gateway chưa restart sau khi thêm endpoint | `docker compose restart api-gateway` |
| `500` khi POST body thiếu field | Chưa có `@Valid` ở controller | Kiểm tra mục 4.3 / P0-2 |
| Bảng `vehicle_trips` không tồn tại | Hibernate chưa tạo | Restart service, kiểm tra `ddl-auto: update` |
| Test fail "table not found" | H2 chưa tạo schema | Kiểm tra `ddl-auto: create-drop` trong `application-test.yml` |

---

> **Cập nhật file này sau mỗi mục hoàn thành.** Đây là nguồn sự thật duy nhất cho phiên chat mới.