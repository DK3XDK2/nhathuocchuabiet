const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");
const { ghiNhatKy } = require("../services/audit");

const duongDan = express.Router();

duongDan.get("/danh-muc", xacThucTruyCap, async (req, res) => {
  try {
    const danhSach = await coSoDuLieu.danhMucThuoc.findMany({
      orderBy: { tenDanhMuc: "asc" },
    });

    return res.json(danhSach);
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi lay danh muc thuoc" });
  }
});

duongDan.post(
  "/danh-muc",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const tenDanhMuc = String(req.body?.tenDanhMuc || "").trim();

      if (!tenDanhMuc) {
        return res
          .status(400)
          .json({ thongBao: "Ten danh muc khong duoc de trong" });
      }

      const daTonTai = await coSoDuLieu.danhMucThuoc.findUnique({
        where: { tenDanhMuc },
      });

      if (daTonTai) {
        return res.json(daTonTai);
      }

      const danhMucMoi = await coSoDuLieu.danhMucThuoc.create({
        data: { tenDanhMuc },
      });

      return res.status(201).json(danhMucMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao danh muc thuoc" });
    }
  },
);

duongDan.get("/", xacThucTruyCap, async (req, res) => {
  const danhSach = await coSoDuLieu.thuoc.findMany({
    include: {
      danhMucThuoc: true,
      loTonKho: true,
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
      const {
        maThuoc,
        tenThuoc,
        donViTinh,
        giaBan,
        canDonThuoc,
        danhMucThuocId,
      } = req.body;

      const duLieuMoi = await coSoDuLieu.thuoc.create({
        data: {
          maThuoc,
          tenThuoc,
          donViTinh,
          giaBan,
          canDonThuoc: !!canDonThuoc,
          danhMucThuocId,
        },
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "TAO",
        "THUOC",
        duLieuMoi.id,
        null,
        duLieuMoi,
      );

      return res.status(201).json(duLieuMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao thuoc" });
    }
  },
);

duongDan.patch(
  "/:id",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const duLieuCu = await coSoDuLieu.thuoc.findUnique({ where: { id } });

      if (!duLieuCu) {
        return res.status(404).json({ thongBao: "Khong tim thay thuoc" });
      }

      const duLieuMoi = await coSoDuLieu.thuoc.update({
        where: { id },
        data: req.body,
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "CAP_NHAT",
        "THUOC",
        id,
        duLieuCu,
        duLieuMoi,
      );

      return res.json(duLieuMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi cap nhat thuoc" });
    }
  },
);

module.exports = duongDan;
