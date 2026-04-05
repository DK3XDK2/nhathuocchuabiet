# Backend quan ly thuoc

## Cai dat

1. Cai package:

npm install

2. Cau hinh file .env:

DATABASE_URL="mysql://root:root@localhost:3306/ql_thuoc_dev"
KHOA_BI_MAT_JWT="khoa_bi_mat_ql_thuoc_2026"
CONG_SERVER=4000

3. Chay migrate:

npm run prisma:migrate -- --name khoi_tao

4. Chay server:

npm run dev

## API chinh

- POST /api/xac-thuc/khoi-tao-quan-ly
- POST /api/xac-thuc/dang-nhap
- POST /api/xac-thuc/tao-tai-khoan
- GET, POST, PATCH /api/thuoc
- GET, POST /api/ton-kho/lo
- GET, POST /api/don-thuoc
- PATCH /api/don-thuoc/:id/trang-thai
- GET, POST /api/hoa-don
- GET, POST /api/goi-y-ai
- POST /api/goi-y-ai/:id/duyet
- GET /api/bao-cao/doanh-thu
- POST /api/don-hang/dat-hang (khach hang da dang nhap)
- GET /api/khach-hang/quan-ly (quan ly, nhan vien)
- POST /api/khach-hang/quan-ly (quan ly, nhan vien)
- PATCH /api/khach-hang/:id (quan ly, nhan vien)
- GET /api/khach-hang/:id/lich-su-mua-hang (quan ly, nhan vien)
- GET /api/nha-cung-cap (quan ly)
- POST /api/nha-cung-cap (quan ly)
- PATCH /api/nha-cung-cap/:id (quan ly)
- DELETE /api/nha-cung-cap/:id (quan ly)
