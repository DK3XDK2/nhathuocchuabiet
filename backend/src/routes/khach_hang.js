const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { coSoDuLieu } = require("../config/database");
const {
  xacThucTruyCap,
  yeuCauKhachHang,
  yeuCauVaiTro,
} = require("../middleware/xac_thuc");

const duongDan = express.Router();

duongDan.get(
  "/quan-ly",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    const danhSachKhachHang = await coSoDuLieu.khachHang.findMany({
      select: {
        id: true,
        hoTen: true,
        email: true,
        soDienThoai: true,
        diaChi: true,
        taoLuc: true,
        _count: {
          select: {
            donHang: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return res.json(danhSachKhachHang);
  },
);

duongDan.post(
  "/quan-ly",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    try {
      const { hoTen, email, soDienThoai, diaChi, matKhau } = req.body;

      if (!hoTen || !email || !soDienThoai || !matKhau) {
        return res
          .status(400)
          .json({ thongBao: "Thieu du lieu tao khach hang" });
      }

      const khachDaCo = await coSoDuLieu.khachHang.findFirst({
        where: {
          OR: [{ email }, { soDienThoai }],
        },
      });

      if (khachDaCo) {
        return res
          .status(409)
          .json({ thongBao: "Email hoac so dien thoai da ton tai" });
      }

      const matKhauDaMaHoa = await bcrypt.hash(matKhau, 10);

      const khachMoi = await coSoDuLieu.khachHang.create({
        data: {
          hoTen,
          email,
          soDienThoai,
          diaChi,
          matKhau: matKhauDaMaHoa,
        },
        select: {
          id: true,
          hoTen: true,
          email: true,
          soDienThoai: true,
          diaChi: true,
          taoLuc: true,
        },
      });

      return res.status(201).json({
        thongBao: "Tao khach hang thanh cong",
        duLieu: khachMoi,
      });
    } catch (loi) {
      return res.status(500).json({ thongBao: "Loi tao khach hang" });
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

      if (!id) {
        return res.status(400).json({ thongBao: "Id khach hang khong hop le" });
      }

      const { hoTen, email, soDienThoai, diaChi, matKhau } = req.body;
      const duLieuCapNhat = {};

      if (typeof hoTen === "string") duLieuCapNhat.hoTen = hoTen;
      if (typeof email === "string") duLieuCapNhat.email = email;
      if (typeof soDienThoai === "string")
        duLieuCapNhat.soDienThoai = soDienThoai;
      if (typeof diaChi === "string") duLieuCapNhat.diaChi = diaChi;

      if (typeof matKhau === "string" && matKhau.trim()) {
        duLieuCapNhat.matKhau = await bcrypt.hash(matKhau, 10);
      }

      if (Object.keys(duLieuCapNhat).length === 0) {
        return res
          .status(400)
          .json({ thongBao: "Khong co du lieu de cap nhat" });
      }

      if (duLieuCapNhat.email || duLieuCapNhat.soDienThoai) {
        const dieuKienXungDot = [];
        if (duLieuCapNhat.email) {
          dieuKienXungDot.push({ email: duLieuCapNhat.email });
        }
        if (duLieuCapNhat.soDienThoai) {
          dieuKienXungDot.push({ soDienThoai: duLieuCapNhat.soDienThoai });
        }

        const banGhiXungDot = await coSoDuLieu.khachHang.findFirst({
          where: {
            id: { not: id },
            OR: dieuKienXungDot,
          },
        });

        if (banGhiXungDot) {
          return res
            .status(409)
            .json({ thongBao: "Email hoac so dien thoai da ton tai" });
        }
      }

      const khachHang = await coSoDuLieu.khachHang.update({
        where: { id },
        data: duLieuCapNhat,
        select: {
          id: true,
          hoTen: true,
          email: true,
          soDienThoai: true,
          diaChi: true,
          taoLuc: true,
          capNhatLuc: true,
        },
      });

      return res.json({
        thongBao: "Cap nhat khach hang thanh cong",
        duLieu: khachHang,
      });
    } catch (loi) {
      return res.status(400).json({ thongBao: "Loi cap nhat khach hang" });
    }
  },
);

duongDan.get(
  "/:id/lich-su-mua-hang",
  xacThucTruyCap,
  yeuCauVaiTro("QUAN_LY", "NHAN_VIEN"),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ thongBao: "Id khach hang khong hop le" });
    }

    const khachHang = await coSoDuLieu.khachHang.findUnique({
      where: { id },
      select: {
        id: true,
        hoTen: true,
        email: true,
        soDienThoai: true,
        diaChi: true,
        donHang: {
          include: {
            chiTietDonHang: {
              include: {
                thuoc: true,
              },
            },
          },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!khachHang) {
      return res.status(404).json({ thongBao: "Khong tim thay khach hang" });
    }

    return res.json({
      khachHang: {
        id: khachHang.id,
        hoTen: khachHang.hoTen,
        email: khachHang.email,
        soDienThoai: khachHang.soDienThoai,
        diaChi: khachHang.diaChi,
      },
      lichSuMuaHang: khachHang.donHang,
    });
  },
);

duongDan.post("/dang-ky", async (req, res) => {
  try {
    const { hoTen, email, soDienThoai, diaChi, matKhau } = req.body;

    if (!hoTen || !email || !soDienThoai || !matKhau) {
      return res.status(400).json({ thongBao: "Thieu du lieu dang ky" });
    }

    const khachDaCo = await coSoDuLieu.khachHang.findFirst({
      where: {
        OR: [{ email }, { soDienThoai }],
      },
    });

    if (khachDaCo) {
      return res
        .status(409)
        .json({ thongBao: "Email hoac so dien thoai da ton tai" });
    }

    const matKhauDaMaHoa = await bcrypt.hash(matKhau, 10);

    const khachMoi = await coSoDuLieu.khachHang.create({
      data: {
        hoTen,
        email,
        soDienThoai,
        diaChi,
        matKhau: matKhauDaMaHoa,
      },
    });

    return res.status(201).json({
      thongBao: "Dang ky thanh cong",
      duLieu: {
        id: khachMoi.id,
        hoTen: khachMoi.hoTen,
        email: khachMoi.email,
        soDienThoai: khachMoi.soDienThoai,
      },
    });
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi dang ky khach hang" });
  }
});

duongDan.post("/dang-nhap", async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
      return res.status(400).json({ thongBao: "Thieu email hoac mat khau" });
    }

    const khachHang = await coSoDuLieu.khachHang.findUnique({
      where: { email },
    });

    if (!khachHang) {
      return res
        .status(401)
        .json({ thongBao: "Thong tin dang nhap khong dung" });
    }

    const dungMatKhau = await bcrypt.compare(matKhau, khachHang.matKhau);

    if (!dungMatKhau) {
      return res
        .status(401)
        .json({ thongBao: "Thong tin dang nhap khong dung" });
    }

    const token = jwt.sign(
      {
        id: khachHang.id,
        email: khachHang.email,
        loaiTaiKhoan: "KHACH_HANG",
      },
      process.env.KHOA_BI_MAT_JWT,
      { expiresIn: "7d" },
    );

    return res.json({
      thongBao: "Dang nhap thanh cong",
      token,
      khachHang: {
        id: khachHang.id,
        hoTen: khachHang.hoTen,
        email: khachHang.email,
        soDienThoai: khachHang.soDienThoai,
        diaChi: khachHang.diaChi,
      },
    });
  } catch (loi) {
    return res.status(500).json({ thongBao: "Loi dang nhap khach hang" });
  }
});

duongDan.get(
  "/thong-tin",
  xacThucTruyCap,
  yeuCauKhachHang,
  async (req, res) => {
    const khachHang = await coSoDuLieu.khachHang.findUnique({
      where: { id: req.nguoiDung.id },
      select: {
        id: true,
        hoTen: true,
        email: true,
        soDienThoai: true,
        diaChi: true,
        taoLuc: true,
      },
    });

    if (!khachHang) {
      return res.status(404).json({ thongBao: "Khong tim thay khach hang" });
    }

    return res.json(khachHang);
  },
);

module.exports = duongDan;
