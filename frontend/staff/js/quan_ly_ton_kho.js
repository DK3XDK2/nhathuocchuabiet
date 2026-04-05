(function () {
  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const TOKEN_KEY = "staffToken";
  const LOW_STOCK_THRESHOLD = 20;
  const EXPIRING_SOON_DAYS = 30;

  const state = {
    danhSachLo: [],
    danhSachThuoc: [],
    tuKhoa: "",
    danhMuc: "all",
    trangThai: "all",
    sapXep: "newest",
    dangTai: false,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function khoiTaoPhanTu() {
    els.exportBtn = $("ton-kho-export-btn");
    els.refreshBtn = $("ton-kho-refresh-btn");
    els.addBtn = $("ton-kho-add-btn");
    els.summaryStatus = $("ton-kho-summary-status");
    els.statLo = $("ton-kho-stat-lo");
    els.statLow = $("ton-kho-stat-low");
    els.statExpiring = $("ton-kho-stat-expiring");
    els.statTotalQty = $("ton-kho-stat-total-qty");
    els.searchInput = $("ton-kho-search");
    els.categoryFilter = $("ton-kho-category-filter");
    els.statusFilter = $("ton-kho-status-filter");
    els.sortFilter = $("ton-kho-sort");
    els.lastSync = $("ton-kho-last-sync");
    els.tableBody = $("ton-kho-table-body");
    els.summary = $("ton-kho-summary");
    els.meta = $("ton-kho-meta");
    els.modal = $("ton-kho-modal");
    els.modalTitle = $("ton-kho-modal-title");
    els.modalClose = $("ton-kho-modal-close");
    els.modalCancel = $("ton-kho-cancel-btn");
    els.form = $("ton-kho-form");
    els.formMessage = $("ton-kho-form-message");
    els.submitBtn = $("ton-kho-submit-btn");
    els.inputId = $("ton-kho-id");
    els.inputThuoc = $("ton-kho-thuoc");
    els.inputSoLo = $("ton-kho-so-lo");
    els.inputHanSuDung = $("ton-kho-han-su-dung");
    els.inputSoLuong = $("ton-kho-so-luong");
    els.inputGiaNhap = $("ton-kho-gia-nhap");
  }

  function layToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function hienThongBao(message, isError = false) {
    const cu = document.getElementById("ton-kho-toast");
    if (cu) cu.remove();
    const toast = document.createElement("div");
    toast.id = "ton-kho-toast";
    toast.className =
      "fixed top-4 right-4 z-[80] px-4 py-3 rounded-xl text-white font-semibold shadow-xl";
    toast.style.background = isError ? "#ba1a1a" : "#0a7f42";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  async function goiApi(path, options = {}) {
    const token = layToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.thongBao || "Không thể xử lý yêu cầu");
    }
    return payload;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function dinhDangTien(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function dinhDangSo(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  }

  function dinhDangNgay(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("vi-VN").format(date);
  }

  function dinhDangNgayInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }

  function soNgayConLai(value) {
    if (!value) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(value);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  }

  function trangThaiLo(lo) {
    const ngay = soNgayConLai(lo.hanSuDung);
    if (ngay !== null && ngay < 0) {
      return {
        key: "expired",
        label: "Đã hết hạn",
        className: "text-red-700",
        dot: "bg-red-700",
        row: "bg-red-50/40",
      };
    }
    if (ngay !== null && ngay <= EXPIRING_SOON_DAYS) {
      return {
        key: "expiring",
        label: "Sắp hết hạn",
        className: "text-tertiary",
        dot: "bg-tertiary",
        row: "bg-orange-50/40",
      };
    }
    if (Number(lo.soLuongTon || 0) <= LOW_STOCK_THRESHOLD) {
      return {
        key: "low-stock",
        label: "Sắp hết hàng",
        className: "text-error",
        dot: "bg-error",
        row: "bg-red-50/30",
      };
    }
    return {
      key: "stable",
      label: "Ổn định",
      className: "text-green-600",
      dot: "bg-green-600",
      row: "",
    };
  }

  function capNhatThongKe() {
    const danhSach = state.danhSachLo;
    const low = danhSach.filter(
      (lo) => Number(lo.soLuongTon || 0) <= LOW_STOCK_THRESHOLD,
    ).length;
    const expiring = danhSach.filter((lo) => {
      const ngay = soNgayConLai(lo.hanSuDung);
      return ngay !== null && ngay >= 0 && ngay <= EXPIRING_SOON_DAYS;
    }).length;
    const totalQty = danhSach.reduce(
      (sum, lo) => sum + Number(lo.soLuongTon || 0),
      0,
    );

    els.statLo.textContent = dinhDangSo(danhSach.length);
    els.statLow.textContent = dinhDangSo(low);
    els.statExpiring.textContent = dinhDangSo(expiring);
    els.statTotalQty.textContent = dinhDangSo(totalQty);
    els.summaryStatus.textContent = state.dangTai
      ? "Đang đồng bộ"
      : "Đã đồng bộ";
  }

  function renderDanhSachThuoc() {
    const options = ['<option value="">Chọn thuốc</option>'].concat(
      state.danhSachThuoc.map(
        (thuoc) =>
          `<option value="${thuoc.id}">${escapeHtml(thuoc.maThuoc)} - ${escapeHtml(thuoc.tenThuoc)}</option>`,
      ),
    );
    els.inputThuoc.innerHTML = options.join("");
  }

  function renderBoLocDanhMuc() {
    const danhMucMap = new Map();
    state.danhSachLo.forEach((lo) => {
      const dm = lo.thuoc?.danhMucThuoc;
      if (dm?.id) danhMucMap.set(dm.id, dm.tenDanhMuc);
    });

    const options = ['<option value="all">Nhóm thuốc: Tất cả</option>'].concat(
      Array.from(danhMucMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1], "vi"))
        .map(
          ([id, ten]) => `<option value="${id}">${escapeHtml(ten)}</option>`,
        ),
    );

    els.categoryFilter.innerHTML = options.join("");
    els.categoryFilter.value = state.danhMuc;
  }

  function danhSachDaLoc() {
    const keyword = state.tuKhoa.trim().toLowerCase();
    const filtered = state.danhSachLo.filter((lo) => {
      const dmId = String(lo.thuoc?.danhMucThuoc?.id || "");
      const status = trangThaiLo(lo).key;
      const matchedKeyword =
        !keyword ||
        [
          lo.soLo,
          lo.thuoc?.maThuoc,
          lo.thuoc?.tenThuoc,
          lo.thuoc?.hoatChat,
          lo.thuoc?.danhMucThuoc?.tenDanhMuc,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      if (!matchedKeyword) return false;
      if (state.danhMuc !== "all" && dmId !== state.danhMuc) return false;
      if (state.trangThai !== "all" && status !== state.trangThai) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (state.sapXep) {
        case "expiry-asc":
          return new Date(a.hanSuDung) - new Date(b.hanSuDung);
        case "quantity-asc":
          return Number(a.soLuongTon || 0) - Number(b.soLuongTon || 0);
        case "name-asc":
          return String(a.thuoc?.tenThuoc || "").localeCompare(
            String(b.thuoc?.tenThuoc || ""),
            "vi",
          );
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    return filtered;
  }

  function taoDong(lo) {
    const status = trangThaiLo(lo);
    return `
      <tr class="hover:bg-surface-container-low transition-colors group ${status.row}">
        <td class="px-6 py-5">
          <div>
            <p class="font-bold text-on-surface text-sm">${escapeHtml(lo.thuoc?.tenThuoc || "Không rõ thuốc")}</p>
            <p class="text-[11px] text-outline">${escapeHtml(lo.thuoc?.maThuoc || "--")}</p>
          </div>
        </td>
        <td class="px-6 py-5 font-mono text-xs text-on-surface-variant">${escapeHtml(lo.soLo)}</td>
        <td class="px-6 py-5"><span class="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">${escapeHtml(lo.thuoc?.danhMucThuoc?.tenDanhMuc || "Chưa phân loại")}</span></td>
        <td class="px-6 py-5 font-bold ${Number(lo.soLuongTon || 0) <= LOW_STOCK_THRESHOLD ? "text-error" : "text-on-surface"}">${dinhDangSo(lo.soLuongTon)}</td>
        <td class="px-6 py-5 text-sm">${escapeHtml(lo.thuoc?.donViTinh || "--")}</td>
        <td class="px-6 py-5 text-sm ${status.key === "expired" ? "text-error font-bold" : ""}">${dinhDangNgay(lo.hanSuDung)}</td>
        <td class="px-6 py-5 text-sm font-semibold">${dinhDangTien(lo.giaNhap)}</td>
        <td class="px-6 py-5">
          <span class="flex items-center gap-1.5 ${status.className} font-bold text-[10px]">
            <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>
            ${status.label}
          </span>
        </td>
        <td class="px-6 py-5 text-right">
          <button class="p-2 hover:bg-white rounded-lg transition-all text-outline hover:text-primary" type="button" data-action="edit" data-id="${lo.id}">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </td>
      </tr>
    `;
  }

  function renderBang() {
    const danhSach = danhSachDaLoc();

    if (!danhSach.length) {
      els.tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="px-6 py-12 text-center">
            <div class="inline-flex flex-col items-center gap-3 text-slate-500">
              <span class="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
              <p class="font-semibold">Không có lô tồn kho phù hợp.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      els.tableBody.innerHTML = danhSach.map(taoDong).join("");
    }

    els.summary.textContent = `Hiển thị ${danhSach.length} / ${state.danhSachLo.length} lô tồn kho`;
    els.meta.textContent = state.dangTai
      ? "Đang đồng bộ dữ liệu..."
      : `Danh mục: ${els.categoryFilter.options.length - 1} • Bộ lọc: ${moTaTrangThai()}`;
  }

  function moTaTrangThai() {
    switch (state.trangThai) {
      case "stable":
        return "Ổn định";
      case "low-stock":
        return "Sắp hết hàng";
      case "expiring":
        return "Sắp hết hạn";
      case "expired":
        return "Đã hết hạn";
      default:
        return "Tất cả";
    }
  }

  async function taiDuLieu() {
    state.dangTai = true;
    capNhatThongKe();
    renderBang();

    try {
      const [danhSachLo, danhSachThuoc] = await Promise.all([
        goiApi("/api/ton-kho/lo"),
        goiApi("/api/thuoc"),
      ]);
      state.danhSachLo = Array.isArray(danhSachLo) ? danhSachLo : [];
      state.danhSachThuoc = Array.isArray(danhSachThuoc) ? danhSachThuoc : [];
      renderDanhSachThuoc();
      renderBoLocDanhMuc();
      capNhatThongKe();
      renderBang();
      els.lastSync.textContent = `Cập nhật gần nhất: ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`;
    } catch (error) {
      els.tableBody.innerHTML = `<tr><td colspan="9" class="px-6 py-10 text-center text-red-600 font-semibold">${escapeHtml(error.message)}</td></tr>`;
      els.summary.textContent = "Không thể tải dữ liệu tồn kho.";
      hienThongBao(error.message, true);
    } finally {
      state.dangTai = false;
      capNhatThongKe();
      renderBang();
    }
  }

  function moModal(lo = null) {
    els.form.reset();
    els.formMessage.textContent = "";
    els.inputId.value = lo?.id || "";
    els.modalTitle.textContent = lo ? "Cập nhật lô tồn kho" : "Nhập kho mới";
    els.submitBtn.textContent = lo ? "Lưu thay đổi" : "Lưu lô kho";

    if (lo) {
      els.inputThuoc.value = lo.thuocId || "";
      els.inputSoLo.value = lo.soLo || "";
      els.inputHanSuDung.value = dinhDangNgayInput(lo.hanSuDung);
      els.inputSoLuong.value = Number(lo.soLuongTon || 0);
      els.inputGiaNhap.value = Number(lo.giaNhap || 0);
    }

    els.modal.classList.remove("hidden");
    els.modal.classList.add("flex");
  }

  function dongModal() {
    els.modal.classList.add("hidden");
    els.modal.classList.remove("flex");
  }

  async function luuLo(event) {
    event.preventDefault();
    els.submitBtn.disabled = true;
    els.submitBtn.classList.add("opacity-70", "cursor-not-allowed");
    els.formMessage.textContent = "Đang lưu dữ liệu...";

    try {
      const duLieu = {
        thuocId: Number(els.inputThuoc.value),
        soLo: els.inputSoLo.value.trim(),
        hanSuDung: els.inputHanSuDung.value,
        soLuongTon: Number(els.inputSoLuong.value),
        giaNhap: Number(els.inputGiaNhap.value),
      };

      if (!duLieu.thuocId || !duLieu.soLo || !duLieu.hanSuDung) {
        throw new Error("Vui lòng nhập đầy đủ thuốc, số lô và hạn sử dụng");
      }

      const id = els.inputId.value;
      await goiApi(id ? `/api/ton-kho/lo/${id}` : "/api/ton-kho/lo", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(duLieu),
      });

      hienThongBao(id ? "Cập nhật lô kho thành công" : "Nhập kho thành công");
      dongModal();
      await taiDuLieu();
    } catch (error) {
      els.formMessage.textContent = error.message;
      hienThongBao(error.message, true);
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  }

  function xuatCsv() {
    const danhSach = danhSachDaLoc();
    if (!danhSach.length) {
      hienThongBao("Không có dữ liệu để xuất", true);
      return;
    }

    const rows = [
      [
        "Tên thuốc",
        "Mã thuốc",
        "Số lô",
        "Danh mục",
        "Số lượng",
        "Đơn vị",
        "Hạn sử dụng",
        "Giá nhập",
        "Trạng thái",
      ],
      ...danhSach.map((lo) => [
        lo.thuoc?.tenThuoc || "",
        lo.thuoc?.maThuoc || "",
        lo.soLo || "",
        lo.thuoc?.danhMucThuoc?.tenDanhMuc || "",
        lo.soLuongTon || 0,
        lo.thuoc?.donViTinh || "",
        dinhDangNgay(lo.hanSuDung),
        Number(lo.giaNhap || 0),
        trangThaiLo(lo).label,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function ganSuKien() {
    els.refreshBtn.addEventListener("click", taiDuLieu);
    els.exportBtn.addEventListener("click", xuatCsv);
    els.addBtn.addEventListener("click", () => moModal());
    els.modalClose.addEventListener("click", dongModal);
    els.modalCancel.addEventListener("click", dongModal);
    els.modal.addEventListener("click", (event) => {
      if (event.target === els.modal) dongModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dongModal();
    });
    els.form.addEventListener("submit", luuLo);

    els.searchInput.addEventListener("input", (event) => {
      state.tuKhoa = event.target.value;
      renderBang();
    });
    els.categoryFilter.addEventListener("change", (event) => {
      state.danhMuc = event.target.value;
      renderBang();
    });
    els.statusFilter.addEventListener("change", (event) => {
      state.trangThai = event.target.value;
      renderBang();
    });
    els.sortFilter.addEventListener("change", (event) => {
      state.sapXep = event.target.value;
      renderBang();
    });

    els.tableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='edit']");
      if (!button) return;
      const lo = state.danhSachLo.find(
        (item) => Number(item.id) === Number(button.dataset.id),
      );
      if (lo) moModal(lo);
    });
  }

  async function khoiTao() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    khoiTaoPhanTu();
    if (!els.tableBody) {
      window.staffPageLoading?.done();
      return;
    }
    ganSuKien();
    try {
      await taiDuLieu();
    } finally {
      window.staffPageLoading?.done();
    }
  }

  document.addEventListener("DOMContentLoaded", khoiTao);
})();
