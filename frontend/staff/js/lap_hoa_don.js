(function () {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = localStorage.getItem("staffToken");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let danhSachThuoc = [];
  let gioHang = [];
  let phuongThuc = "TIEN_MAT";
  let thuocDangChon = null;

  const $ = (id) => document.getElementById(id);

  function fmt(n) {
    return Number(n).toLocaleString("vi-VN") + " đ";
  }

  function hienThongBao(msg, loai = "success") {
    let toast = document.getElementById("hd-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hd-toast";
      toast.className = "fixed bottom-6 right-6 z-50 hidden";
      toast.innerHTML = `<div class="bg-on-surface text-surface px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-3">
        <span id="hd-toast-icon" class="material-symbols-outlined text-base"></span>
        <span id="hd-toast-msg"></span></div>`;
      document.body.appendChild(toast);
    }
    document.getElementById("hd-toast-icon").textContent =
      loai === "success" ? "check_circle" : "error";
    document.getElementById("hd-toast-msg").textContent = msg;
    toast.className =
      "fixed bottom-20 right-6 z-50 " +
      (loai === "success" ? "" : "text-error");
    toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.add("hidden"), 3500);
  }

  function sinhMaGD() {
    const n = Math.floor(Math.random() * 99999) + 1;
    const el = $("hd-ma-gd");
    if (el) el.textContent = `#HD-${String(n).padStart(5, "0")}`;
  }

  async function taiThuoc() {
    try {
      const res = await fetch(`${API_BASE}/api/thuoc`, { headers });
      if (!res.ok) return;
      danhSachThuoc = (await res.json()).filter((t) => t.conKinhDoanh);
    } catch {}
  }

  let _searchTimer;
  function timKiem(query) {
    const container = $("hd-search-results");
    if (!container) return;
    if (!query.trim()) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }
    const q = query.toLowerCase();
    const results = danhSachThuoc
      .filter(
        (t) =>
          t.tenThuoc.toLowerCase().includes(q) ||
          t.maThuoc.toLowerCase().includes(q),
      )
      .slice(0, 8);

    if (!results.length) {
      container.innerHTML = `<div class="p-4 text-sm text-on-surface-variant text-center">Không tìm thấy thuốc phù hợp</div>`;
      container.classList.remove("hidden");
      return;
    }

    container.innerHTML = results
      .map((t) => {
        const tonKho = (t.loTonKho || []).reduce(
          (s, l) => s + (l.soLuongTon || 0),
          0,
        );
        return `
      <div class="search-item p-3 border-b border-slate-50 hover:bg-surface-container-low cursor-pointer flex justify-between items-center transition-colors" data-id="${t.id}">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-lg">medication</span>
          </div>
          <div>
            <p class="font-bold text-on-surface text-sm">${t.tenThuoc}</p>
            <p class="text-xs text-outline">${t.maThuoc} • ${t.donViTinh} • Kho: ${tonKho}</p>
          </div>
        </div>
        <p class="font-bold text-primary text-sm">${fmt(t.giaBan)}</p>
      </div>`;
      })
      .join("");

    container.querySelectorAll(".search-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = Number(item.dataset.id);
        thuocDangChon = danhSachThuoc.find((t) => t.id === id) || null;
        $("hd-search-input").value = thuocDangChon
          ? thuocDangChon.tenThuoc
          : "";
        container.classList.add("hidden");
        $("hd-qty-input")?.focus();
      });
    });

    container.classList.remove("hidden");
  }

  function themVaoGio() {
    if (!thuocDangChon) {
      hienThongBao("Chọn thuốc trước khi thêm", "error");
      return;
    }
    const qty = parseInt($("hd-qty-input")?.value || 1, 10);
    if (!qty || qty < 1) {
      hienThongBao("Số lượng không hợp lệ", "error");
      return;
    }

    const existing = gioHang.find((i) => i.thuoc.id === thuocDangChon.id);
    if (existing) {
      existing.soLuong += qty;
    } else {
      gioHang.push({ thuoc: thuocDangChon, soLuong: qty });
    }

    $("hd-search-input").value = "";
    $("hd-qty-input").value = 1;
    thuocDangChon = null;
    $("hd-search-results").classList.add("hidden");

    hienThiGio();
    $("hd-search-input")?.focus();
  }

  function xoaKhoiGio(thuocId) {
    gioHang = gioHang.filter((i) => i.thuoc.id !== thuocId);
    hienThiGio();
  }

  function capNhatSoLuong(thuocId, delta) {
    const item = gioHang.find((i) => i.thuoc.id === thuocId);
    if (!item) return;
    item.soLuong = Math.max(1, item.soLuong + delta);
    hienThiGio();
  }

  function xoaTatCa() {
    gioHang = [];
    hienThiGio();
  }

  function tinhTong() {
    return gioHang.reduce(
      (sum, item) => sum + Number(item.thuoc.giaBan) * item.soLuong,
      0,
    );
  }

  function hienThiGio() {
    const tbody = $("hd-cart-body");
    const emptyRow = $("hd-cart-empty-row");
    if (!tbody) return;

    tbody.querySelectorAll(".cart-row").forEach((r) => r.remove());

    if (!gioHang.length) {
      if (emptyRow) emptyRow.style.display = "";
      $("hd-cart-count").textContent = "Giỏ hàng trống";
      $("hd-subtotal").textContent = "0 đ";
      $("hd-subtotal-label").textContent = "Tạm tính (0 mặt hàng)";
      $("hd-tong-cong").textContent = "0 đ";
      return;
    }

    if (emptyRow) emptyRow.style.display = "none";
    $("hd-cart-count").textContent = `Sản phẩm đã chọn (${gioHang.length})`;

    gioHang.forEach((item) => {
      const thanhTien = Number(item.thuoc.giaBan) * item.soLuong;
      const tr = document.createElement("tr");
      tr.className =
        "cart-row hover:bg-surface-container-low transition-colors";
      tr.dataset.thuocId = item.thuoc.id;
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary">medication</span>
            </div>
            <div>
              <p class="font-bold text-on-surface text-sm">${item.thuoc.tenThuoc}</p>
              <p class="text-xs text-outline">${item.thuoc.maThuoc} • ${item.thuoc.donViTinh}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-center gap-2">
            <button class="btn-minus w-8 h-8 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:bg-white font-bold">−</button>
            <span class="font-bold w-8 text-center">${item.soLuong}</span>
            <button class="btn-plus w-8 h-8 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center hover:bg-white font-bold">+</button>
          </div>
        </td>
        <td class="px-6 py-4 text-right font-medium text-on-surface-variant text-sm">${fmt(item.thuoc.giaBan)}</td>
        <td class="px-6 py-4 text-right font-bold text-on-surface text-sm">${fmt(thanhTien)}</td>
        <td class="px-6 py-4 text-center">
          <button class="btn-remove text-outline-variant hover:text-error transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </td>`;

      tr.querySelector(".btn-minus").addEventListener("click", () =>
        capNhatSoLuong(item.thuoc.id, -1),
      );
      tr.querySelector(".btn-plus").addEventListener("click", () =>
        capNhatSoLuong(item.thuoc.id, +1),
      );
      tr.querySelector(".btn-remove").addEventListener("click", () =>
        xoaKhoiGio(item.thuoc.id),
      );

      tbody.appendChild(tr);
    });

    const tong = tinhTong();
    $("hd-subtotal").textContent = fmt(tong);
    $("hd-subtotal-label").textContent =
      `Tạm tính (${gioHang.length} mặt hàng)`;
    $("hd-tong-cong").textContent = fmt(tong);
  }

  function chonPhuongThuc(pm) {
    phuongThuc = pm;
    document.querySelectorAll(".hd-pm-btn").forEach((btn) => {
      const isActive = btn.dataset.pm === pm;
      btn.className = btn.className
        .replace(
          /border-primary bg-primary\/5/g,
          "border-transparent bg-surface",
        )
        .replace(
          /border-transparent bg-surface/g,
          "border-transparent bg-surface",
        );
      if (isActive) {
        btn.classList.remove("border-transparent", "bg-surface");
        btn.classList.add("border-primary", "bg-primary/5");
        btn.querySelector("span.material-symbols-outlined").className =
          "material-symbols-outlined text-primary";
        btn.querySelector("span.text-\\[10px\\]").className =
          "text-[10px] font-bold mt-1 text-primary";
      } else {
        btn.querySelector("span.material-symbols-outlined").className =
          "material-symbols-outlined text-outline";
        btn.querySelector("span.text-\\[10px\\]").className =
          "text-[10px] font-bold mt-1 text-outline";
      }
    });
  }

  async function thanhToan() {
    if (!gioHang.length) {
      hienThongBao("Giỏ hàng trống!", "error");
      return;
    }

    const btn = $("hd-thanh-toan-btn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Đang xử lý...`;
    }

    const chiTiet = gioHang.map((item) => ({
      thuocId: item.thuoc.id,
      soLuong: item.soLuong,
      donViTinh: item.thuoc.donViTinh,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/hoa-don`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phuongThucThanhToan: phuongThuc,
          chiTiet,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.thongBao || "Lỗi không xác định");
      }

      const hoaDon = await res.json();
      hienThongBao(
        `Thanh toán thành công! Hóa đơn #HD-${String(hoaDon.id).padStart(5, "0")}`,
        "success",
      );

      xoaTatCa();
      sinhMaGD();
    } catch (e) {
      hienThongBao("Lỗi thanh toán: " + e.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> THANH TOÁN (F12)`;
      }
    }
  }

  async function khoiTao() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    sinhMaGD();

    const searchInput = $("hd-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(() => timKiem(e.target.value), 200);
      });
      searchInput.addEventListener("blur", () => {
        setTimeout(() => {
          $("hd-search-results")?.classList.add("hidden");
        }, 200);
      });
    }

    $("hd-add-btn")?.addEventListener("click", themVaoGio);

    $("hd-qty-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") themVaoGio();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "F12") {
        e.preventDefault();
        thanhToan();
      }
      if (e.key === "F2") {
        e.preventDefault();
        $("hd-search-input")?.focus();
      }
    });

    $("hd-clear-btn")?.addEventListener("click", () => {
      if (gioHang.length && confirm("Xóa toàn bộ giỏ hàng?")) xoaTatCa();
    });

    document.querySelectorAll(".hd-pm-btn").forEach((btn) => {
      btn.addEventListener("click", () => chonPhuongThuc(btn.dataset.pm));
    });

    $("hd-thanh-toan-btn")?.addEventListener("click", thanhToan);

    try {
      await taiThuoc();
      hienThiGio();
    } finally {
      window.staffPageLoading?.done();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", khoiTao);
  } else {
    khoiTao();
  }
})();
