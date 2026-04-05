const jwt = require("jsonwebtoken");

function xacThucTruyCap(req, res, next) {
  const tieuDe = req.headers.authorization;

  if (!tieuDe || !tieuDe.startsWith("Bearer ")) {
    return res.status(401).json({ thongBao: "Thieu token truy cap" });
  }

  const token = tieuDe.split(" ")[1];

  try {
    const duLieu = jwt.verify(token, process.env.KHOA_BI_MAT_JWT);
    req.nguoiDung = duLieu;
    return next();
  } catch (loi) {
    return res.status(401).json({ thongBao: "Token khong hop le" });
  }
}

function yeuCauVaiTro(...danhSachVaiTro) {
  return (req, res, next) => {
    if (!req.nguoiDung) {
      return res.status(401).json({ thongBao: "Chua xac thuc" });
    }

    if (!danhSachVaiTro.includes(req.nguoiDung.vaiTro)) {
      return res.status(403).json({ thongBao: "Khong du quyen" });
    }

    return next();
  };
}

function yeuCauKhachHang(req, res, next) {
  if (!req.nguoiDung) {
    return res.status(401).json({ thongBao: "Chua xac thuc" });
  }

  if (req.nguoiDung.loaiTaiKhoan !== "KHACH_HANG") {
    return res.status(403).json({ thongBao: "Chi danh cho khach hang" });
  }

  return next();
}

module.exports = { xacThucTruyCap, yeuCauVaiTro, yeuCauKhachHang };
