const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");
const { ghiNhatKy } = require("../services/audit");

const duongDan = express.Router();

duongDan.get("/lo", xacThucTruyCap, async (req, res) => {
  try {
    const danhSach = await coSoDuLieu.loTonKho.findMany({
      include: {
        thuoc: {
          include: {
            danhMucThuoc: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });
    return res.json(danhSach);
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi lay du lieu ton kho" });
  }
});

duongDan.post(
  "/lo",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const { thuocId, soLo, hanSuDung, soLuongTon, giaNhap } = req.body;

      const loMoi = await coSoDuLieu.loTonKho.create({
        data: {
          thuocId,
          soLo,
          hanSuDung: new Date(hanSuDung),
          soLuongTon,
          giaNhap,
        },
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "NHAP_KHO",
        "LO_TON_KHO",
        loMoi.id,
        null,
        loMoi,
      );

      return res.status(201).json(loMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao lo ton kho" });
    }
  },
);

duongDan.patch(
  "/lo/:id",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const duLieuCu = await coSoDuLieu.loTonKho.findUnique({ where: { id } });

      if (!duLieuCu) {
        return res.status(404).json({ thongBao: "Khong tim thay lo ton kho" });
      }

      const duLieuCapNhat = {
        ...req.body,
      };

      if (duLieuCapNhat.hanSuDung) {
        duLieuCapNhat.hanSuDung = new Date(duLieuCapNhat.hanSuDung);
      }

      const loMoi = await coSoDuLieu.loTonKho.update({
        where: { id },
        data: duLieuCapNhat,
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "CAP_NHAT",
        "LO_TON_KHO",
        loMoi.id,
        duLieuCu,
        loMoi,
      );

      return res.json(loMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi cap nhat lo ton kho" });
    }
  },
);

module.exports = duongDan;
