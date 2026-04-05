const express = require("express");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");

const duongDan = express.Router();

duongDan.get(
  "/doanh-thu",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY"),
  async (req, res) => {
    const ketQua = await coSoDuLieu.hoaDon.aggregate({
      _sum: { tongTien: true },
      _count: { id: true },
    });

    return res.json({
      tongHoaDon: ketQua._count.id,
      tongDoanhThu: Number(ketQua._sum.tongTien || 0),
    });
  },
);

module.exports = duongDan;
