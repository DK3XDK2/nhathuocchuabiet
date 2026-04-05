# Tài liệu thiết kế cơ sở dữ liệu - Hệ thống Quản lý Thuốc

## Bảng 1: Bảng Người dùng nội bộ (NGUOI_DUNG)

| Tên trường   | Kiểu dữ liệu                | Khóa   | Mô tả                                                                                  |
| ------------ | --------------------------- | ------ | -------------------------------------------------------------------------------------- |
| id           | INT                         | PK     | Mã người dùng nội bộ (Tự tăng)                                                         |
| ho_ten       | VARCHAR(191)                |        | Họ và tên                                                                              |
| email        | VARCHAR(191)                | UNIQUE | Email đăng nhập nội bộ                                                                 |
| mat_khau     | VARCHAR(191)                |        | Mật khẩu đã mã hóa                                                                     |
| vai_tro      | ENUM('QUAN_LY','NHAN_VIEN') |        | Phân quyền: QUAN_LY có toàn quyền hệ thống, NHAN_VIEN bị giới hạn chức năng            |
| trang_thai   | ENUM('HOAT_DONG','KHOA')    |        | HOAT_DONG: tài khoản hợp lệ, được đăng nhập; KHOA: bị vô hiệu hoá, không thể đăng nhập |
| tao_luc      | DATETIME                    |        | Thời điểm tạo                                                                          |
| cap_nhat_luc | DATETIME                    |        | Thời điểm cập nhật gần nhất                                                            |

## Bảng 2: Bảng Danh mục thuốc (DANH_MUC_THUOC)

| Tên trường   | Kiểu dữ liệu | Khóa   | Mô tả                 |
| ------------ | ------------ | ------ | --------------------- |
| id           | INT          | PK     | Mã danh mục (Tự tăng) |
| ten_danh_muc | VARCHAR(191) | UNIQUE | Tên danh mục thuốc    |
| tao_luc      | DATETIME     |        | Thời điểm tạo         |
| cap_nhat_luc | DATETIME     |        | Thời điểm cập nhật    |

## Bảng 3: Bảng Thuốc (THUOC)

| Tên trường        | Kiểu dữ liệu  | Khóa   | Mô tả                                                                                 |
| ----------------- | ------------- | ------ | ------------------------------------------------------------------------------------- |
| id                | INT           | PK     | Mã thuốc (Tự tăng)                                                                    |
| ma_thuoc          | VARCHAR(191)  | UNIQUE | Mã định danh thuốc                                                                    |
| ten_thuoc         | VARCHAR(191)  | INDEX  | Tên thuốc                                                                             |
| hoat_chat         | VARCHAR(191)  |        | Hoạt chất chính                                                                       |
| ham_luong         | VARCHAR(191)  |        | Hàm lượng (ví dụ: 500mg)                                                              |
| don_vi_tinh       | VARCHAR(191)  |        | Đơn vị tính                                                                           |
| gia_ban           | DECIMAL(12,2) |        | Giá bán hiện hành                                                                     |
| can_don_thuoc     | BOOLEAN       |        | true = thuốc kê đơn, bắt buộc phải có đơn bác sĩ khi mua; false = thuốc OTC bán tự do |
| con_kinh_doanh    | BOOLEAN       |        | true = đang kinh doanh; false = đã ngừng bán, ẩn khỏi danh sách sản phẩm              |
| danh_muc_thuoc_id | INT           | FK     | Liên kết danh mục thuốc                                                               |
| tao_luc           | DATETIME      |        | Thời điểm tạo                                                                         |
| cap_nhat_luc      | DATETIME      |        | Thời điểm cập nhật                                                                    |

## Bảng 4: Bảng Lô tồn kho (LO_TON_KHO)

| Tên trường   | Kiểu dữ liệu  | Khóa | Mô tả                   |
| ------------ | ------------- | ---- | ----------------------- |
| id           | INT           | PK   | Mã lô tồn kho (Tự tăng) |
| thuoc_id     | INT           | FK   | Thuốc thuộc lô          |
| so_lo        | VARCHAR(191)  |      | Số lô sản xuất          |
| han_su_dung  | DATETIME      |      | Hạn sử dụng             |
| so_luong_ton | INT           |      | Số lượng còn trong kho  |
| gia_nhap     | DECIMAL(12,2) |      | Giá nhập theo lô        |
| tao_luc      | DATETIME      |      | Thời điểm tạo           |
| cap_nhat_luc | DATETIME      |      | Thời điểm cập nhật      |

## Bảng 5: Bảng Đơn thuốc (DON_THUOC)

| Tên trường    | Kiểu dữ liệu                         | Khóa | Mô tả                                                                             |
| ------------- | ------------------------------------ | ---- | --------------------------------------------------------------------------------- |
| id            | INT                                  | PK   | Mã đơn thuốc (Tự tăng)                                                            |
| ten_benh_nhan | VARCHAR(191)                         | NULL | Tên bệnh nhân                                                                     |
| ten_bac_si    | VARCHAR(191)                         | NULL | Tên bác sĩ kê đơn                                                                 |
| trang_thai    | ENUM('MOI_TAO','DA_DUYET','TU_CHOI') |      | MOI_TAO: chờ duyệt; DA_DUYET: đã xác nhận hợp lệ; TU_CHOI: bị từ chối bởi quản lý |
| nguoi_tao_id  | INT                                  | FK   | FK → NGUOI_DUNG: nhân viên nhập đơn thuốc vào hệ thống                            |
| tao_luc       | DATETIME                             |      | Thời điểm tạo                                                                     |
| cap_nhat_luc  | DATETIME                             |      | Thời điểm cập nhật                                                                |

## Bảng 6: Bảng Chi tiết đơn thuốc (CHI_TIET_DON_THUOC)

| Tên trường   | Kiểu dữ liệu | Khóa | Mô tả                                                        |
| ------------ | ------------ | ---- | ------------------------------------------------------------ |
| id           | INT          | PK   | Mã chi tiết đơn thuốc                                        |
| don_thuoc_id | INT          | FK   | FK → DON_THUOC: đơn thuốc (Bảng 5) chứa dòng chi tiết này    |
| thuoc_id     | INT          | FK   | FK → THUOC: thuốc được bác sĩ kê trong đơn thuốc             |
| so_luong     | INT          |      | Số lượng thuốc được kê cho bệnh nhân                         |
| lieu_dung    | VARCHAR(191) |      | Hướng dẫn sử dụng do bác sĩ ghi (ví dụ: "Ngày 2 lần sau ăn") |
| tao_luc      | DATETIME     |      | Thời điểm tạo                                                |

## Bảng 7: Bảng Hóa đơn (HOA_DON)

| Tên trường             | Kiểu dữ liệu  | Khóa     | Mô tả                                                                                   |
| ---------------------- | ------------- | -------- | --------------------------------------------------------------------------------------- |
| id                     | INT           | PK       | Mã hóa đơn (Tự tăng)                                                                    |
| nguoi_tao_id           | INT           | FK       | FK → NGUOI_DUNG: nhân viên lập hóa đơn tại quầy                                         |
| don_thuoc_id           | INT           | FK, NULL | FK → DON_THUOC: đính kèm đơn thuốc nếu bán thuốc kê đơn; NULL nếu bán OTC không cần đơn |
| tong_tien              | DECIMAL(12,2) |          | Tổng tiền hóa đơn (đã bao gồm tất cả dòng chi tiết)                                     |
| phuong_thuc_thanh_toan | VARCHAR(191)  |          | Hình thức thanh toán (ví dụ: TIEN_MAT, CHUYEN_KHOAN, THE)                               |
| tao_luc                | DATETIME      |          | Thời điểm tạo                                                                           |

## Bảng 8: Bảng Chi tiết hóa đơn (CHI_TIET_HOA_DON)

| Tên trường  | Kiểu dữ liệu  | Khóa | Mô tả                                                                                  |
| ----------- | ------------- | ---- | -------------------------------------------------------------------------------------- |
| id          | INT           | PK   | Mã chi tiết hóa đơn                                                                    |
| hoa_don_id  | INT           | FK   | FK → HOA_DON: hóa đơn chứa dòng chi tiết này                                           |
| thuoc_id    | INT           | FK   | FK → THUOC: thuốc được bán ra trong hóa đơn                                            |
| so_luong    | INT           |      | Số lượng thuốc bán trong giao dịch này                                                 |
| don_vi_tinh | VARCHAR(191)  |      | Đơn vị tính tại thời điểm bán (ví dụ: viên, vỉ, hộp) — snapshot theo lựa chọn khách    |
| don_gia     | DECIMAL(12,2) |      | Giá bán tại thời điểm giao dịch (snapshot, không thay đổi dù gia_ban THUOC bị sửa sau) |
| thanh_tien  | DECIMAL(12,2) |      | Thành tiền dòng = so_luong × don_gia                                                   |

## Bảng 9: Bảng Gợi ý AI (GOI_Y_AI)

| Tên trường      | Kiểu dữ liệu                                      | Khóa | Mô tả                                                                                                                      |
| --------------- | ------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| id              | INT                                               | PK   | Mã gợi ý AI (Tự tăng)                                                                                                      |
| loai            | ENUM('TON_KHO_THAP','SAP_HET_HAN','XU_HUONG_MUA') |      | Loại gợi ý: TON_KHO_THAP = tồn kho dưới ngưỡng an toàn; SAP_HET_HAN = lô sắp hết hạn; XU_HUONG_MUA = xu hướng tăng nhu cầu |
| du_lieu_dau_vao | JSON                                              |      | JSON payload đầu vào: AI quét từ LO_TON_KHO và CHI_TIET_HOA_DON để phân tích                                               |
| du_lieu_dau_ra  | JSON                                              |      | JSON kết quả AI trả về: đề xuất số lượng đặt, thời điểm đặt, lô ưu tiên...                                                 |
| do_tin_cay      | FLOAT                                             |      | Độ tin cậy dự đoán của AI (0.0 – 1.0); quản lý nên ưu tiên duyệt những gợi ý có độ tin cậy cao                             |
| trang_thai      | ENUM('CHO_DUYET','DA_DUYET','TU_CHOI')            |      | CHO_DUYET: chờ quản lý xem xét; DA_DUYET: áp dụng đề xuất; TU_CHOI: bác bỏ                                                 |
| duyet_boi_id    | INT                                               | FK   | FK → NGUOI_DUNG: người phê duyệt hoặc từ chối đề xuất (quản lý hoặc chủ cửa hàng)                                          |
| ghi_chu_duyet   | VARCHAR(191)                                      | NULL | Lý do phê duyệt hoặc từ chối (ví dụ: "Thuốc này đang bị dừng sản xuất, không đặt thêm")                                    |
| tao_luc         | DATETIME                                          |      | Thời điểm AI tạo gợi ý                                                                                                     |

## Bảng 10: Bảng Nhật ký hệ thống (NHAT_KY_HE_THONG)

| Tên trường         | Kiểu dữ liệu            | Khóa     | Mô tả                                                                      |
| ------------------ | ----------------------- | -------- | -------------------------------------------------------------------------- |
| id                 | INT                     | PK       | Mã nhật ký (Tự tăng)                                                       |
| nguoi_thuc_hien_id | INT                     | FK, NULL | FK → NGUOI_DUNG: người thực hiện; NULL nếu do tiến trình hệ thống tự động  |
| loai_tac_nhan      | ENUM('USER','HE_THONG') |          | USER: thao tác do người dùng; HE_THONG: do tiến trình nền/cron job tự động |
| hanh_dong          | VARCHAR(191)            |          | Tên hành động: TAO, CAP_NHAT, XOA, DUYET, TU_CHOI, DANG_NHAP...            |
| doi_tuong          | VARCHAR(191)            |          | Tên bảng/thực thể bị tác động (ví dụ: THUOC, HOA_DON, DON_THUOC)           |
| doi_tuong_id       | INT                     |          | Khoá chính của bản ghi bị tác động trong bảng doi_tuong                    |
| truoc_thay_doi     | JSON                    |          | Dữ liệu gốc ban đầu (Để biết trước đó nó là cái gì nếu lỡ sửa sai).        |
| sau_thay_doi       | JSON                    |          | Snapshot dữ liệu sau khi thay đổi (dùng để so sánh và truy vết)            |
| tao_luc            | DATETIME                |          | Thời điểm ghi log                                                          |

## Bảng 11: Bảng Khách hàng (KHACH_HANG)

| Tên trường    | Kiểu dữ liệu | Khóa   | Mô tả                   |
| ------------- | ------------ | ------ | ----------------------- |
| id            | INT          | PK     | Mã khách hàng (Tự tăng) |
| ho_ten        | VARCHAR(191) |        | Họ tên khách hàng       |
| email         | VARCHAR(191) | UNIQUE | Email đăng nhập khách   |
| so_dien_thoai | VARCHAR(191) | INDEX  | Số điện thoại khách     |
| dia_chi       | VARCHAR(191) |        | Địa chỉ mặc định        |
| mat_khau      | VARCHAR(191) |        | Mật khẩu đã mã hóa      |
| tao_luc       | DATETIME     |        | Thời điểm tạo           |
| cap_nhat_luc  | DATETIME     |        | Thời điểm cập nhật      |

## Bảng 12: Bảng Đơn hàng web (DON_HANG)

| Tên trường         | Kiểu dữ liệu                                               | Khóa     | Mô tả                                                                                    |
| ------------------ | ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| id                 | INT                                                        | PK       | Mã đơn hàng (Tự tăng)                                                                    |
| ma_don_hang        | VARCHAR(191)                                               | UNIQUE   | Mã đơn hàng thân thiện hiển thị cho khách (ví dụ: DH20260403001)                         |
| khach_hang_id      | INT                                                        | FK, NULL | FK → KHACH_HANG: tài khoản khách đặt hàng; NULL nếu là khách vãng lai chưa đăng ký       |
| ten_nguoi_nhan     | VARCHAR(191)                                               |          | Người nhận hàng                                                                          |
| so_dien_thoai_nhan | VARCHAR(191)                                               | INDEX    | SĐT nhận hàng                                                                            |
| email_nguoi_nhan   | VARCHAR(191)                                               | NULL     | Email nhận thông báo đơn hàng; NULL nếu khách không cung cấp                             |
| dia_chi_giao       | VARCHAR(191)                                               |          | Địa chỉ giao                                                                             |
| ghi_chu            | VARCHAR(191)                                               |          | Ghi chú đơn hàng                                                                         |
| tong_tien_hang     | DECIMAL(12,2)                                              |          | Tiền hàng trước phí ship                                                                 |
| phi_giao_hang      | DECIMAL(12,2)                                              |          | Phí giao hàng                                                                            |
| tong_thanh_toan    | DECIMAL(12,2)                                              |          | Tổng phải thanh toán                                                                     |
| trang_thai         | ENUM('MOI_TAO','DA_XAC_NHAN','DANG_GIAO','HOAN_TAT','HUY') |          | Vòng đời đơn hàng: MOI_TAO → DA_XAC_NHAN → DANG_GIAO → HOAN_TAT; hoặc HUY bất kỳ lúc nào |
| tao_luc            | DATETIME                                                   | INDEX    | Thời điểm tạo                                                                            |
| cap_nhat_luc       | DATETIME                                                   |          | Thời điểm cập nhật                                                                       |

## Bảng 13: Bảng Chi tiết đơn hàng (CHI_TIET_DON_HANG)

| Tên trường  | Kiểu dữ liệu  | Khóa | Mô tả                                                                  |
| ----------- | ------------- | ---- | ---------------------------------------------------------------------- |
| id          | INT           | PK   | Mã chi tiết đơn hàng                                                   |
| don_hang_id | INT           | FK   | FK → DON_HANG: đơn hàng web chứa dòng chi tiết này                     |
| thuoc_id    | INT           | FK   | FK → THUOC: thuốc khách hàng đặt mua                                   |
| so_luong    | INT           |      | Số lượng thuốc khách đặt trong đơn hàng                                |
| don_gia     | DECIMAL(12,2) |      | Giá bán tại thời điểm đặt hàng (snapshot, cố định dù giá thay đổi sau) |
| thanh_tien  | DECIMAL(12,2) |      | Thành tiền dòng = so_luong × don_gia                                   |

## Bảng 14: Bảng Lịch sử xuất kho (LICH_SU_XUAT_KHO)

| Tên trường      | Kiểu dữ liệu                                   | Khóa     | Mô tả                                                                                                                |
| --------------- | ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| id              | INT                                            | PK       | Mã lịch sử xuất (Tự tăng)                                                                                            |
| lo_ton_kho_id   | INT                                            | FK       | FK → LO_TON_KHO: lô hàng cụ thể bị giảm số lượng khi xuất kho                                                        |
| so_luong_xuat   | INT                                            |          | Số lượng đơn vị thực tế xuất ra khỏi lô này                                                                          |
| nguoi_xuat_id   | INT                                            | FK       | FK → NGUOI_DUNG: nhân viên thực hiện thao tác xuất kho                                                               |
| li_do_xuat      | ENUM('BAN_HANG','HU_HANG','KIEM_KE','HET_HAN') |          | BAN_HANG: bán cho khách; HU_HANG: thuốc bị hỏng/vỡ; KIEM_KE: điều chỉnh sau kiểm kê; HET_HAN: huỷ do hết hạn sử dụng |
| tham_chieu_id   | INT                                            | FK, NULL | FK → HOA_DON hoặc DON_HANG: bản ghi gốc gây ra lần xuất kho này; NULL nếu không phải BAN_HANG                        |
| loai_tham_chieu | ENUM('HOA_DON','DON_HANG')                     | NULL     | Xác định tham_chieu_id trỏ tới bảng nào: HOA_DON (bán tại quầy) hoặc DON_HANG (bán online)                           |
| tao_luc         | DATETIME                                       |          | Thời điểm xuất                                                                                                       |

## Ghi chú quan hệ chính

- DANH_MUC_THUOC (1) - (N) THUOC
- THUOC (1) - (N) LO_TON_KHO
- LO_TON_KHO (1) - (N) LICH_SU_XUAT_KHO
- DON_THUOC (1) - (N) CHI_TIET_DON_THUOC
- DON_THUOC (1) - (N) HOA_DON
- HOA_DON (1) - (N) CHI_TIET_HOA_DON
- KHACH_HANG (1) - (N) DON_HANG
- DON_HANG (1) - (N) CHI_TIET_DON_HANG
- NGUOI_DUNG liên kết tạo/duyệt các bảng nghiệp vụ và NHAT_KY_HE_THONG

## Ghi chú thiết kế AI và hiệu năng

- GOI_Y_AI được dùng để lưu lịch sử gợi ý và quy trình duyệt, phù hợp mô hình rule-based hỗ trợ quyết định.
- NHAT_KY_HE_THONG có loai_tac_nhan để phân biệt thao tác do người dùng hay tiến trình hệ thống.
- LICH_SU_XUAT_KHO ghi lại chi tiết mỗi lần xuất kho, hỗ trợ 4 lý do: BAN_HANG (bán hàng bình thường), HU_HANG (thuốc bị hỏng/vỡ), KIEM_KE (kiểm kê kho), HET_HAN (hủy do hết hạn sử dụng). Khi BAN_HANG, cột tham_chieu_id liên kết tới Hóa đơn hoặc Đơn hàng để audit toàn vòng đời.
- Chiến lược FEFO: Khi bán thuốc (li_do_xuat='BAN_HANG'), nhân viên query LO_TON_KHO sắp xếp theo han_su_dung tăng dần, trừ lô sắp hết hạn trước. Mỗi lần xuất ghi LICH_SU_XUAT_KHO, do đó có thể audit ngược: "Thuốc từ lô cũ được bán trước lô mới không?"
- Các cột INDEX hỗ trợ tìm kiếm và lọc dữ liệu nhanh khi quy mô bản ghi tăng.

## Kịch bản nghiệp vụ cần demo trong báo cáo

- Khách vãng lai đặt thuốc: DON_HANG có khach_hang_id = NULL nhưng vẫn lưu đầy đủ thông tin nhận hàng.
- Khách đăng nhập đặt thuốc: DON_HANG có khach_hang_id để truy xuất lịch sử mua.
- Nhân viên/quản lý xử lý đơn và cập nhật trạng thái theo vòng đời đơn hàng.
- Hệ thống kho ưu tiên xuất theo FEFO (hạn dùng gần nhất xuất trước) để giảm rủi ro thuốc hết hạn.
