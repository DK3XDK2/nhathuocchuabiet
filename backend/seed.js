const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Bắt đầu seeding database...\n");

    const staffAccounts = [
      {
        hoTen: "Admin Quản Lý",
        email: "admin@nhathuochuabiett.vn",
        matKhau: "123456",
        vaiTro: "QUAN_LY",
      },
      {
        hoTen: "Nhân Viên Bán Hàng",
        email: "nhanvien@nhathuochuabiett.vn",
        matKhau: "123456",
        vaiTro: "NHAN_VIEN",
      },
    ];

    for (const account of staffAccounts) {
      const hashedPassword = await bcrypt.hash(account.matKhau, 10);

      const existingUser = await prisma.nguoiDung.findUnique({
        where: { email: account.email },
      });

      if (existingUser) {
        console.log(`✓ Tài khoản "${account.email}" đã tồn tại`);
        continue;
      }

      const user = await prisma.nguoiDung.create({
        data: {
          hoTen: account.hoTen,
          email: account.email,
          matKhau: hashedPassword,
          vaiTro: account.vaiTro,
          trangThai: "HOAT_DONG",
        },
      });

      console.log(`✓ Tạo tài khoản thành công:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Mật khẩu: ${account.matKhau}`);
      console.log(`  Vai trò: ${user.vaiTro}\n`);
    }

    console.log("✅ Hoàn thành seeding!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
