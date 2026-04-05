const { coSoDuLieu } = require("../config/database");

async function ghiNhatKy(
  nguoiThucHienId,
  hanhDong,
  doiTuong,
  doiTuongId,
  truocThayDoi,
  sauThayDoi,
  loaiTacNhan = "USER",
) {
  await coSoDuLieu.nhatKyHeThong.create({
    data: {
      nguoiThucHienId,
      loaiTacNhan,
      hanhDong,
      doiTuong,
      doiTuongId,
      truocThayDoi,
      sauThayDoi,
    },
  });
}

module.exports = { ghiNhatKy };
