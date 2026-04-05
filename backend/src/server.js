require("dotenv").config();
const express = require("express");
const cors = require("cors");

const duongDanXacThuc = require("./routes/xac_thuc");
const duongDanThuoc = require("./routes/thuoc");
const duongDanTonKho = require("./routes/ton_kho");
const duongDanDonThuoc = require("./routes/don_thuoc");
const duongDanHoaDon = require("./routes/hoa_don");
const duongDanGoiYAi = require("./routes/goi_y_ai");
const duongDanBaoCao = require("./routes/bao_cao");
const duongDanKhachHang = require("./routes/khach_hang");
const duongDanDonHang = require("./routes/don_hang");
const duongDanNhaCungCap = require("./routes/nha_cung_cap");

const ungDung = express();

ungDung.use(cors());
ungDung.use(express.json());

ungDung.get("/", (req, res) => {
  return res.json({ thongBao: "Backend quan ly thuoc dang hoat dong" });
});

ungDung.use("/api/xac-thuc", duongDanXacThuc);
ungDung.use("/api/thuoc", duongDanThuoc);
ungDung.use("/api/ton-kho", duongDanTonKho);
ungDung.use("/api/don-thuoc", duongDanDonThuoc);
ungDung.use("/api/hoa-don", duongDanHoaDon);
ungDung.use("/api/goi-y-ai", duongDanGoiYAi);
ungDung.use("/api/bao-cao", duongDanBaoCao);
ungDung.use("/api/khach-hang", duongDanKhachHang);
ungDung.use("/api/don-hang", duongDanDonHang);
ungDung.use("/api/nha-cung-cap", duongDanNhaCungCap);

const cong = Number(process.env.PORT || process.env.CONG_SERVER || 4000);

ungDung.listen(cong, () => {
  console.log(`May chu chay toi cong ${cong}`);
});
