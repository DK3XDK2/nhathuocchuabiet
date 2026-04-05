(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  let danhSachHoaDon = [];
  let hoaDonDangXem = null;

  const fmt = (n) =>
    Number(n).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("vi-VN") +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const fmtDateShort = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN");
  };

  const pmLabel = (pm) => {
    const map = {
      TIEN_MAT: "Tiền mặt",
      CHUYEN_KHOAN: "Chuyển khoản",
      THE_ATM: "Thẻ ATM",
    };
    return map[pm] || pm;
  };

  const pmIcon = (pm) => {
    const map = {
      TIEN_MAT: "payments",
      CHUYEN_KHOAN: "account_balance",
      THE_ATM: "credit_card",
    };
    return map[pm] || "receipt";
  };

  const isToday = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const showToast = (msg, ok = true) => {
    const toast = document.getElementById("hdl-toast");
    const icon = document.getElementById("hdl-toast-icon");
    const msgEl = document.getElementById("hdl-toast-msg");
    if (!toast) return;
    icon.textContent = ok ? "check_circle" : "error";
    icon.className = `material-symbols-outlined text-xl ${ok ? "text-green-500" : "text-red-500"}`;
    msgEl.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  };

  async function taiHoaDon() {
    document.getElementById("hdl-count-label").textContent = "Đang tải...";
    document.getElementById("hdl-table-body").innerHTML = `
      <tr>
        <td colspan="7" class="py-16 text-center text-outline">
          <span class="material-symbols-outlined animate-spin text-3xl block mb-2">progress_activity</span>
          Đang tải dữ liệu...
        </td>
      </tr>`;
    try {
      const res = await fetch(`${API_BASE}/api/hoa-don`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      danhSachHoaDon = await res.json();
      tinhStats();
      locVaHienThi();
    } catch (err) {
      console.error("Lỗi tải hóa đơn:", err);
      document.getElementById("hdl-count-label").textContent =
        "Lỗi tải dữ liệu";
      document.getElementById("hdl-table-body").innerHTML = `
        <tr><td colspan="7" class="py-20 text-center text-outline">
          <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">error</span>
          Không thể tải dữ liệu. Vui lòng thử lại.
        </td></tr>`;
    }
  }

  function tinhStats() {
    const total = danhSachHoaDon.length;
    const tongDoanhThu = danhSachHoaDon.reduce(
      (s, h) => s + (h.tongTien || 0),
      0,
    );
    const homNay = danhSachHoaDon.filter((h) => isToday(h.taoLuc));
    const tongHomNay = homNay.length;
    const trungBinh = total > 0 ? tongDoanhThu / total : 0;

    const el = (id) => document.getElementById(id);
    if (el("hdl-stat-doanh-thu"))
      el("hdl-stat-doanh-thu").textContent = fmt(tongDoanhThu);
    if (el("hdl-stat-total"))
      el("hdl-stat-total").textContent = total.toLocaleString("vi-VN");
    if (el("hdl-stat-today"))
      el("hdl-stat-today").textContent = tongHomNay.toLocaleString("vi-VN");
    if (el("hdl-stat-avg")) el("hdl-stat-avg").textContent = fmt(trungBinh);
  }

  function locVaHienThi() {
    const search = (document.getElementById("hdl-search")?.value || "")
      .toLowerCase()
      .trim();
    const dateFrom = document.getElementById("hdl-date-from")?.value;
    const dateTo = document.getElementById("hdl-date-to")?.value;
    const pm = document.getElementById("hdl-pm-filter")?.value || "";

    let ds = [...danhSachHoaDon];

    if (search) {
      ds = ds.filter((h) => {
        const id = String(h.id).padStart(5, "0");
        const nv = (h.nguoiTao?.hoTen || "").toLowerCase();
        return `hd-${id}`.includes(search) || nv.includes(search);
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      ds = ds.filter((h) => new Date(h.taoLuc) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      ds = ds.filter((h) => new Date(h.taoLuc) <= to);
    }

    if (pm) {
      ds = ds.filter((h) => h.phuongThucThanhToan === pm);
    }

    hienThiBang(ds);
    document.getElementById("hdl-count-label").textContent =
      `Hiển thị ${ds.length} / ${danhSachHoaDon.length} hóa đơn`;
  }

  function hienThiBang(ds) {
    const tbody = document.getElementById("hdl-table-body");
    if (!tbody) return;

    if (ds.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7" class="py-20 text-center text-outline">
          <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">receipt_long</span>
          Không có hóa đơn nào
        </td></tr>`;
      return;
    }

    tbody.innerHTML = ds
      .map((h) => {
        const idStr = `#HD-${String(h.id).padStart(5, "0")}`;
        const nv = h.nguoiTao?.hoTen || "—";
        const tong = fmt(h.tongTien || 0);
        const icon = pmIcon(h.phuongThucThanhToan);
        const label = pmLabel(h.phuongThucThanhToan);
        return `
        <tr class="hover:bg-surface-container-low/50 transition-colors cursor-pointer" data-id="${h.id}">
          <td class="px-6 py-4 font-mono text-sm font-semibold text-primary">${idStr}</td>
          <td class="px-6 py-4 text-sm text-on-surface">${fmtDate(h.taoLuc)}</td>
          <td class="px-6 py-4 text-sm text-on-surface">${nv}</td>
          <td class="px-6 py-4 text-sm font-semibold text-on-surface">${tong}</td>
          <td class="px-6 py-4 text-sm">
            <span class="inline-flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-base">${icon}</span>${label}
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <span class="material-symbols-outlined text-sm">check_circle</span>Đã thanh toán
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button class="hdl-view-btn px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors" data-id="${h.id}">
              Xem chi tiết
            </button>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("tr[data-id]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest(".hdl-view-btn")) return;
        const id = Number(tr.dataset.id);
        const hd = danhSachHoaDon.find((h) => h.id === id);
        if (hd) moChiTiet(hd);
      });
    });
    tbody.querySelectorAll(".hdl-view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const hd = danhSachHoaDon.find((h) => h.id === id);
        if (hd) moChiTiet(hd);
      });
    });
  }

  function moChiTiet(hd) {
    hoaDonDangXem = hd;
    const modal = document.getElementById("hdl-detail-modal");
    if (!modal) return;

    const idStr = `#HD-${String(hd.id).padStart(5, "0")}`;
    document.getElementById("hdl-detail-title").textContent =
      `Hóa đơn ${idStr}`;
    document.getElementById("hdl-detail-date").textContent = fmtDate(hd.taoLuc);
    document.getElementById("hdl-detail-nhanvien").textContent =
      hd.nguoiTao?.hoTen || "—";
    document.getElementById("hdl-detail-pm").textContent = pmLabel(
      hd.phuongThucThanhToan,
    );

    const items = hd.chiTietHoaDon || [];
    const itemsEl = document.getElementById("hdl-detail-items");
    if (items.length === 0) {
      itemsEl.innerHTML = `<p class="text-sm text-outline text-center py-4">Không có chi tiết</p>`;
    } else {
      itemsEl.innerHTML = items
        .map(
          (ct) => `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-on-surface">${ct.thuoc?.tenThuoc || "Thuốc"}</p>
            <p class="text-xs text-outline">${ct.soLuong} ${ct.donViTinh || "Cái"} × ${fmt(ct.donGia)}</p>
          </div>
          <p class="text-sm font-semibold text-on-surface">${fmt(ct.thanhTien)}</p>
        </div>`,
        )
        .join("");
    }

    document.getElementById("hdl-detail-tong").textContent = fmt(
      hd.tongTien || 0,
    );

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function dongModal() {
    const modal = document.getElementById("hdl-detail-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  function xuatCSV() {
    const rows = [
      ["Mã hóa đơn", "Ngày lập", "Nhân viên", "Phương thức", "Tổng tiền"],
      ...danhSachHoaDon.map((h) => [
        `#HD-${String(h.id).padStart(5, "0")}`,
        fmtDateShort(h.taoLuc),
        h.nguoiTao?.hoTen || "",
        pmLabel(h.phuongThucThanhToan),
        h.tongTien || 0,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoa_don_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất file CSV thành công");
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    document
      .getElementById("hdl-search")
      ?.addEventListener("input", locVaHienThi);
    document
      .getElementById("hdl-date-from")
      ?.addEventListener("change", locVaHienThi);
    document
      .getElementById("hdl-date-to")
      ?.addEventListener("change", locVaHienThi);
    document
      .getElementById("hdl-pm-filter")
      ?.addEventListener("change", locVaHienThi);

    document
      .getElementById("hdl-clear-filter")
      ?.addEventListener("click", () => {
        const el = (id) => document.getElementById(id);
        if (el("hdl-search")) el("hdl-search").value = "";
        if (el("hdl-date-from")) el("hdl-date-from").value = "";
        if (el("hdl-date-to")) el("hdl-date-to").value = "";
        if (el("hdl-pm-filter")) el("hdl-pm-filter").value = "";
        locVaHienThi();
      });

    document
      .getElementById("hdl-export-btn")
      ?.addEventListener("click", xuatCSV);

    document.getElementById("hdl-new-btn")?.addEventListener("click", () => {
      window.location.href = "lap_hoa_don.html";
    });

    document
      .getElementById("hdl-detail-close")
      ?.addEventListener("click", dongModal);
    document
      .getElementById("hdl-detail-modal")
      ?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) dongModal();
      });

    try {
      await taiHoaDon();
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
