(function () {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = localStorage.getItem("staffToken");
  const vaiTro = localStorage.getItem("staffRole");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let danhSachDon = [];
  let danhSachThuoc = [];
  let donDangXem = null;

  const $ = (id) => document.getElementById(id);
  const tableBody = $("dt-table-body");
  const emptyState = $("dt-empty-state");
  const countLabel = $("dt-count-label");
  const statTotal = $("dt-stat-total");
  const statPending = $("dt-stat-pending");
  const statApproved = $("dt-stat-approved");
  const statRejected = $("dt-stat-rejected");

  function hienThongBao(msg, loai = "success") {
    const toast = $("dt-toast");
    $("dt-toast-msg").textContent = msg;
    $("dt-toast-icon").textContent =
      loai === "success" ? "check_circle" : "error";
    toast.className =
      "fixed bottom-6 right-6 z-50 " +
      (loai === "success" ? "text-green-600" : "text-error");
    toast.firstElementChild.className =
      "bg-on-surface text-surface px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-3";
    toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  function formatDate(str) {
    if (!str) return "--";
    const d = new Date(str);
    return (
      d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function trangThaiBadge(tt) {
    const map = {
      MOI_TAO: {
        cls: "bg-amber-50 text-amber-700 border-amber-100",
        dot: "bg-amber-500",
        label: "Chờ duyệt",
      },
      DA_DUYET: {
        cls: "bg-green-50 text-green-700 border-green-100",
        dot: "bg-green-500",
        label: "Đã duyệt",
      },
      TU_CHOI: {
        cls: "bg-red-50 text-red-700 border-red-100",
        dot: "bg-red-500",
        label: "Từ chối",
      },
    };
    const { cls, dot, label } = map[tt] || map["MOI_TAO"];
    return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cls}">
      <span class="w-1.5 h-1.5 rounded-full ${dot} mr-2"></span>${label}
    </span>`;
  }

  function initials(name) {
    if (!name) return "?";
    return name
      .trim()
      .split(" ")
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  const avatarColors = [
    "bg-primary-container text-primary",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-slate-100 text-slate-700",
    "bg-rose-100 text-rose-700",
  ];
  function avatarColor(id) {
    return avatarColors[id % avatarColors.length];
  }

  async function taiDonThuoc() {
    tableBody.innerHTML = `<tr><td colspan="5" class="px-8 py-10 text-center text-on-surface-variant text-sm">
      <span class="material-symbols-outlined animate-spin text-2xl block mb-2">progress_activity</span>Đang tải...</td></tr>`;
    emptyState.classList.add("hidden");
    countLabel.textContent = "Đang tải...";

    try {
      const res = await fetch(`${API_BASE}/api/don-thuoc`, { headers });
      if (!res.ok) throw new Error(await res.text());
      danhSachDon = await res.json();
      capNhatThongKe();
      locVaHienThi();
    } catch (e) {
      hienThongBao("Lỗi tải danh sách đơn thuốc", "error");
      tableBody.innerHTML = `<tr><td colspan="5" class="px-8 py-10 text-center text-error text-sm">Không thể tải dữ liệu.</td></tr>`;
    }
  }

  function capNhatThongKe() {
    const total = danhSachDon.length;
    const pending = danhSachDon.filter((d) => d.trangThai === "MOI_TAO").length;
    const approved = danhSachDon.filter(
      (d) => d.trangThai === "DA_DUYET",
    ).length;
    const rejected = danhSachDon.filter(
      (d) => d.trangThai === "TU_CHOI",
    ).length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statApproved.textContent = approved;
    statRejected.textContent = rejected;
  }

  function locVaHienThi() {
    const search = ($("dt-search").value || "").toLowerCase().trim();
    const status = $("dt-status-filter").value;

    let filtered = danhSachDon.filter((don) => {
      const matchStatus = !status || don.trangThai === status;
      const haystack = [
        don.tenBenhNhan || "",
        don.tenBacSi || "",
        String(don.id),
      ]
        .join(" ")
        .toLowerCase();
      const matchSearch = !search || haystack.includes(search);
      return matchStatus && matchSearch;
    });

    hienThiDanhSach(filtered);
    countLabel.textContent = `Hiển thị ${filtered.length} / ${danhSachDon.length} đơn thuốc`;
  }

  function hienThiDanhSach(list) {
    tableBody.innerHTML = "";

    if (!list.length) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    list.forEach((don, idx) => {
      const thuocNames =
        (don.chiTietDonThuoc || [])
          .map((ct) => ct.thuoc?.tenThuoc || "?")
          .join(", ") || "Chưa có thuốc";
      const dem = (don.chiTietDonThuoc || []).length;

      const tr = document.createElement("tr");
      tr.className =
        idx % 2 === 0
          ? "hover:bg-surface-container-low transition-colors"
          : "bg-surface-container-low/20 hover:bg-surface-container-low transition-colors";
      tr.innerHTML = `
        <td class="px-8 py-5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${avatarColor(don.id)} flex items-center justify-center font-bold text-sm">
              ${initials(don.tenBenhNhan || "?")}
            </div>
            <div>
              <div class="font-bold text-on-surface">${don.tenBenhNhan || "(Không tên)"}</div>
              <div class="text-[11px] text-slate-500">ID: #DT-${String(don.id).padStart(5, "0")}</div>
            </div>
          </div>
        </td>
        <td class="px-8 py-5">
          <div class="flex flex-col gap-1">
            <div class="font-medium text-on-surface text-sm line-clamp-1">
              ${thuocNames.length > 50 ? thuocNames.slice(0, 50) + "…" : thuocNames}
            </div>
            <div class="text-[11px] text-slate-500">${dem} thuốc • BS: ${don.tenBacSi || "--"}</div>
          </div>
        </td>
        <td class="px-8 py-5 text-on-surface-variant text-sm">${formatDate(don.taoLuc)}</td>
        <td class="px-8 py-5">${trangThaiBadge(don.trangThai)}</td>
        <td class="px-8 py-5 text-right">
          <button class="btn-xem-chi-tiet px-4 py-2 bg-surface-container-low text-primary font-bold text-xs rounded-lg hover:bg-primary hover:text-white transition-all" data-id="${don.id}">
            Xem chi tiết
          </button>
        </td>`;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll(".btn-xem-chi-tiet").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const don = danhSachDon.find((d) => d.id === id);
        if (don) moChiTiet(don);
      });
    });
  }

  function moChiTiet(don) {
    donDangXem = don;

    $("dt-detail-title").textContent =
      `Đơn thuốc #DT-${String(don.id).padStart(5, "0")}`;
    $("dt-detail-subtitle").textContent =
      `Trạng thái: ${{ MOI_TAO: "Chờ duyệt", DA_DUYET: "Đã duyệt", TU_CHOI: "Từ chối" }[don.trangThai] || don.trangThai}`;
    $("dt-detail-benh-nhan").textContent = don.tenBenhNhan || "(Không tên)";
    $("dt-detail-bac-si").textContent = don.tenBacSi || "(Không có)";
    $("dt-detail-ngay-tao").textContent = formatDate(don.taoLuc);
    $("dt-detail-nguoi-tao").textContent = don.nguoiTao
      ? `${don.nguoiTao.hoTen} (${don.nguoiTao.email})`
      : "--";

    const listEl = $("dt-detail-thuoc-list");
    const chis = don.chiTietDonThuoc || [];
    if (!chis.length) {
      listEl.innerHTML = `<p class="text-sm text-on-surface-variant">Chưa có thuốc nào.</p>`;
    } else {
      listEl.innerHTML = chis
        .map(
          (ct) => `
        <div class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low">
          <div>
            <p class="font-semibold text-sm text-on-surface">${ct.thuoc?.tenThuoc || "?"}</p>
            <p class="text-[11px] text-on-surface-variant">Mã: ${ct.thuoc?.maThuoc || "--"} • ĐVT: ${ct.thuoc?.donViTinh || "--"}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-sm text-primary">SL: ${ct.soLuong}</p>
            <p class="text-[11px] text-on-surface-variant">${ct.lieuDung}</p>
          </div>
        </div>`,
        )
        .join("");
    }

    const isQuanLy = vaiTro === "QUAN_LY";
    const isPending = don.trangThai === "MOI_TAO";
    $("dt-btn-approve").classList.toggle("hidden", !(isQuanLy && isPending));
    $("dt-btn-reject").classList.toggle("hidden", !(isQuanLy && isPending));

    $("dt-detail-modal").classList.remove("hidden");
  }

  function dongChiTiet() {
    $("dt-detail-modal").classList.add("hidden");
    donDangXem = null;
  }

  async function capNhatTrangThai(trangThai) {
    if (!donDangXem) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/don-thuoc/${donDangXem.id}/trang-thai`,
        { method: "PATCH", headers, body: JSON.stringify({ trangThai }) },
      );
      if (!res.ok) throw new Error(await res.text());
      hienThongBao(
        trangThai === "DA_DUYET"
          ? "Đã duyệt đơn thuốc!"
          : "Đã từ chối đơn thuốc.",
        trangThai === "DA_DUYET" ? "success" : "error",
      );
      dongChiTiet();
      await taiDonThuoc();
    } catch {
      hienThongBao("Lỗi cập nhật trạng thái", "error");
    }
  }

  async function taiDanhSachThuocChoTao() {
    try {
      const res = await fetch(`${API_BASE}/api/thuoc`, { headers });
      if (!res.ok) return;
      danhSachThuoc = await res.json();
    } catch {}
  }

  function thuocOptions(selectedId) {
    return danhSachThuoc
      .filter((t) => t.conKinhDoanh)
      .map(
        (t) =>
          `<option value="${t.id}" ${t.id === selectedId ? "selected" : ""}>${t.tenThuoc} (${t.donViTinh})</option>`,
      )
      .join("");
  }

  function themDongThuoc() {
    const rows = $("dt-thuoc-rows");
    const idx = rows.children.length;
    const div = document.createElement("div");
    div.className = "dt-thuoc-row grid grid-cols-12 gap-2 items-start";
    div.innerHTML = `
      <div class="col-span-4">
        <select class="dt-thuoc-id w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">-- Chọn thuốc --</option>
          ${thuocOptions()}
        </select>
      </div>
      <div class="col-span-2">
        <input type="number" min="1" value="1" placeholder="SL" class="dt-so-luong w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <div class="col-span-5">
        <input type="text" placeholder="Liều dùng (VD: 2 viên/ngày)" class="dt-lieu-dung w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <div class="col-span-1 flex items-center justify-center pt-1">
        <button type="button" class="btn-remove-row p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors">
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </div>`;
    div
      .querySelector(".btn-remove-row")
      .addEventListener("click", () => div.remove());
    rows.appendChild(div);
  }

  function moTaoMoi() {
    $("dt-new-benh-nhan").value = "";
    $("dt-new-bac-si").value = "";
    $("dt-thuoc-rows").innerHTML = "";
    themDongThuoc(); // default 1 row
    $("dt-create-modal").classList.remove("hidden");
  }

  function dongTaoMoi() {
    $("dt-create-modal").classList.add("hidden");
  }

  async function luuDonThuoc() {
    const tenBenhNhan = $("dt-new-benh-nhan").value.trim();
    const tenBacSi = $("dt-new-bac-si").value.trim();

    const chiTiet = [];
    $("dt-thuoc-rows")
      .querySelectorAll(".dt-thuoc-row")
      .forEach((row) => {
        const thuocId = Number(row.querySelector(".dt-thuoc-id").value);
        const soLuong = Number(row.querySelector(".dt-so-luong").value);
        const lieuDung = row.querySelector(".dt-lieu-dung").value.trim();
        if (thuocId && soLuong > 0 && lieuDung) {
          chiTiet.push({ thuocId, soLuong, lieuDung });
        }
      });

    if (!chiTiet.length) {
      hienThongBao("Vui lòng thêm ít nhất 1 thuốc hợp lệ", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/don-thuoc`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tenBenhNhan: tenBenhNhan || undefined,
          tenBacSi: tenBacSi || undefined,
          chiTiet,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      hienThongBao("Tạo đơn thuốc thành công!");
      dongTaoMoi();
      await taiDonThuoc();
    } catch {
      hienThongBao("Lỗi tạo đơn thuốc", "error");
    }
  }

  async function khoiTao() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    ["dt-search", "dt-status-filter"].forEach((id) => {
      $(id)?.addEventListener("input", locVaHienThi);
      $(id)?.addEventListener("change", locVaHienThi);
    });

    $("dt-refresh-btn")?.addEventListener("click", taiDonThuoc);

    $("dt-add-btn")?.addEventListener("click", moTaoMoi);

    $("dt-detail-close")?.addEventListener("click", dongChiTiet);
    $("dt-detail-modal")?.addEventListener("click", (e) => {
      if (e.target === $("dt-detail-modal")) dongChiTiet();
    });

    $("dt-btn-approve")?.addEventListener("click", () =>
      capNhatTrangThai("DA_DUYET"),
    );
    $("dt-btn-reject")?.addEventListener("click", () =>
      capNhatTrangThai("TU_CHOI"),
    );

    $("dt-create-close")?.addEventListener("click", dongTaoMoi);
    $("dt-create-cancel")?.addEventListener("click", dongTaoMoi);
    $("dt-create-modal")?.addEventListener("click", (e) => {
      if (e.target === $("dt-create-modal")) dongTaoMoi();
    });
    $("dt-add-thuoc-row")?.addEventListener("click", themDongThuoc);
    $("dt-create-save")?.addEventListener("click", luuDonThuoc);

    try {
      await Promise.all([taiDonThuoc(), taiDanhSachThuocChoTao()]);
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
