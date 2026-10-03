# Đặc tả Hành vi & Chức năng (Feature Specification)

> **Dự án:** Vehicle Management System (VMS) - Hệ Thống Quản Lý Đội Xe Doanh Nghiệp Phân Tán  
> **Tham chiếu:** [`doc/PRD.md`](file:///d:/code/dientoandammay/vehicle-management-system/doc/PRD.md)  
> **Phiên bản:** 1.0.0 | **Ngày ban hành:** 03/10/2026  
> **Tác giả:** Lead Technical Product Manager & Senior Product Designer (UI/UX)

Tài liệu này đặc tả chi tiết hành vi hệ thống (*System & User Behaviors*) cho các nhóm chức năng cốt lõi của hệ thống VMS. Tài liệu được biên soạn độc lập với các quyết định kỹ thuật sâu (như thiết kế bảng cơ sở dữ liệu, câu lệnh SQL, cấu trúc mã nguồn backend), nhằm đóng vai trò chuẩn mực tuyệt đối phục vụ trực tiếp cho quá trình thiết kế giao diện UI/UX và lập trình tương tác người dùng phía Frontend.

---

## Feature 1: Đăng nhập & Quản lý Phiên làm việc (FR-01)
> Cung cấp cơ chế xác thực danh tính an toàn, cấp phát phiên làm việc tập trung và phân luồng giao diện dựa trên vai trò của người dùng (*Role-Based Interface Routing*).

* **Success flow (Luồng thành công chính):**
  1. Người dùng truy cập đường dẫn gốc của ứng dụng (hoặc bị chuyển hướng về `/login` nếu chưa đăng nhập).
  2. Màn hình hiển thị Form đăng nhập gồm 2 trường nhập liệu: "Tên đăng nhập" (*Username*) và "Mật khẩu" (*Password*).
  3. Người dùng nhập tên đăng nhập và mật khẩu hợp lệ, sau đó bấm nút "Đăng nhập" (hoặc nhấn phím `Enter`).
  4. Nút "Đăng nhập" chuyển sang trạng thái Loading (hiển thị vòng xoay Spinner và làm mờ nút).
  5. Hệ thống xác thực thành công:
     * Lưu trữ Token phiên làm việc an toàn tại bộ nhớ trình duyệt (*localStorage/sessionStorage*).
     * Hiển thị thông báo Toast xanh lá góc trên bên phải: *"Đăng nhập thành công! Chào mừng [Tên người dùng] quay trở lại."* (tự đóng sau 2.5 giây).
     * Tự động điều hướng người dùng vào màn hình tương ứng:
       - Nếu là `ADMIN` hoặc `MANAGER`: Điều hướng tới trang Dashboard tổng quan (`/`).
       - Nếu là `DRIVER`: Điều hướng trực tiếp tới trang Xe của tôi (`/vehicles`).
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * *Tên đăng nhập:* Bắt buộc, không được để trống hoặc chỉ chứa khoảng trắng. Nếu trống -> Viền ô input đổi sang màu đỏ kèm dòng chữ cảnh báo màu đỏ bên dưới: *"Vui lòng nhập tên đăng nhập"*.
  * *Mật khẩu:* Bắt buộc, độ dài tối thiểu 6 ký tự. Nếu bỏ trống -> Viền ô input đổi màu đỏ kèm dòng chữ: *"Vui lòng nhập mật khẩu"*.
  * Trạng thái nút bấm: Nút "Đăng nhập" bị vô hiệu hóa (*Disabled*) nếu cả hai trường dữ liệu còn trống. Khi bắt đầu gõ ký tự đầu tiên, nút sẽ được kích hoạt trở lại.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Sai thông tin tài khoản:* Hệ thống hiển thị hộp thông báo lỗi màu đỏ ngay phía trên form: *"Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại."*
  * *Tài khoản bị khóa:* Hiển thị thông báo: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ."*
  * *Mất kết nối máy chủ / Mất mạng:* Hiển thị Toast cảnh báo màu cam: *"Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền Internet."*
  * *Nguyên tắc bảo toàn dữ liệu:* Khi đăng nhập thất bại, hệ thống **tuyệt đối giữ nguyên** Tên đăng nhập người dùng đã gõ, chỉ xóa trống ô Mật khẩu và tự động đưa con trỏ chuột (*Focus*) vào lại ô Mật khẩu để người dùng gõ lại mà không phải nhập lại từ đầu.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Phiên đăng nhập được duy trì liên tục trong 24 giờ.
  * Khi người dùng tải lại trang (*F5 / Refresh*), hệ thống tự động kiểm tra tính hợp lệ của Token; nếu hợp lệ, duy trì trạng thái đăng nhập mà không bắt người dùng đăng nhập lại.
  * Khi người dùng bấm nút "Đăng xuất" ở góc phải thanh Navbar: Hệ thống xóa sạch Token và thông tin người dùng khỏi bộ nhớ trình duyệt, đưa người dùng về trang `/login`.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Trong lúc chờ xác thực (ước tính 100 - 300ms): Nút "Đăng nhập" bị vô hiệu hóa, chữ "Đăng nhập" ẩn đi và thay thế bằng icon Spinner xoay tròn.
  * Toàn bộ 2 ô input bị làm mờ nhẹ (*opacity 70%*) để ngăn chặn người dùng bấm liên tục gây trùng lặp Request.
* **Empty state (Trạng thái rỗng):**
  * Không áp dụng cho màn hình đăng nhập.
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Hỗ trợ icon hình con mắt ở cuối ô Mật khẩu: Bấm vào để chuyển đổi giữa chế độ ẩn (`password`) và hiển thị chữ rõ (`text`).
  * Phím tắt: Nhấn `Enter` tại bất kỳ ô input nào cũng sẽ tự động kích hoạt gửi form đăng nhập.

---

## Feature 2: Quản lý Danh sách & Phân quyền Nhân sự (FR-02)
> Cung cấp cho Quản trị viên (`ADMIN`) công cụ tra cứu, thêm mới, phân quyền và khóa/mở khóa tài khoản nhân sự trong toàn công ty.

* **Success flow (Luồng thành công chính):**
  1. Quản trị viên bấm vào menu "Nhân sự" trên thanh Sidebar.
  2. Hệ thống tải và hiển thị Bảng danh sách nhân viên kèm các cột: Mã nhân viên, Họ và tên, Email, Số điện thoại, Vai trò (Badge màu), Hạng bằng lái (đối với tài xế), Trạng thái, và Cột Thao tác.
  3. Quản trị viên bấm nút "+ Thêm nhân sự mới" ở góc trên bên phải.
  4. Một Modal trượt ra từ giữa màn hình với form nhập thông tin nhân viên.
  5. Quản trị viên điền đầy đủ thông tin, chọn vai trò (`DRIVER`), nhập số bằng lái xe, sau đó bấm "Lưu thông tin".
  6. Modal tự động đóng lại, bảng danh sách tải lại dữ liệu mới nhất với bản ghi vừa tạo được đẩy lên hàng đầu tiên.
  7. Một thông báo Toast xanh lá hiển thị: *"Thêm nhân viên [Họ tên] thành công!"*.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * *Họ và tên:* Bắt buộc, từ 2 đến 100 ký tự. Báo lỗi: *"Họ tên không được để trống"*.
  * *Email:* Bắt buộc, đúng định dạng RFC 5322 (chứa `@` và tên miền hợp lệ). Nếu sai định dạng -> Báo lỗi: *"Địa chỉ email không hợp lệ (ví dụ: nguyenvana@gmail.com)"*.
  * *Số điện thoại:* Bắt buộc, định dạng số điện thoại Việt Nam (10 chữ số, bắt đầu bằng số `0`).
  * *Hạng bằng lái:* Nếu chọn vai trò `DRIVER`, trường "Hạng bằng lái" bắt buộc phải chọn (B1, B2, C, D, E, FC). Nếu chọn vai trò `MANAGER` hoặc `ADMIN`, trường này tự động ẩn đi hoặc vô hiệu hóa.
  * Cơ chế phản hồi lỗi: Báo lỗi trực tiếp ngay dưới chân từng ô input (*Inline Error Message*) ngay khi người dùng rời chuột khỏi ô (*OnBlur*).
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Email/Username bị trùng lặp:* Khi bấm lưu, nếu email đã tồn tại trên hệ thống, modal không đóng lại, ô Email sáng viền đỏ và hiển thị thông báo lỗi từ server: *"Email này đã được sử dụng bởi một nhân viên khác"*.
  * *Lỗi mạng trong khi lưu:* Hiển thị Toast đỏ: *"Lỗi kết nối. Không thể tạo nhân viên mới."* Form trong modal **giữ nguyên 100% các dữ liệu đã nhập** để người dùng bấm nút "Thử lại" mà không phải gõ lại từ đầu.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Dữ liệu chỉ được lưu vào hệ thống khi người dùng bấm nút "Lưu thông tin" và tất cả các trường dữ liệu đều hợp lệ.
  * Quản trị viên có thể xem lại hồ sơ bằng cách bấm vào dòng tương ứng trong bảng để mở Modal xem chi tiết/chỉnh sửa.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Khi vào trang: Bảng danh sách hiển thị 5 hàng Skeleton xám nhấp nháy (*Skeleton Loading*) mô phỏng hình dạng các hàng dữ liệu.
  * Khi bấm nút "Lưu thông tin": Nút chuyển sang trạng thái Loading (Spinner), nền mờ phủ lên form để ngăn thao tác đúp.
* **Empty state (Trạng thái rỗng / Bộ lọc không ra kết quả):**
  * *Trường hợp chưa có nhân viên nào:* Hiển thị hình minh họa trống kèm tiêu đề *"Chưa có nhân sự nào trong hệ thống"* và một nút CTA nổi bật: *"Thêm nhân viên đầu tiên"*.
  * *Trường hợp tìm kiếm không ra kết quả:* Hiển thị văn bản: *"Không tìm thấy nhân viên nào khớp với từ khóa '[từ khóa]'"* kèm nút *"Xóa bộ lọc"*.
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Khóa tài khoản (*Lock user*): Khi bấm nút Khóa trên cột thao tác, hệ thống bật Hộp thoại cảnh báo (*Confirmation Modal*): *"Bạn có chắc chắn muốn khóa tài khoản của [Tên]? Người này sẽ không thể đăng nhập vào hệ thống sau khi bị khóa."* với 2 nút: "Hủy bỏ" (nền xám) và "Xác nhận khóa" (nền đỏ nguy hiểm).
  * Phím tắt: Nhấn phím `Esc` để đóng Modal thêm/sửa nhân sự.

---

## Feature 3: Quản lý Danh mục & Hồ sơ Kỹ thuật Phương tiện (FR-03)
> Cung cấp cho Quản lý đội xe (`MANAGER` và `ADMIN`) bức tranh toàn cảnh về danh mục xe công ty, tình trạng kỹ thuật và khả năng lọc đa tiêu chí.

* **Success flow (Luồng thành công chính):**
  1. Quản lý bấm vào menu "Đội xe" trên Sidebar.
  2. Màn hình mở ra danh sách toàn bộ phương tiện dạng Thẻ lưới (*Card Grid*) hoặc Bảng dữ liệu (*Data Table*).
  3. Mỗi xe hiển thị đầy đủ: Ảnh đại diện xe, Biển số xe nổi bật, Hãng xe & Model, Loại xe, Số chỗ ngồi, Số km hiện tại, Tài xế phụ trách và Huy hiệu trạng thái (*Status Badge*).
  4. Quản lý bấm nút "+ Thêm xe mới".
  5. Modal mở ra, Quản lý nhập: Biển số xe (`29A-888.88`), Hãng xe (`Toyota`), Dòng xe (`Camry`), Loại xe (`Sedan`), Số chỗ (`5`), Năm sản xuất (`2023`), Số km ban đầu (`12000`).
  6. Bấm "Thêm phương tiện". Hệ thống xác thực hợp lệ, lưu vào cơ sở dữ liệu.
  7. Modal đóng lại, xe mới xuất hiện ngay đầu danh sách với huy hiệu xanh lá "SẴN SÀNG" (*AVAILABLE*). Toast thông báo thành công hiển thị.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * *Biển số xe:* Bắt buộc, viết hoa toàn bộ, tự động chuẩn hóa định dạng (ví dụ người dùng gõ `29a88888` hệ thống tự format thành `29A-888.88`). Nếu biển số đã tồn tại -> Viền đỏ và báo lỗi: *"Biển số xe này đã được đăng ký trong hệ thống"*.
  * *Năm sản xuất:* Bắt buộc, số nguyên dương có 4 chữ số, không được lớn hơn năm hiện tại và không nhỏ hơn năm 1990.
  * *Số chỗ ngồi & Tải trọng:* Bắt buộc, phải là số nguyên dương > 0.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Mất kết nối server:* Hiển thị banner thông báo lỗi màu vàng trên đỉnh danh sách: *"Không thể tải danh sách đội xe. Vui lòng bấm [Thử lại]"*. Nút "Thử lại" cho phép kích hoạt tải lại mà không cần F5 trình duyệt.
  * *Form nhập dở khi gặp sự cố:* Nếu bấm gửi mà bị lỗi mạng, form giữ nguyên toàn bộ dữ liệu xe đã nhập để người dùng gửi lại.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Dữ liệu được lưu trữ vĩnh viễn trên cơ sở dữ liệu.
  * Cơ chế Xóa mềm (*Soft Delete*): Khi bấm "Xóa xe", nếu xe đã có lịch sử chi phí hoặc chuyến đi, hệ thống không xóa hẳn bản ghi khỏi DB mà chuyển trạng thái xe sang `DECOMMISSIONED` (Ngừng khai thác) để đảm bảo toàn vẹn dữ liệu kế toán lịch sử.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Khi nạp danh sách: Hiển thị 6 thẻ Skeleton nhấp nháy mô phỏng vị trí các thẻ xe.
  * Khi chuyển trang phân trang (*Pagination*): Bảng dữ liệu mờ nhẹ trong 200ms và cập nhật nội dung trang mới mượt mà.
* **Empty state (Trạng thái rỗng):**
  * Khi danh mục xe chưa có xe nào: Hiển thị minh họa hình chiếc xe màu xám tối giản kèm thông điệp: *"Chưa có phương tiện nào trong hạm đội của công ty"* và nút CTA: *"Thêm phương tiện đầu tiên"*.
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Bộ lọc tức thì (*Instant Filtering*): Thanh tìm kiếm biển số cho phép tìm kiếm theo thời gian thực (*Debounced Search 300ms*), gõ tới đâu bảng tự lọc ngay tới đó.
  * Badge trạng thái trực quan:
    - `AVAILABLE`: Nền xanh lá nhạt, chữ xanh lá đậm.
    - `IN_USE`: Nền xanh dương nhạt, chữ xanh dương đậm.
    - `MAINTENANCE`: Nền vàng nhạt, chữ vàng đậm hoặc cam.
  * Rê chuột (*Hover effect*): Khi rê chuột qua từng hàng xe, hàng xe nổi nhẹ lên và đổi màu nền để tạo điểm nhấn thị giác.

---

## Feature 4: Phân công Phương tiện & Cập nhật Công-tơ-mét (FR-04)
> Hỗ trợ việc bàn giao xe cho tài xế và kiểm soát nghiêm ngặt quãng đường di chuyển thực tế thông qua chỉ số công-tơ-mét (*Odometer*).

* **Success flow (Luồng thành công chính):**
  1. Quản lý mở chi tiết một xe đang ở trạng thái `AVAILABLE`.
  2. Bấm nút "Bàn giao xe cho tài xế".
  3. Một Dropdown hiển thị danh sách các tài xế đang rảnh (chưa được gán xe khác).
  4. Quản lý chọn tài xế "Nguyễn Văn A" và bấm "Xác nhận bàn giao".
  5. Trạng thái xe lập tức chuyển sang `IN_USE`, tên tài xế hiển thị tại mục "Tài xế phụ trách".
  6. Khi kết thúc đợt công tác, tài xế hoặc quản lý bấm nút "Bàn giao lại xe / Kết thúc chuyến".
  7. Form yêu cầu nhập số km công-tơ-mét hiện tại (`current_odometer`). Người dùng nhập `15.500 km` (biết số km lúc nhận là `15.000 km`).
  8. Bấm "Hoàn thành bàn giao": Trạng thái xe quay về `AVAILABLE`, số km của xe cập nhật thành `15.500 km`.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * *Quy tắc kiểm tra số km hợp lệ (Odometer Consistency Rule):*
    - Số km nhập vào bắt buộc phải **lớn hơn hoặc bằng** số km hiện tại được lưu trong hệ thống.
    - Nếu người dùng nhập nhỏ hơn (ví dụ xe đang lưu `15.000` mà gõ `14.800`): Hệ thống lập tức viền đỏ ô input, nút "Hoàn thành" bị khóa cứng và hiện thông báo lỗi: *"Số km cập nhật (14.800 km) không thể nhỏ hơn số km hiện tại (15.000 km). Vui lòng kiểm tra lại công-tơ-mét trên xe."*
  * *Số km tăng đột biến:* Nếu số km tăng quá 1.000 km trong 1 ngày, hệ thống hiển thị hộp cảnh báo màu vàng hỏi lại: *"Quãng đường ghi nhận tăng hơn 1.000 km, bạn có chắc chắn số liệu này chính xác không?"* để tránh việc gõ nhầm thêm số 0.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * Nếu quá trình cập nhật bị lỗi kết nối: Hệ thống giữ nguyên trạng thái cũ, thông báo lỗi tới người dùng và cho phép bấm nút "Gửi lại dữ liệu bàn giao".
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Mỗi lần bàn giao và nhận xe đều được ghi lại vào nhật ký hành trình của xe để đối soát sau này.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Modal bàn giao hiển thị vòng xoay xử lý khi bấm xác nhận; khóa các nút bấm trong 300ms để tránh việc click đúp tạo 2 bản ghi trùng lặp.
* **Empty state (Trạng thái rỗng):**
  * Trong danh sách chọn tài xế, nếu tất cả tài xế đều đang bận lái xe khác: Dropdown hiển thị thông báo: *"Hiện không có tài xế nào sẵn sàng. Vui lòng kiểm tra lại lịch trình nhân sự."*
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Chỉ số công-tơ-mét luôn được định dạng có dấu chấm phân cách hàng nghìn (ví dụ: `15.200 km`).

---

## Feature 5: Kê khai & Quản lý Chi phí Vận hành (FR-05)
> Cung cấp công cụ cho Tài xế và Quản lý kê khai các khoản chi phát sinh (xăng, dầu, phí cầu đường BOT, sửa chữa), đính kèm chứng từ và đối soát minh bạch.

* **Success flow (Luồng thành công chính):**
  1. Người dùng bấm vào menu "Chi phí" trên Sidebar, chọn "+ Tạo phiếu chi phí".
  2. Modal "Kê khai chi phí mới" hiển thị form nhập:
     * Chọn phương tiện phát sinh chi phí (Dropdown biển số xe).
     * Loại chi phí: Chọn qua các nút bấm Tab trực quan: [Xăng dầu] | [Vé cầu đường BOT] | [Bảo dưỡng/Sửa chữa] | [Bảo hiểm] | [Khác].
     * Số tiền (VNĐ): Người dùng gõ `850000`. Ô input tự động định dạng thành `850.000 ₫`.
     * Ngày phát sinh: Mặc định chọn ngày hôm nay (cho phép chọn ngày trong quá khứ).
     * Số km tại thời điểm chi: `15.250 km`.
     * Ghi chú: "Đổ đầy bình xăng RON 95 tại cây xăng Petrolimex số 3".
     * Đính kèm link ảnh hóa đơn / chứng từ thanh toán.
  3. Người dùng bấm nút "Lưu phiếu chi".
  4. Hệ thống xác nhận thành công, đóng modal, bảng chi phí cập nhật phiếu mới lên đầu danh sách.
  5. Toast thông báo xanh lá hiển thị: *"Đã ghi nhận phiếu chi phí 850.000 ₫ cho xe 29A-888.88"*.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * *Số tiền:* Bắt buộc, là số dương > 0. Nếu nhập `<= 0` hoặc ký tự chữ -> Báo lỗi: *"Số tiền chi phí phải lớn hơn 0 ₫"*.
  * *Ngày phát sinh:* Bắt buộc, không được chọn ngày trong tương lai (không thể chi tiền cho ngày mai). Nếu chọn ngày mai -> Báo lỗi: *"Ngày chi phí không được vượt quá ngày hiện tại"*.
  * *Phương tiện:* Bắt buộc phải chọn một xe cụ thể từ danh sách.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Lỗi mất mạng khi gửi:* Form trong modal giữ nguyên 100% các trường đã nhập (loại chi, số tiền, ngày, ghi chú). Người dùng không bị mất công gõ lại, chỉ cần chờ có mạng và bấm lại nút "Lưu phiếu chi".
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Dữ liệu phiếu chi được lưu trữ tại cơ sở dữ liệu chuyên biệt `cost_db`.
  * Tài xế chỉ có quyền xem và sửa các phiếu chi do chính mình tạo ra trong vòng 24 giờ.
  * Quản lý và Admin có quyền xem toàn bộ phiếu chi của mọi xe và xuất báo cáo.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Bảng chi phí có thanh tải dữ liệu mượt mà; các bộ lọc theo tháng hiển thị hiệu ứng mờ nhẹ khi đang tính toán lại tổng tiền.
* **Empty state (Trạng thái rỗng):**
  * Khi một xe chưa có bất kỳ chi phí nào phát sinh: Tab lịch sử chi phí của xe đó hiển thị hình chiếc ví tiền kèm thông điệp: *"Chưa có khoản chi phí nào được ghi nhận cho xe này. Bấm nút bên dưới để tạo phiếu chi đầu tiên."*
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Định dạng tiền tệ thời gian thực (*Live Currency Masking*): Người dùng gõ các con số `1` `5` `0` `0` `0` `0` `0` thì giao diện tự động nhảy format thành `1.500.000 ₫`.
  * Chân bảng tự động tính tổng (*Dynamic Table Footer Summary*): Khi người dùng lọc danh sách chi phí theo tháng hoặc theo xe, dòng cuối cùng của bảng luôn hiển thị: *"Tổng cộng: [Tổng số tiền] ₫"* tương ứng với các dòng đang lọc.
  * Thao tác xóa an toàn: Bấm xóa phiếu chi hiển thị Modal xác nhận: *"Bạn có chắc chắn muốn xóa phiếu chi [Số tiền] cho xe [Biển số]? Hành động này sẽ thay đổi số liệu báo cáo tài chính."*

---

## Feature 6: Giám sát Ngưỡng & Tự động gửi Email Cảnh báo (FR-06)
> Tự động theo dõi các mốc bảo dưỡng định kỳ và các khoản chi vượt định mức, kích hoạt email cảnh báo tức thời tới Quản lý và Tài xế.

* **Success flow (Luồng thành công chính):**
  * **Kịch bản 1 - Cảnh báo Bảo dưỡng Tự động (Auto Maintenance Alert):**
    1. Khi một xe được cập nhật số km mới (ví dụ đạt `20.050 km`, biết mốc bảo dưỡng là mỗi `5.000 km`).
    2. Hệ thống phát hiện xe đã vượt ngưỡng định mức bảo dưỡng.
    3. Trạng thái xe tự động được đánh dấu cờ cảnh báo màu vàng (*Maintenance Due*).
    4. Hệ thống ngầm kích hoạt dịch vụ Email gửi một thư thông báo tới Quản lý và Tài xế phụ trách.
    5. Trong hòm thư của Quản lý xuất hiện email với nội dung mẫu chuẩn: Tiêu đề: *"[VMS CẢNH BÁO] Xe 29A-888.88 đã đến kỳ bảo dưỡng định kỳ"*; Nội dung nêu rõ: Biển số, số km hiện tại, danh mục các hạng mục cần bảo dưỡng (thay dầu, kiểm tra phanh, lốp).
  * **Kịch bản 2 - Cảnh báo Chi phí Đột biến (High Expense Alert):**
    1. Tài xế tạo phiếu chi với số tiền `6.500.000 ₫` (vượt ngưỡng cảnh báo mặc định `5.000.000 ₫`).
    2. Khi phiếu được lưu, hệ thống kích hoạt gửi email thông báo khẩn cấp tới Quản lý kèm theo lý do chi và link kiểm tra hóa đơn.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * Địa chỉ email người nhận phải là email hợp lệ đã được cấu hình trong hồ sơ nhân viên.
  * Nếu tài xế chưa có email: Hệ thống bỏ qua gửi mail cho tài xế và gửi cảnh báo tới email chung của phòng Quản lý đội xe, đồng thời ghi log: *"Tài xế chưa cập nhật email"*.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Sự cố máy chủ SMTP (Gmail lỗi, sai mật khẩu ứng dụng, timeout):*
    - **Nguyên tắc cô lập lỗi (*Fault Isolation*):** Sự cố gửi email **tuyệt đối không được phép làm gián đoạn** thao tác tạo chi phí hoặc cập nhật số km của người dùng. Thao tác lưu dữ liệu xe/chi phí vẫn kết thúc thành công 100%.
    - Hệ thống ghi lại nhật ký lỗi gửi thư vào hệ thống log để Quản trị viên kiểm tra cấu hình.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Giao diện cung cấp màn hình "Nhật ký Thông báo" (*Notification Log*) cho phép Quản lý xem lại danh sách các email cảnh báo đã được gửi trong 30 ngày qua (Người nhận, Tiêu đề, Thời gian gửi, Trạng thái thành công/thất bại).
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Các tác vụ gửi email được xử lý bất đồng bộ ngầm dưới nền (*Async Background Task*), không gây đơ hay chậm giao diện của người dùng.
* **Empty state (Trạng thái rỗng):**
  * Trong danh sách Nhật ký thông báo, nếu chưa có thông báo nào: Hiển thị hình chiếc chuông thông báo màu xám kèm chữ: *"Chưa có cảnh báo nào phát sinh. Đội xe đang vận hành ổn định."*
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Biểu tượng chuông thông báo trên thanh Navbar: Khi có xe đến hạn bảo dưỡng, quả chuông hiển thị chấm đỏ nhỏ (*Notification Dot*). Bấm vào chuông hiển thị menu thả xuống (*Dropdown*) tóm tắt 3 cảnh báo mới nhất.

---

## Feature 7: Bảng Điều khiển Phân tích & Thống kê Hạm đội (FR-07)
> Cung cấp cho Ban Lãnh đạo và Quản lý đội xe các chỉ số đo lường hiệu suất (KPI) trực quan, biểu đồ xu hướng chi phí và cơ cấu tài chính minh bạch.

* **Success flow (Luồng thành công chính):**
  1. Người dùng có quyền `ADMIN` hoặc `MANAGER` đăng nhập và vào trang chủ Dashboard (`/`).
  2. Toàn bộ màn hình hiển thị đồng thời 4 khối thông tin:
     * **Khối KPI trên cùng:** 4 thẻ số liệu (Tổng số xe, Số xe đang chạy, Số xe bảo dưỡng, Tổng chi phí phát sinh tháng này kèm % so sánh với tháng trước).
     * **Khối Biểu đồ Cột (Bên trái):** Xu hướng chi phí qua 12 tháng gần nhất (Trục X: Tháng 1 -> Tháng 12, Trục Y: Triệu đồng).
     * **Khối Biểu đồ Tròn (Bên phải):** Cơ cấu chi phí (Nhiên liệu chiếm bao nhiêu %, Cầu đường %, Bảo dưỡng %, Khác %).
     * **Khối Bảng Xếp hạng (Bên dưới):** Danh sách Top 5 xe có chi phí vận hành cao nhất công ty.
  3. Người dùng rê chuột vào từng cột của biểu đồ: Một ô chú thích (*Tooltip*) màu đen nổi bật hiển thị chi tiết: *"Tháng 09/2026: 42.500.000 ₫ (28 phiếu chi)"*.
  4. Người dùng thay đổi Dropdown chọn năm tài chính: Toàn bộ biểu đồ và thẻ KPI cập nhật lại số liệu tương ứng mượt mà.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * Bộ lọc năm chỉ cho phép chọn từ năm bắt đầu hoạt động của công ty đến năm hiện tại.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * Nếu máy chủ tính toán báo cáo gặp sự cố: Khối biểu đồ hiển thị thông báo nhẹ nhàng: *"Không thể tải dữ liệu biểu đồ. Bấm vào đây để thử lại"* kèm icon nút Refresh, các phần còn lại của ứng dụng vẫn sử dụng bình thường.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Dữ liệu thống kê được tổng hợp thời gian thực từ cơ sở dữ liệu `cost_db` và `vehicle_db`.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Áp dụng toàn diện hiệu ứng **Skeleton Loading**:
    - 4 thẻ KPI hiển thị 4 khối xám nhấp nháy mô phỏng vị trí con số.
    - Khối biểu đồ hiển thị khung lưới mờ mờ trước khi đường vẽ và các cột trồi lên với hiệu ứng hoạt họa mượt mà (*Smooth Animation 600ms*).
* **Empty state (Trạng thái rỗng):**
  * Khi công ty mới đưa hệ thống vào vận hành chưa có dữ liệu chi phí: Biểu đồ tròn hiển thị vòng tròn màu xám nhạt kèm văn bản ở tâm: *"Chưa có dữ liệu chi phí trong năm nay"*.
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Thẻ KPI tương tác: Bấm vào thẻ "Xe đang bảo dưỡng (3)" -> Hệ thống tự động chuyển sang trang Danh sách Xe với bộ lọc `status=MAINTENANCE` đã được bật sẵn để người dùng xem ngay 3 xe đó là những xe nào.
  * Hiệu ứng chuyển động (*Micro-animations*): Các thanh cột biểu đồ tăng trưởng từ 0 lên chiều cao thực tế khi người dùng vừa cuộn màn hình tới.

---

## Feature 8: Điều hướng Trung tâm & Xử lý Ngoại lệ Toàn cục (FR-08)
> Đảm bảo tính nhất quán của trải nghiệm người dùng, cơ chế định tuyến thông suốt qua API Gateway và phản hồi lỗi thân thiện, bảo mật trên toàn bộ hệ thống.

* **Success flow (Luồng thành công chính):**
  1. Giao diện Web duy trì cấu trúc chuẩn mực: Thanh bên (*Sidebar*) điều hướng bên trái, Thanh tiêu đề (*Navbar*) ở trên cùng, và Vùng làm việc chính (*Main Content Area*) ở trung tâm.
  2. Khi người dùng bấm vào các mục điều hướng (Tổng quan, Đội xe, Chi phí, Nhân sự, Báo cáo), trang web chuyển đổi tức thì không cần tải lại toàn bộ trình duyệt (*Single Page Application Routing*).
  3. Mọi yêu cầu dữ liệu gửi đi từ trình duyệt đều đi qua cổng trung tâm API Gateway (`:8080`), tự động đính kèm Token xác thực mà không làm lộ các cổng dịch vụ nội bộ.
* **Validation behavior (Quy tắc kiểm tra & Phản hồi):**
  * Kiểm tra quyền truy cập URL: Nếu một `DRIVER` cố tình gõ trực tiếp URL `/users` trên thanh địa chỉ trình duyệt, hệ thống phát hiện không đủ quyền hạn và tự động chuyển hướng người dùng về trang `/vehicles` kèm thông báo Toast vàng: *"Bạn không có quyền truy cập vào trang Quản lý Nhân sự"*.
* **Failure & Recovery behavior (Xử lý sự cố & Phục hồi):**
  * *Trang không tồn tại (Lỗi 404):* Nếu người dùng gõ sai đường dẫn -> Màn hình hiển thị trang 404 được thiết kế đẹp mắt với hình minh họa chiếc xe bị lạc đường kèm thông điệp: *"Rất tiếc! Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển."* và một nút bấm rõ ràng: *"Quay về Trang chủ"*.
  * *Lỗi máy chủ nội bộ (Lỗi 500):* Thay vì hiện màn hình trắng hoặc hiện chi tiết mã lỗi Java dài dòng, hệ thống hiển thị thông báo an toàn: *"Đã xảy ra lỗi không mong muốn trên hệ thống. Đội ngũ kỹ thuật đã được thông báo. Vui lòng thử lại sau giây lát."*
  * *Hết hạn phiên làm việc (Lỗi 401):* Khi token hết hạn trong lúc đang thao tác, hệ thống tự động lưu lại đường dẫn trang người dùng đang đứng, chuyển hướng về `/login` với thông báo: *"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."* Sau khi đăng nhập thành công, tự động đưa người dùng trở lại đúng trang đang làm dở.
* **Persistence & Access behavior (Lưu trữ & Trạng thái dữ liệu):**
  * Trạng thái thu gọn/mở rộng của thanh Sidebar được lưu vào trình duyệt (*Sidebar Collapsed State*), giúp người dùng giữ nguyên sở thích giao diện rộng rãi mỗi khi truy cập.
* **Loading / Pending state (Trạng thái chờ xử lý):**
  * Thanh tiến trình mỏng màu xanh dương (*Top Loading Bar*) chạy trên đỉnh màn hình mỗi khi chuyển đổi giữa các trang để người dùng cảm nhận được ứng dụng đang nạp dữ liệu.
* **Empty state (Trạng thái rỗng):**
  * Đã được bao phủ chi tiết tại từng màn hình tính năng cụ thể.
* **User observable interactions (Tương tác chi tiết quan sát được):**
  * Thiết kế Responsive: Trên màn hình máy tính bảng hoặc điện thoại di động, thanh Sidebar tự động thu gọn thành menu Hamburger (3 dấu gạch ngang); bấm vào sẽ trượt ra mượt mà từ cạnh trái.
  * Phản hồi thị giác: Các nút bấm khi click đều có hiệu ứng nhấn xuống (*Active click scale effect*), các mục menu đang được chọn (*Active Nav Item*) được làm nổi bật với dải màu thương hiệu rõ ràng.
