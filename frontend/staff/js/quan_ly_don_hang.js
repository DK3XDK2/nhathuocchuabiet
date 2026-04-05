(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  let danhSachDonHang = [];
  let donHangDangXem = null;
  let tabHienTai = "";

  const fmt = (n) =>
    Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN");
  };

  const STATUS_LABELS = {
    MOI_TAO: "Mới tạo",
    DA_XAC_NHAN: "Đã xác nhận",
    DANG_GIAO: "Đang giao",
    HOAN_TAT: "Hoàn tất",
    HUY: "Đã hủy",
  };

  const STATUS_COLORS = {
    MOI_TAO: "bg-blue-100 text-blue-700",
    DA_XAC_NHAN: "bg-indigo-100 text-indigo-700",
    DANG_GIAO: "bg-amber-100 text-amber-700",
    HOAN_TAT: "bg-emerald-100 text-emerald-700",
    HUY: "bg-red-100 text-red-700",
  };

  const showToast = (msg, ok = true) => {
    const toast = document.getElementById("dh-toast");
    const icon = document.getElementById("dh-toast-icon");
    const msgEl = document.getElementById("dh-toast-msg");
    if (!toast) return;
    icon.textContent = ok ? "check_circle" : "error";
    icon.className = `material-symbols-outlined text-xl ${ok ? "text-green-500" : "text-red-500"}`;
    msgEl.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  };

  async function taiDonHang() {
    document.getElementById("dh-count-label").textContent = "Đang tải...";
    document.getElementById("dh-table-body").innerHTML = `
      <tr>
        <td colspan="6" class="py-16 text-center text-outline">
          <span class="material-symbols-outlined animate-spin text-3xl block mb-2">progress_activity</span>
          Đang tải dữ liệu...
        </td>
      </tr>`;
    try {
      const res = await fetch(`${API_BASE}/api/don-hang/quan-ly`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      danhSachDonHang = await res.json();
      tinhStats();
      locVaHienThi();
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      document.getElementById("dh-count-label").textContent = "Lỗi tải dữ liệu";
      document.getElementById("dh-table-body").innerHTML = `
        <tr><td colspan="6" class="py-20 text-center text-outline">
          <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">error</span>
          Không thể tải dữ liệu. Vui lòng thử lại.
        </td></tr>`;
    }
  }

  function tinhStats() {
    const total = danhSachDonHang.length;
    const pending = danhSachDonHang.filter(
      (d) =>
        d.trangThai === "MOI_TAO" ||
        d.trangThai === "DA_XAC_NHAN" ||
        d.trangThai === "DANG_GIAO",
    ).length;
    const done = danhSachDonHang.filter(
      (d) => d.trangThai === "HOAN_TAT",
    ).length;
    const cancelled = danhSachDonHang.filter(
      (d) => d.trangThai === "HUY",
    ).length;

    const el = (id) => document.getElementById(id);
    if (el("dh-stat-total"))
      el("dh-stat-total").textContent = total.toLocaleString("vi-VN");
    if (el("dh-stat-pending"))
      el("dh-stat-pending").textContent = pending.toLocaleString("vi-VN");
    if (el("dh-stat-done"))
      el("dh-stat-done").textContent = done.toLocaleString("vi-VN");
    if (el("dh-stat-cancelled"))
      el("dh-stat-cancelled").textContent = cancelled.toLocaleString("vi-VN");
  }

  function locVaHienThi() {
    const search = (document.getElementById("dh-search")?.value || "")
      .toLowerCase()
      .trim();

    let ds = [...danhSachDonHang];

    if (tabHienTai) {
      ds = ds.filter((d) => d.trangThai === tabHienTai);
    }

    if (search) {
      ds = ds.filter((d) => {
        const ma = (d.maDonHang || "").toLowerCase();
        const kh = (d.tenNguoiNhan || "").toLowerCase();
        const sdt = (d.soDienThoaiNhan || "").toLowerCase();
        return (
          ma.includes(search) || kh.includes(search) || sdt.includes(search)
        );
      });
    }

    hienThiBang(ds);
    document.getElementById("dh-count-label").textContent =
      `Hiển thị ${ds.length} / ${danhSachDonHang.length} đơn hàng`;
  }

  function hienThiBang(ds) {
    const tbody = document.getElementById("dh-table-body");
    if (!tbody) return;

    if (ds.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="py-20 text-center text-outline">
          <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">shopping_cart</span>
          Không có đơn hàng nào
        </td></tr>`;
      return;
    }

    tbody.innerHTML = ds
      .map((d) => {
        const colorClass =
          STATUS_COLORS[d.trangThai] || "bg-slate-100 text-slate-600";
        const label = STATUS_LABELS[d.trangThai] || d.trangThai;
        const initials = (d.tenNguoiNhan || "KH").slice(0, 2).toUpperCase();
        return `
        <tr class="hover:bg-surface-container-highest/20 transition-colors">
          <td class="px-8 py-5">
            <span class="font-bold text-sm text-primary font-mono">${d.maDonHang || `#DH-${d.id}`}</span>
          </td>
          <td class="px-8 py-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-xs font-bold text-primary">${initials}</div>
              <div>
                <p class="text-sm font-bold text-on-surface">${d.tenNguoiNhan || "—"}</p>
                <p class="text-[10px] text-on-surface-variant">${d.soDienThoaiNhan || ""}</p>
              </div>
            </div>
          </td>
          <td class="px-8 py-5 text-sm text-on-surface-variant">${fmtDate(d.taoLuc)}</td>
          <td class="px-8 py-5 text-sm font-bold text-on-surface">${fmt(d.tongThanhToan || 0)}</td>
          <td class="px-8 py-5">
            <span class="px-3 py-1 rounded-full text-[10px] font-bold ${colorClass} flex items-center gap-1 w-fit">
              <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>${label}
            </span>
          </td>
          <td class="px-8 py-5 text-right">
            <button class="dh-view-btn text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" data-id="${d.id}">
              Xem / Sửa
            </button>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".dh-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const don = danhSachDonHang.find((d) => d.id === id);
        if (don) moChiTiet(don);
      });
    });
  }

  function moChiTiet(don) {
    donHangDangXem = don;
    const modal = document.getElementById("dh-modal");
    if (!modal) return;

    document.getElementById("dh-modal-title").textContent =
      don.maDonHang || `#DH-${don.id}`;
    document.getElementById("dh-modal-sub").textContent =
      `Ngày đặt: ${fmtDate(don.taoLuc)}`;
    document.getElementById("dh-modal-kh").textContent =
      don.tenNguoiNhan || "—";
    document.getElementById("dh-modal-sdt").textContent =
      don.soDienThoaiNhan || "—";
    document.getElementById("dh-modal-dia-chi").textContent =
      don.diaChiGiao || "—";
    document.getElementById("dh-modal-phi-ship").textContent = fmt(
      don.phiGiaoHang || 0,
    );
    document.getElementById("dh-modal-tong").textContent = fmt(
      don.tongThanhToan || 0,
    );

    const items = don.chiTietDonHang || [];
    const itemsEl = document.getElementById("dh-modal-items");
    itemsEl.innerHTML =
      items.length === 0
        ? `<p class="text-sm text-outline text-center py-2">Không có chi tiết sản phẩm</p>`
        : items
            .map(
              (ct) => `
          <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
            <div>
              <p class="text-sm font-medium text-on-surface">${ct.thuoc?.tenThuoc || "Thuốc"}</p>
              <p class="text-xs text-outline">SL: ${ct.soLuong} × ${fmt(ct.donGia)}</p>
            </div>
            <p class="text-sm font-semibold">${fmt(ct.thanhTien)}</p>
          </div>`,
            )
            .join("");

    const select = document.getElementById("dh-modal-status-select");
    if (select) select.value = don.trangThai;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function dongModal() {
    const modal = document.getElementById("dh-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    donHangDangXem = null;
  }

  async function capNhatTrangThai() {
    if (!donHangDangXem) return;
    const select = document.getElementById("dh-modal-status-select");
    const trangThai = select?.value;
    if (!trangThai) return;

    const btn = document.getElementById("dh-modal-save");
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
      const res = await fetch(
        `${API_BASE}/api/don-hang/${donHangDangXem.id}/trang-thai`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ trangThai }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.thongBao || "Lỗi cập nhật");
      }

      const idx = danhSachDonHang.findIndex((d) => d.id === donHangDangXem.id);
      if (idx >= 0) danhSachDonHang[idx].trangThai = trangThai;

      dongModal();
      tinhStats();
      locVaHienThi();
      showToast("Cập nhật trạng thái thành công");
    } catch (err) {
      showToast(err.message || "Lỗi cập nhật", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Xác nhận thay đổi";
    }
  }

  function khoiDongTabs() {
    const tabs = document.getElementById("dh-status-tabs");
    if (!tabs) return;
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".dh-tab-btn");
      if (!btn) return;
      tabHienTai = btn.dataset.status;

      tabs.querySelectorAll(".dh-tab-btn").forEach((b) => {
        b.classList.toggle("bg-white", b === btn);
        b.classList.toggle("shadow-sm", b === btn);
        b.classList.toggle("text-primary", b === btn);
        b.classList.toggle("text-on-surface-variant", b !== btn);
      });

      locVaHienThi();
    });
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    document
      .getElementById("dh-search")
      ?.addEventListener("input", locVaHienThi);

    document
      .getElementById("dh-modal-close")
      ?.addEventListener("click", dongModal);
    document.getElementById("dh-modal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) dongModal();
    });
    document
      .getElementById("dh-modal-save")
      ?.addEventListener("click", capNhatTrangThai);

    khoiDongTabs();
    try {
      await taiDonHang();
    } finally {
      window.staffPageLoading?.done();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
