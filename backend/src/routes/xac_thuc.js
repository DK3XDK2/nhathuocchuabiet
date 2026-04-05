const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { coSoDuLieu } = require("../config/database");
const { xacThucTruyCap, yeuCauVaiTro } = require("../middleware/xac_thuc");

const duongDan = express.Router();

duongDan.post("/khoi-tao-quan-ly", async (req, res) => {
  try {
    const { hoTen, email, matKhau } = req.body;

    if (!hoTen || !email || !matKhau) {
      return res.status(400).json({ thongBao: "Thieu du lieu khoi tao" });
    }

    const soQuanLy = await coSoDuLieu.nguoiDung.count({
      where: { vaiTro: "QUAN_LY" },
    });

    if (soQuanLy > 0) {
      return res.status(409).json({ thongBao: "He thong da co quan ly" });
    }

    const matKhauDaMaHoa = await bcrypt.hash(matKhau, 10);

    const quanLy = await coSoDuLieu.nguoiDung.create({
      data: {
        hoTen,
        email,
        matKhau: matKhauDaMaHoa,
        vaiTro: "QUAN_LY",
      },
    });

    return res.status(201).json({
      thongBao: "Khoi tao quan ly thanh cong",
      duLieu: {
        id: quanLy.id,
        hoTen: quanLy.hoTen,
        email: quanLy.email,
        vaiTro: quanLy.vaiTro,
      },
    });
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi khoi tao quan ly" });
  }
});

duongDan.post("/dang-nhap", async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
      return res.status(400).json({ thongBao: "Thieu email hoac mat khau" });
    }

    const nguoiDung = await coSoDuLieu.nguoiDung.findUnique({
      where: { email },
    });

    if (!nguoiDung) {
      return res
        .status(401)
        .json({ thongBao: "Thong tin dang nhap khong dung" });
    }

    const dungMatKhau = await bcrypt.compare(matKhau, nguoiDung.matKhau);

    if (!dungMatKhau) {
      return res
        .status(401)
        .json({ thongBao: "Thong tin dang nhap khong dung" });
    }

    const token = jwt.sign(
      {
        id: nguoiDung.id,
        email: nguoiDung.email,
        vaiTro: nguoiDung.vaiTro,
      },
      process.env.KHOA_BI_MAT_JWT,
      { expiresIn: "8h" },
    );

    return res.json({
      thongBao: "Dang nhap thanh cong",
      token,
      nguoiDung: {
        id: nguoiDung.id,
        hoTen: nguoiDung.hoTen,
        email: nguoiDung.email,
        vaiTro: nguoiDung.vaiTro,
      },
    });
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi dang nhap" });
  }
});

duongDan.post(
  "/tao-tai-khoan",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY"),
  async (req, res) => {
    try {
      const { hoTen, email, matKhau, vaiTro } = req.body;

      if (!hoTen || !email || !matKhau || !vaiTro) {
        return res
          .status(400)
          .json({ thongBao: "Thieu du lieu tao tai khoan" });
      }

      const taiKhoanDaCo = await coSoDuLieu.nguoiDung.findUnique({
        where: { email },
      });

      if (taiKhoanDaCo) {
        return res.status(409).json({ thongBao: "Email da ton tai" });
      }

      const matKhauDaMaHoa = await bcrypt.hash(matKhau, 10);

      const taiKhoanMoi = await coSoDuLieu.nguoiDung.create({
        data: {
          hoTen,
          email,
          matKhau: matKhauDaMaHoa,
          vaiTro,
        },
      });

      return res.status(201).json({
        thongBao: "Tao tai khoan thanh cong",
        duLieu: {
          id: taiKhoanMoi.id,
          hoTen: taiKhoanMoi.hoTen,
          email: taiKhoanMoi.email,
          vaiTro: taiKhoanMoi.vaiTro,
        },
      });
    } catch (loi) {
      return res.status(500).json({ thongBao: "Loi tao tai khoan" });
    }
  },
);

duongDan.get(
  "/nhan-vien",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY"),
  async (req, res) => {
    try {
      const danhSach = await coSoDuLieu.nguoiDung.findMany({
        select: {
          id: true,
          hoTen: true,
          email: true,
          vaiTro: true,
          trangThai: true,
          taoLuc: true,
        },
        orderBy: { id: "asc" },
      });
      return res.json(danhSach);
    } catch (loi) {
      return res.status(500).json({ thongBao: "Loi lay danh sach nhan vien" });
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
      if (!["HOAT_DONG", "KHOA"].includes(trangThai)) {
        return res.status(400).json({ thongBao: "Trang thai khong hop le" });
      }
      const da_cap_nhat = await coSoDuLieu.nguoiDung.update({
        where: { id },
        data: { trangThai },
        select: { id: true, hoTen: true, trangThai: true },
      });
      return res.json(da_cap_nhat);
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi cap nhat trang thai" });
    }
  },
);

module.exports = duongDan;
