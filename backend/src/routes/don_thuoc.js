const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");
const { ghiNhatKy } = require("../services/audit");

const duongDan = express.Router();

duongDan.get("/", xacThucTruyCap, async (req, res) => {
  const danhSach = await coSoDuLieu.donThuoc.findMany({
    include: {
      chiTietDonThuoc: {
        include: {
          thuoc: true,
        },
      },
      nguoiTao: true,
    },
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
      const { tenBenhNhan, tenBacSi, chiTiet } = req.body;

      const don = await coSoDuLieu.donThuoc.create({
        data: {
          tenBenhNhan,
          tenBacSi,
          nguoiTaoId: req.nguoiDung.id,
          chiTietDonThuoc: {
            create: (chiTiet || []).map((dong) => ({
              thuocId: dong.thuocId,
              soLuong: dong.soLuong,
              lieuDung: dong.lieuDung,
            })),
          },
        },
        include: {
          chiTietDonThuoc: {
            include: {
              thuoc: true,
            },
          },
        },
      });

      await ghiNhatKy(req.nguoiDung.id, "TAO", "DON_THUOC", don.id, null, don);

      return res.status(201).json(don);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao don thuoc" });
    }
  },
);

duongDan.patch(
  "/:id/trang-thai",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { trangThai } = req.body;

      const duLieuCu = await coSoDuLieu.donThuoc.findUnique({ where: { id } });

      if (!duLieuCu) {
        return res.status(404).json({ thongBao: "Khong tim thay don thuoc" });
      }

      const duLieuMoi = await coSoDuLieu.donThuoc.update({
        where: { id },
        data: { trangThai },
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "DUYET",
        "DON_THUOC",
        id,
        duLieuCu,
        duLieuMoi,
      );

      return res.json(duLieuMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi cap nhat trang thai" });
    }
  },
);

module.exports = duongDan;
