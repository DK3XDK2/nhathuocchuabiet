const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");
const { ghiNhatKy } = require("../services/audit");

const duongDan = express.Router();

duongDan.get(
  "/",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    const danhSach = await coSoDuLieu.goiYAi.findMany({
      include: { duyetBoi: true },
      orderBy: { id: "desc" },
    });

    return res.json(danhSach);
  },
);

duongDan.post(
  "/",
  xacThucTruyCap,
  yeuCauVaiTro("NHAN_VIEN", "QUAN_LY"),
  async (req, res) => {
    try {
      const { loai, duLieuDauVao, duLieuDauRa, doTinCay } = req.body;

      const goiY = await coSoDuLieu.goiYAi.create({
        data: {
          loai,
          duLieuDauVao,
          duLieuDauRa,
          doTinCay,
          trangThai: "CHO_DUYET",
        },
      });

      await ghiNhatKy(req.nguoiDung.id, "TAO", "GOI_Y_AI", goiY.id, null, goiY);

      return res.status(201).json(goiY);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi tao goi y AI" });
    }
  },
);

duongDan.post(
  "/:id/duyet",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const duLieuCu = await coSoDuLieu.goiYAi.findUnique({ where: { id } });

      if (!duLieuCu) {
        return res.status(404).json({ thongBao: "Khong tim thay goi y AI" });
      }

      const duLieuMoi = await coSoDuLieu.goiYAi.update({
        where: { id },
        data: {
          trangThai: "DA_DUYET",
          duyetBoiId: req.nguoiDung.id,
        },
      });

      await ghiNhatKy(
        req.nguoiDung.id,
        "DUYET",
        "GOI_Y_AI",
        id,
        duLieuCu,
        duLieuMoi,
      );

      return res.json(duLieuMoi);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi duyet goi y AI" });
    }
  },
);

module.exports = duongDan;
