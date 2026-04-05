(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  let danhSach = [];
  let tkDangSua = null;

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("vi-VN") +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const roleLabel = (r) => (r === "QUAN_LY" ? "Quản lý" : "Nhân viên");
  const statusLabel = (s) => (s === "HOAT_DONG" ? "Hoạt động" : "Đã khóa");

  const showToast = (msg, ok = true) => {
    const toast = document.getElementById("tk-toast");
    const icon = document.getElementById("tk-toast-icon");
    const msgEl = document.getElementById("tk-toast-msg");
    icon.textContent = ok ? "check_circle" : "error";
    icon.className = `material-symbols-outlined ${ok ? "text-green-500" : "text-red-500"}`;
    msgEl.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);
  };

  async function taiDanhSach() {
    document.getElementById("tk-count-label").textContent = "Đang tải...";
    document.getElementById("tk-table-body").innerHTML =
      '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-500"><span class="material-symbols-outlined animate-spin text-3xl block mb-2">progress_activity</span>Đang tải dữ liệu...</td></tr>';
    try {
      const res = await fetch(`${API_BASE}/api/xac-thuc/nhan-vien`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      danhSach = await res.json();
      capNhatStats();
      locVaHienThi();
    } catch (err) {
      console.error(err);
      document.getElementById("tk-table-body").innerHTML =
        '<tr><td colspan="5" class="px-6 py-12 text-center text-red-500">Không thể tải dữ liệu</td></tr>';
      document.getElementById("tk-count-label").textContent = "Lỗi tải dữ liệu";
    }
  }

  function capNhatStats() {
    const total = danhSach.length;
    const active = danhSach.filter((x) => x.trangThai === "HOAT_DONG").length;
    const locked = danhSach.filter((x) => x.trangThai === "KHOA").length;
    document.getElementById("tk-stat-total").textContent =
      total.toLocaleString("vi-VN");
    document.getElementById("tk-stat-active").textContent =
      active.toLocaleString("vi-VN");
    document.getElementById("tk-stat-locked").textContent =
      locked.toLocaleString("vi-VN");
  }

  function locVaHienThi() {
    const q = (document.getElementById("tk-search").value || "")
      .toLowerCase()
      .trim();
    const role = document.getElementById("tk-role-filter").value;

    let ds = [...danhSach];
    if (q) {
      ds = ds.filter(
        (x) =>
          (x.hoTen || "").toLowerCase().includes(q) ||
          (x.email || "").toLowerCase().includes(q),
      );
    }
    if (role) {
      ds = ds.filter((x) => x.vaiTro === role);
    }

    renderTable(ds);
    document.getElementById("tk-count-label").textContent =
      `Hiển thị ${ds.length} / ${danhSach.length} nhân sự`;
  }

  function renderTable(ds) {
    const tbody = document.getElementById("tk-table-body");
    if (!ds.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = ds
      .map(
        (u) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4">
            <p class="font-semibold text-sm">${u.hoTen || "—"}</p>
            <p class="text-xs text-slate-500">${u.email || ""}</p>
          </td>
          <td class="px-6 py-4 text-sm">${roleLabel(u.vaiTro)}</td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
              u.trangThai === "HOAT_DONG"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }">${statusLabel(u.trangThai)}</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-500">${fmtDate(u.taoLuc)}</td>
          <td class="px-6 py-4 text-right">
            <button class="tk-lock-btn px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100" data-id="${u.id}">Sửa trạng thái</button>
          </td>
        </tr>
      `,
      )
      .join("");

    tbody.querySelectorAll(".tk-lock-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const user = danhSach.find((x) => x.id === id);
        if (user) moSuaTrangThai(user);
      });
    });
  }

  function moModal() {
    const modal = document.getElementById("tk-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function dongModal() {
    const modal = document.getElementById("tk-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    tkDangSua = null;
  }

  function moTaoMoi() {
    tkDangSua = null;
    document.getElementById("tk-modal-title").textContent = "Thêm nhân viên";
    document.getElementById("tk-create-form").classList.remove("hidden");
    document.getElementById("tk-status-form").classList.add("hidden");
    moModal();
  }

  function moSuaTrangThai(user) {
    tkDangSua = user;
    document.getElementById("tk-modal-title").textContent =
      "Cập nhật trạng thái";
    document.getElementById("tk-create-form").classList.add("hidden");
    document.getElementById("tk-status-form").classList.remove("hidden");
    document.getElementById("tk-status-user").textContent =
      `${user.hoTen} (${user.email})`;
    document.getElementById("tk-status-select").value = user.trangThai;
    moModal();
  }

  async function taoTaiKhoan() {
    const hoTen = document.getElementById("tk-new-name").value.trim();
    const email = document.getElementById("tk-new-email").value.trim();
    const matKhau = document.getElementById("tk-new-password").value.trim();
    const vaiTro = document.getElementById("tk-new-role").value;

    if (!hoTen || !email || !matKhau) {
      showToast("Vui lòng nhập đủ thông tin", false);
      return;
    }

    const btn = document.getElementById("tk-create-save");
    btn.disabled = true;
    btn.textContent = "Đang tạo...";

    try {
      const res = await fetch(`${API_BASE}/api/xac-thuc/tao-tai-khoan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ hoTen, email, matKhau, vaiTro }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.thongBao || "Lỗi tạo tài khoản");
      showToast("Tạo tài khoản thành công");
      dongModal();
      taiDanhSach();
    } catch (err) {
      showToast(err.message || "Lỗi tạo tài khoản", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Tạo tài khoản";
    }
  }

  async function capNhatTrangThai() {
    if (!tkDangSua) return;
    const trangThai = document.getElementById("tk-status-select").value;

    const btn = document.getElementById("tk-status-save");
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
      const res = await fetch(
        `${API_BASE}/api/xac-thuc/${tkDangSua.id}/trang-thai`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ trangThai }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.thongBao || "Lỗi cập nhật");
      showToast("Cập nhật trạng thái thành công");
      dongModal();
      taiDanhSach();
    } catch (err) {
      showToast(err.message || "Lỗi cập nhật", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Cập nhật trạng thái";
    }
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    document
      .getElementById("tk-search")
      .addEventListener("input", locVaHienThi);
    document
      .getElementById("tk-role-filter")
      .addEventListener("change", locVaHienThi);
    document.getElementById("tk-add-btn").addEventListener("click", moTaoMoi);
    document
      .getElementById("tk-modal-close")
      .addEventListener("click", dongModal);
    document.getElementById("tk-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) dongModal();
    });
    document
      .getElementById("tk-create-save")
      .addEventListener("click", taoTaiKhoan);
    document
      .getElementById("tk-status-save")
      .addEventListener("click", capNhatTrangThai);

    try {
      await taiDanhSach();
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
