import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const htmlEntries = {
  index: resolve(__dirname, "index.html"),
  danh_muc: resolve(__dirname, "danh_muc.html"),
  chi_tiet: resolve(__dirname, "chi_tiet.html"),
  gio_hang: resolve(__dirname, "gio_hang.html"),
  thanh_toan: resolve(__dirname, "thanh_toan.html"),
  chon_phuong_thuc: resolve(__dirname, "chon_phuong_thuc.html"),
  xac_nhan: resolve(__dirname, "xac_nhan.html"),
  Xac_nhan_don_hang: resolve(__dirname, "Xac_nhan_don_hang.html"),
  dang_nhap: resolve(__dirname, "dang_nhap.html"),
  dang_ky: resolve(__dirname, "dang_ky.html"),
  quen_mat_khau: resolve(__dirname, "quen_mat_khau.html"),
  don_thuoc: resolve(__dirname, "don_thuoc.html"),
  gioi_thieu: resolve(__dirname, "gioi_thieu.html"),
  lien_he: resolve(__dirname, "lien_he.html"),
  cau_hoi_thuong_gap: resolve(__dirname, "cau_hoi_thuong_gap.html"),
  "khach_hang/thong_tin_ca_nhan": resolve(
    __dirname,
    "khach_hang/thong_tin_ca_nhan.html",
  ),
  "khach_hang/don_hang_cua_toi": resolve(
    __dirname,
    "khach_hang/don_hang_cua_toi.html",
  ),
  "khach_hang/chi_tiet_don_hang": resolve(
    __dirname,
    "khach_hang/chi_tiet_don_hang.html",
  ),
};

function copyStandaloneJsFiles(files) {
  return {
    name: "copy-standalone-js-files",
    closeBundle() {
      const distRoot = resolve(__dirname, "dist");
      if (!existsSync(distRoot)) return;

      for (const file of files) {
        const source = resolve(__dirname, file);
        const destination = resolve(distRoot, file);

        if (!existsSync(source)) continue;

        const destinationDir = dirname(destination);
        if (destinationDir && !existsSync(destinationDir)) {
          mkdirSync(destinationDir, { recursive: true });
        }

        copyFileSync(source, destination);
      }
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ""),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
  plugins: [copyStandaloneJsFiles(["cart.js", "products.js"])],
});
