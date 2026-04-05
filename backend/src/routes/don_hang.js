const express = require("express");
const { coSoDuLieu } = require("../config/database");
const {
  xacThucTruyCap,
  yeuCauKhachHang,
  yeuCauVaiTro,
} = require("../middleware/xac_thuc");

const duongDan = express.Router();

function taoMaDonHang() {
  return `DH${Date.now()}`;
}

async function tinhChiTietDonHang(chiTiet) {
  const danhSachThuoc = await Promise.all(
    chiTiet.map((dong) =>
      coSoDuLieu.thuoc.findUnique({
        where: { id: dong.thuocId },
        select: { id: true, giaBan: true, conKinhDoanh: true },
      }),
    ),
  );

  const duLieuChiTiet = [];
  let tongTienHang = 0;

  for (let i = 0; i < chiTiet.length; i += 1) {
    const dong = chiTiet[i];
    const thuoc = danhSachThuoc[i];

    if (!thuoc || !thuoc.conKinhDoanh) {
      throw new Error("Thuoc khong hop le");
    }

    const donGia = Number(thuoc.giaBan);
    const soLuong = Number(dong.soLuong || 0);
    const thanhTien = donGia * soLuong;
    tongTienHang += thanhTien;

    duLieuChiTiet.push({
      thuocId: dong.thuocId,
      soLuong,
      donGia,
      thanhTien,
    });
  }

  return { duLieuChiTiet, tongTienHang };
}

duongDan.post(
  ["/dat-hang", "/dat-hang-da-dang-nhap"],
  xacThucTruyCap,
  yeuCauKhachHang,
  async (req, res) => {
    try {
      const {
        tenNguoiNhan,
        soDienThoaiNhan,
        emailNguoiNhan,
        diaChiGiao,
        ghiChu,
        phiGiaoHang,
        chiTiet,
      } = req.body;

      if (
        !tenNguoiNhan ||
        !soDienThoaiNhan ||
        !diaChiGiao ||
        !Array.isArray(chiTiet) ||
        chiTiet.length === 0
      ) {
        return res.status(400).json({ thongBao: "Thieu du lieu dat hang" });
      }

      const { duLieuChiTiet, tongTienHang } = await tinhChiTietDonHang(chiTiet);
      const giaShip = Number(phiGiaoHang || 0);

      const donHang = await coSoDuLieu.donHang.create({
        data: {
          maDonHang: taoMaDonHang(),
          khachHangId: req.nguoiDung.id,
          tenNguoiNhan,
          soDienThoaiNhan,
          emailNguoiNhan,
          diaChiGiao,
          ghiChu,
          tongTienHang,
          phiGiaoHang: giaShip,
          tongThanhToan: tongTienHang + giaShip,
          chiTietDonHang: {
            create: duLieuChiTiet,
          },
        },
        include: { chiTietDonHang: true },
      });

      return res
        .status(201)
        .json({ thongBao: "Dat hang thanh cong", duLieu: donHang });
    } catch (loi) {
      return res.status(400).json({ thongBao: loi.message || "Loi dat hang" });
    }
  },
);

duongDan.get("/lich-su", xacThucTruyCap, yeuCauKhachHang, async (req, res) => {
  const danhSach = await coSoDuLieu.donHang.findMany({
    where: { khachHangId: req.nguoiDung.id },
    include: {
      chiTietDonHang: {
        include: {
          thuoc: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  return res.json(danhSach);
});

duongDan.get(
  "/quan-ly",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    const danhSach = await coSoDuLieu.donHang.findMany({
      include: {
        khachHang: true,
        chiTietDonHang: true,
      },
      orderBy: { id: "desc" },
    });

    return res.json(danhSach);
  },
);

duongDan.patch(
  "/:id/trang-thai",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { trangThai } = req.body;

      const duLieuMoi = await coSoDuLieu.donHang.update({
        where: { id },
        data: { trangThai },
      });

      return res.json(duLieuMoi);
    } catch (loi) {
      return res
        .status(400)
        .json({ thongBao: "Loi cap nhat trang thai don hang" });
    }
  },
);

module.exports = duongDan;
