(function () {
  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const TOKEN_KEY = "staffToken";
  const LOW_STOCK_THRESHOLD = 20;
  const EXPIRING_SOON_DAYS = 30;

  const state = {
    danhSachThuoc: [],
    danhSachDanhMuc: [],
    boLocTrangThai: "all",
    tuKhoa: "",
    dangTai: false,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function khoiTaoPhanTu() {
    els.refreshBtn = $("thuoc-refresh-btn");
    els.addBtn = $("thuoc-add-btn");
    els.tableBody = $("thuoc-table-body");
    els.tableSummary = $("thuoc-table-summary");
    els.tableMeta = $("thuoc-table-meta");
    els.lastSync = $("thuoc-last-sync");
    els.searchInput = $("thuoc-page-search");
    els.statusFilter = $("thuoc-status-filter");
    els.statTotal = $("stat-total-thuoc");
    els.statExpiring = $("stat-expiring-thuoc");
    els.statLowStock = $("stat-low-stock");
    els.statInactive = $("stat-inactive-thuoc");
    els.modal = $("thuoc-modal");
    els.modalTitle = $("thuoc-modal-title");
    els.modalClose = $("thuoc-modal-close");
    els.modalCancel = $("thuoc-modal-cancel");
    els.form = $("thuoc-form");
    els.formMessage = $("thuoc-form-message");
    els.submitBtn = $("thuoc-submit-btn");
    els.inputId = $("thuoc-id");
    els.inputMa = $("thuoc-ma");
    els.inputTen = $("thuoc-ten");
    els.inputHoatChat = $("thuoc-hoat-chat");
    els.inputHamLuong = $("thuoc-ham-luong");
    els.inputDonVi = $("thuoc-don-vi");
    els.inputGiaBan = $("thuoc-gia-ban");
    els.inputDanhMuc = $("thuoc-danh-muc");
    els.inputDanhMucMoi = $("thuoc-danh-muc-moi");
    els.inputCanDon = $("thuoc-can-don");
    els.inputTrangThai = $("thuoc-trang-thai");
    els.inputSoLo = $("thuoc-so-lo");
    els.inputHanSuDung = $("thuoc-han-su-dung");
    els.inputSoLuongTon = $("thuoc-so-luong-ton");
    els.inputGiaNhap = $("thuoc-gia-nhap");
  }

  function layToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function hienThongBao(message, isError = false) {
    const cu = document.getElementById("thuoc-toast");
    if (cu) cu.remove();

    const toast = document.createElement("div");
    toast.id = "thuoc-toast";
    toast.className =
      "fixed top-4 right-4 z-[80] px-4 py-3 rounded-xl text-white font-semibold shadow-xl";
    toast.style.background = isError ? "#ba1a1a" : "#0a7f42";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  async function goiApi(path, options = {}) {
    const token = layToken();
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.thongBao || "Không thể xử lý yêu cầu");
    }

    return payload;
  }

  function dinhDangTien(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
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

  function tinhNgayConLai(value) {
    if (!value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(value);
    expiry.setHours(0, 0, 0, 0);
    return Math.round((expiry - today) / 86400000);
  }

  function rutGonThoiGian(value) {
    if (!value) return "--";
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ngày trước`;
  }

  function tongTonKho(loTonKho = []) {
    return loTonKho.reduce((sum, lo) => sum + Number(lo.soLuongTon || 0), 0);
  }

  function layHanSuDungGanNhat(loTonKho = []) {
    if (!Array.isArray(loTonKho) || !loTonKho.length) return null;
    return (
      loTonKho
        .map((lo) => lo.hanSuDung)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b))[0] || null
    );
  }

  function xacDinhTrangThai(thuoc) {
    const soLuong = tongTonKho(thuoc.loTonKho);
    const soNgay = tinhNgayConLai(layHanSuDungGanNhat(thuoc.loTonKho));

    if (!thuoc.conKinhDoanh) {
      return { nhan: "Ngừng kinh doanh", mau: "bg-slate-100 text-slate-700" };
    }
    if (soNgay !== null && soNgay <= EXPIRING_SOON_DAYS) {
      return { nhan: "Sắp hết hạn", mau: "bg-red-100 text-red-700" };
    }
    if (soLuong <= LOW_STOCK_THRESHOLD) {
      return { nhan: "Tồn kho thấp", mau: "bg-amber-100 text-amber-700" };
    }
    return { nhan: "Đang kinh doanh", mau: "bg-emerald-100 text-emerald-700" };
  }

  function locThuoc() {
    const tuKhoa = state.tuKhoa.trim().toLowerCase();
    return state.danhSachThuoc.filter((thuoc) => {
      const tonKho = tongTonKho(thuoc.loTonKho);
      const soNgay = tinhNgayConLai(layHanSuDungGanNhat(thuoc.loTonKho));
      const khopTuKhoa =
        !tuKhoa ||
        [
          thuoc.maThuoc,
          thuoc.tenThuoc,
          thuoc.hoatChat,
          thuoc.hamLuong,
          thuoc.donViTinh,
          thuoc.danhMucThuoc?.tenDanhMuc,
        ]
          .filter(Boolean)
          .some((item) => String(item).toLowerCase().includes(tuKhoa));

      if (!khopTuKhoa) return false;

      switch (state.boLocTrangThai) {
        case "active":
          return !!thuoc.conKinhDoanh;
        case "inactive":
          return !thuoc.conKinhDoanh;
        case "low-stock":
          return thuoc.conKinhDoanh && tonKho <= LOW_STOCK_THRESHOLD;
        case "expiring":
          return (
            thuoc.conKinhDoanh &&
            soNgay !== null &&
            soNgay <= EXPIRING_SOON_DAYS
          );
        default:
          return true;
      }
    });
  }

  function capNhatThongKe() {
    const danhSach = state.danhSachThuoc;
    const tong = danhSach.length;
    const sapHetHan = danhSach.filter((thuoc) => {
      const soNgay = tinhNgayConLai(layHanSuDungGanNhat(thuoc.loTonKho));
      return (
        thuoc.conKinhDoanh && soNgay !== null && soNgay <= EXPIRING_SOON_DAYS
      );
    }).length;
    const tonKhoThap = danhSach.filter(
      (thuoc) =>
        thuoc.conKinhDoanh && tongTonKho(thuoc.loTonKho) <= LOW_STOCK_THRESHOLD,
    ).length;
    const ngungKinhDoanh = danhSach.filter(
      (thuoc) => !thuoc.conKinhDoanh,
    ).length;
    const capNhatGanNhat = danhSach
      .map((thuoc) => thuoc.capNhatLuc || thuoc.taoLuc)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    els.statTotal.textContent = tong;
    els.statExpiring.textContent = sapHetHan;
    els.statLowStock.textContent = tonKhoThap;
    els.statInactive.textContent = ngungKinhDoanh;
    els.lastSync.textContent = capNhatGanNhat
      ? `Cập nhật gần nhất: ${rutGonThoiGian(capNhatGanNhat)}`
      : "Chưa có dữ liệu thuốc trong hệ thống.";
  }

  function taoDongThuoc(thuoc) {
    const tonKho = tongTonKho(thuoc.loTonKho);
    const hanSuDung = layHanSuDungGanNhat(thuoc.loTonKho);
    const trangThai = xacDinhTrangThai(thuoc);
    const chiTiet = [thuoc.hoatChat, thuoc.hamLuong, thuoc.donViTinh]
      .filter(Boolean)
      .join(" • ");
    const tone = thuoc.conKinhDoanh ? "text-primary/60" : "text-slate-400";

    return `
      <tr class="hover:bg-surface-container transition-colors">
        <td class="px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
              <span class="material-symbols-outlined ${tone}">pill</span>
            </div>
            <div>
              <div class="font-bold text-on-surface text-sm">${thoatHtml(thuoc.tenThuoc)}</div>
              <div class="text-xs text-on-surface-variant">${thoatHtml(thuoc.maThuoc)}${chiTiet ? ` • ${thoatHtml(chiTiet)}` : ""}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-5 text-sm font-medium text-on-surface">${thoatHtml(thuoc.danhMucThuoc?.tenDanhMuc || "Chưa phân loại")}</td>
        <td class="px-4 py-5 text-sm font-semibold text-on-surface">${dinhDangTien(thuoc.giaBan)}</td>
        <td class="px-4 py-5 text-sm">
          <div class="font-bold text-on-surface">${new Intl.NumberFormat("vi-VN").format(tonKho)} ${thoatHtml(thuoc.donViTinh || "")}</div>
          <div class="text-xs text-on-surface-variant">${thuoc.loTonKho?.length || 0} lô tồn kho</div>
        </td>
        <td class="px-4 py-5 text-sm text-on-surface-variant font-medium">${dinhDangNgay(hanSuDung)}</td>
        <td class="px-4 py-5">
          <span class="px-3 py-1 rounded-full text-[11px] font-extrabold ${trangThai.mau}">${trangThai.nhan}</span>
        </td>
        <td class="px-6 py-5">
          <div class="flex justify-end gap-2">
            <button class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" type="button" data-action="edit" data-id="${thuoc.id}" title="Sửa thuốc">
              <span class="material-symbols-outlined text-lg">edit</span>
            </button>
            <button class="p-2 ${thuoc.conKinhDoanh ? "text-error hover:bg-error/5" : "text-emerald-600 hover:bg-emerald-50"} rounded-lg transition-colors" type="button" data-action="toggle-status" data-id="${thuoc.id}" title="${thuoc.conKinhDoanh ? "Ngừng kinh doanh" : "Kích hoạt lại"}">
              <span class="material-symbols-outlined text-lg">${thuoc.conKinhDoanh ? "visibility_off" : "restart_alt"}</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function thoatHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderBangThuoc() {
    const danhSach = locThuoc();

    if (!danhSach.length) {
      els.tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center">
            <div class="inline-flex flex-col items-center gap-3 text-slate-500">
              <span class="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
              <p class="font-semibold">Không có thuốc phù hợp với bộ lọc hiện tại.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      els.tableBody.innerHTML = danhSach.map(taoDongThuoc).join("");
    }

    els.tableSummary.textContent = `Hiển thị ${danhSach.length} / ${state.danhSachThuoc.length} thuốc`;
    els.tableMeta.textContent = state.dangTai
      ? "Đang đồng bộ dữ liệu..."
      : `Danh mục: ${state.danhSachDanhMuc.length} • Bộ lọc: ${moTaBoLoc()}`;
  }

  function moTaBoLoc() {
    switch (state.boLocTrangThai) {
      case "active":
        return "Đang kinh doanh";
      case "inactive":
        return "Ngừng kinh doanh";
      case "low-stock":
        return "Tồn kho thấp";
      case "expiring":
        return "Sắp hết hạn";
      default:
        return "Tất cả";
    }
  }

  function renderDanhMuc() {
    const options = [
      '<option value="">Chọn danh mục</option>',
      ...state.danhSachDanhMuc.map(
        (danhMuc) =>
          `<option value="${danhMuc.id}">${thoatHtml(danhMuc.tenDanhMuc)}</option>`,
      ),
    ];
    els.inputDanhMuc.innerHTML = options.join("");
  }

  function moModal(thuoc = null) {
    els.form.reset();
    els.formMessage.textContent = "";
    els.inputId.value = thuoc?.id || "";
    els.modalTitle.textContent = thuoc ? "Cập nhật thuốc" : "Thêm thuốc mới";
    els.submitBtn.textContent = thuoc ? "Lưu thay đổi" : "Lưu thuốc";

    if (thuoc) {
      els.inputMa.value = thuoc.maThuoc || "";
      els.inputTen.value = thuoc.tenThuoc || "";
      els.inputHoatChat.value = thuoc.hoatChat || "";
      els.inputHamLuong.value = thuoc.hamLuong || "";
      els.inputDonVi.value = thuoc.donViTinh || "";
      els.inputGiaBan.value = Number(thuoc.giaBan || 0);
      els.inputDanhMuc.value = thuoc.danhMucThuocId || "";
      els.inputCanDon.checked = !!thuoc.canDonThuoc;
      els.inputTrangThai.value = String(!!thuoc.conKinhDoanh);
    }

    els.modal.classList.remove("hidden");
    els.modal.classList.add("flex");
  }

  function dongModal() {
    els.modal.classList.add("hidden");
    els.modal.classList.remove("flex");
  }

  async function taiDanhMuc() {
    try {
      state.danhSachDanhMuc = await goiApi("/api/thuoc/danh-muc");
      renderDanhMuc();
    } catch (error) {
      hienThongBao(error.message, true);
    }
  }

  async function taiDanhSachThuoc() {
    state.dangTai = true;
    renderBangThuoc();

    try {
      const danhSach = await goiApi("/api/thuoc");
      state.danhSachThuoc = Array.isArray(danhSach) ? danhSach : [];
      capNhatThongKe();
      renderBangThuoc();
      els.lastSync.textContent = `Cập nhật gần nhất: ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`;
    } catch (error) {
      els.tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-10 text-center text-red-600 font-semibold">${thoatHtml(error.message)}</td>
        </tr>
      `;
      els.tableSummary.textContent = "Không thể tải dữ liệu thuốc.";
      hienThongBao(error.message, true);
    } finally {
      state.dangTai = false;
      renderBangThuoc();
    }
  }

  async function layHoacTaoDanhMuc() {
    const tenMoi = els.inputDanhMucMoi.value.trim();
    if (tenMoi) {
      const danhMucMoi = await goiApi("/api/thuoc/danh-muc", {
        method: "POST",
        body: JSON.stringify({ tenDanhMuc: tenMoi }),
      });
      await taiDanhMuc();
      return Number(danhMucMoi.id);
    }

    const danhMucId = Number(els.inputDanhMuc.value);
    if (!danhMucId) {
      throw new Error("Vui lòng chọn hoặc nhập danh mục thuốc");
    }
    return danhMucId;
  }

  function layDuLieuForm() {
    return {
      maThuoc: els.inputMa.value.trim(),
      tenThuoc: els.inputTen.value.trim(),
      hoatChat: els.inputHoatChat.value.trim() || null,
      hamLuong: els.inputHamLuong.value.trim() || null,
      donViTinh: els.inputDonVi.value.trim(),
      giaBan: Number(els.inputGiaBan.value),
      canDonThuoc: els.inputCanDon.checked,
      conKinhDoanh: els.inputTrangThai.value === "true",
    };
  }

  function layDuLieuLo() {
    const soLo = els.inputSoLo.value.trim();
    const hanSuDung = els.inputHanSuDung.value;
    const soLuongTon = els.inputSoLuongTon.value;
    const giaNhap = els.inputGiaNhap.value;
    const coNhapDuLieu = !!(soLo || hanSuDung || soLuongTon || giaNhap);

    if (!coNhapDuLieu) return null;

    if (!soLo || !hanSuDung || soLuongTon === "" || giaNhap === "") {
      throw new Error(
        "Nếu thêm lô tồn kho, vui lòng nhập đủ số lô, hạn sử dụng, số lượng tồn và giá nhập",
      );
    }

    return {
      soLo,
      hanSuDung,
      soLuongTon: Number(soLuongTon),
      giaNhap: Number(giaNhap),
    };
  }

  async function luuThuoc(event) {
    event.preventDefault();
    els.submitBtn.disabled = true;
    els.submitBtn.classList.add("opacity-70", "cursor-not-allowed");
    els.formMessage.textContent = "Đang lưu dữ liệu...";

    try {
      const danhMucThuocId = await layHoacTaoDanhMuc();
      const duLieuThuoc = {
        ...layDuLieuForm(),
        danhMucThuocId,
      };
      const duLieuLo = layDuLieuLo();
      const id = els.inputId.value;

      if (
        !duLieuThuoc.maThuoc ||
        !duLieuThuoc.tenThuoc ||
        !duLieuThuoc.donViTinh ||
        !duLieuThuoc.giaBan
      ) {
        throw new Error(
          "Vui lòng nhập đầy đủ mã thuốc, tên thuốc, đơn vị tính và giá bán",
        );
      }

      let thuoc;
      if (id) {
        thuoc = await goiApi(`/api/thuoc/${id}`, {
          method: "PATCH",
          body: JSON.stringify(duLieuThuoc),
        });
      } else {
        thuoc = await goiApi("/api/thuoc", {
          method: "POST",
          body: JSON.stringify(duLieuThuoc),
        });
      }

      if (duLieuLo) {
        await goiApi("/api/ton-kho/lo", {
          method: "POST",
          body: JSON.stringify({
            thuocId: thuoc.id,
            ...duLieuLo,
          }),
        });
      }

      hienThongBao(id ? "Cập nhật thuốc thành công" : "Thêm thuốc thành công");
      dongModal();
      await Promise.all([taiDanhMuc(), taiDanhSachThuoc()]);
    } catch (error) {
      els.formMessage.textContent = error.message;
      hienThongBao(error.message, true);
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
      if (!els.formMessage.textContent) {
        els.formMessage.textContent = "";
      }
    }
  }

  async function chuyenTrangThaiThuoc(id) {
    const thuoc = state.danhSachThuoc.find(
      (item) => Number(item.id) === Number(id),
    );
    if (!thuoc) return;

    const thongBao = thuoc.conKinhDoanh
      ? `Ngừng kinh doanh thuốc "${thuoc.tenThuoc}"?`
      : `Kích hoạt lại thuốc "${thuoc.tenThuoc}"?`;

    if (!window.confirm(thongBao)) return;

    try {
      await goiApi(`/api/thuoc/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ conKinhDoanh: !thuoc.conKinhDoanh }),
      });
      hienThongBao("Cập nhật trạng thái thuốc thành công");
      await taiDanhSachThuoc();
    } catch (error) {
      hienThongBao(error.message, true);
    }
  }

  function ganSuKien() {
    els.refreshBtn.addEventListener("click", async () => {
      await Promise.all([taiDanhMuc(), taiDanhSachThuoc()]);
    });

    els.addBtn.addEventListener("click", () => moModal());
    els.modalClose.addEventListener("click", dongModal);
    els.modalCancel.addEventListener("click", dongModal);
    els.modal.addEventListener("click", (event) => {
      if (event.target === els.modal) dongModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dongModal();
    });

    els.searchInput.addEventListener("input", (event) => {
      state.tuKhoa = event.target.value;
      renderBangThuoc();
    });

    els.statusFilter.addEventListener("change", (event) => {
      state.boLocTrangThai = event.target.value;
      renderBangThuoc();
    });

    els.form.addEventListener("submit", luuThuoc);

    els.tableBody.addEventListener("click", (event) => {
      const nut = event.target.closest("button[data-action]");
      if (!nut) return;
      const id = Number(nut.dataset.id);
      const action = nut.dataset.action;

      if (action === "edit") {
        const thuoc = state.danhSachThuoc.find(
          (item) => Number(item.id) === id,
        );
        if (thuoc) moModal(thuoc);
        return;
      }

      if (action === "toggle-status") {
        chuyenTrangThaiThuoc(id);
      }
    });
  }

  async function khoiTaoTrang() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    khoiTaoPhanTu();
    if (!els.tableBody) {
      window.staffPageLoading?.done();
      return;
    }
    ganSuKien();
    try {
      await Promise.all([taiDanhMuc(), taiDanhSachThuoc()]);
    } finally {
      window.staffPageLoading?.done();
    }
  }

  document.addEventListener("DOMContentLoaded", khoiTaoTrang);
})();
