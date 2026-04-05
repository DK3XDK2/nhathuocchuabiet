const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");
const { ghiNhatKy } = require("../services/audit");

const duongDan = express.Router();

duongDan.get("/", xacThucTruyCap, async (req, res) => {
  const danhSach = await coSoDuLieu.hoaDon.findMany({
    include: { chiTietHoaDon: true, nguoiTao: true, donThuoc: true },
    orderBy: { id: "desc" },
  });

  return res.json(danhSach);
});

duongDan.post(
  "/",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const { phuongThucThanhToan, chiTiet, donThuocId } = req.body;

      const danhSachThuoc = await Promise.all(
        (chiTiet || []).map((dong) =>
          coSoDuLieu.thuoc.findUnique({
            where: { id: dong.thuocId },
            select: { id: true, giaBan: true },
          }),
        ),
      );

      let tongTien = 0;
      const duLieuChiTiet = (chiTiet || []).map((dong, chiSo) => {
        const thuoc = danhSachThuoc[chiSo];
        const donGia = Number(thuoc?.giaBan || 0);
        const thanhTien = donGia * Number(dong.soLuong || 0);
        tongTien += thanhTien;

        return {
          thuocId: dong.thuocId,
          soLuong: dong.soLuong,
          donViTinh: dong.donViTinh || thuoc?.donViTinh || "Cái",
          donGia,
          thanhTien,
        };
      });

      const hoaDon = await coSoDuLieu.hoaDon.create({
        data: {
          nguoiTaoId: req.nguoiDung.id,
          donThuocId: donThuocId || null,
          tongTien,
          phuongThucThanhToan,
          chiTietHoaDon: {
            create: duLieuChiTiet,
          },
        },
        include: { chiTietHoaDon: true },
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "TAO",
        "HOA_DON",
        hoaDon.id,
        null,
        hoaDon,
      );

      return res.status(201).json(hoaDon);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao hoa don" });
    }
  },
);

module.exports = duongDan;
