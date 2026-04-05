(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  const fmt = (n) =>
    Number(n || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const fetchJson = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const todayKey = () => new Date().toDateString();

  function renderRevenueChart(dsHoaDon) {
    const areaEl = document.getElementById("db-chart-area");
    const currentEl = document.getElementById("db-chart-current");
    const previousEl = document.getElementById("db-chart-previous");
    const pointsEl = document.getElementById("db-chart-points");
    const labelsWrap = document.getElementById("db-chart-labels");
    if (!areaEl || !currentEl || !previousEl || !pointsEl || !labelsWrap) {
      return;
    }

    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentWeekDates = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - index));
      return d;
    });
    const previousWeekDates = currentWeekDates.map(
      (d) => new Date(d.getTime() - 7 * DAY_MS),
    );

    const dayLabel = (date) => {
      const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return map[date.getDay()] || "";
    };

    const keyFor = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const doanhThuTheoNgay = new Map();
    (dsHoaDon || []).forEach((hoaDon) => {
      const date = new Date(hoaDon.taoLuc);
      if (Number.isNaN(date.getTime())) return;
      const key = keyFor(date);
      const prev = Number(doanhThuTheoNgay.get(key) || 0);
      doanhThuTheoNgay.set(key, prev + Number(hoaDon.tongTien || 0));
    });

    const currentValues = currentWeekDates.map((d) =>
      Number(doanhThuTheoNgay.get(keyFor(d)) || 0),
    );
    const previousValues = previousWeekDates.map((d) =>
      Number(doanhThuTheoNgay.get(keyFor(d)) || 0),
    );

    const maxValue = Math.max(1, ...currentValues, ...previousValues);
    const w = 700;
    const h = 200;
    const topPad = 15;
    const bottomPad = 15;

    const toPoint = (value, index, count) => {
      const x = count <= 1 ? 0 : (index * w) / (count - 1);
      const ratio = value / maxValue;
      const y = h - bottomPad - ratio * (h - topPad - bottomPad);
      return { x, y };
    };

    const makeLinePath = (values) =>
      values
        .map((v, i) => {
          const { x, y } = toPoint(v, i, values.length);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");

    const linePathCurrent = makeLinePath(currentValues);
    const linePathPrev = makeLinePath(previousValues);

    const areaClose = `L${w},${h} L0,${h} Z`;
    areaEl.setAttribute("d", `${linePathCurrent} ${areaClose}`);
    currentEl.setAttribute("d", linePathCurrent);
    previousEl.setAttribute("d", linePathPrev);

    pointsEl.innerHTML = currentValues
      .map((v, i) => {
        const { x, y } = toPoint(v, i, currentValues.length);
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" fill="white" stroke="#0053db" stroke-width="2"></circle>`;
      })
      .join("");

    labelsWrap.innerHTML = currentWeekDates
      .map((d) => `<span>${dayLabel(d)}</span>`)
      .join("");
  }

  function renderLowStock(dsLo) {
    const wrap = document.getElementById("db-low-stock-list");
    if (!wrap) return;

    const low = (dsLo || [])
      .map((x) => ({
        ten: x.thuoc?.tenThuoc || x.tenThuoc || "Thuốc",
        ton: Number(x.soLuongTon ?? x.soLuong ?? 0),
      }))
      .sort((a, b) => a.ton - b.ton)
      .slice(0, 5);

    document.getElementById("db-stat-outstock").textContent = low
      .filter((x) => x.ton <= 0)
      .length.toLocaleString("vi-VN");

    if (!low.length) {
      wrap.innerHTML =
        '<div class="text-sm text-slate-400">Không có dữ liệu tồn kho</div>';
      return;
    }

    wrap.innerHTML = low
      .map((x) => {
        const badge = x.ton <= 0 ? "OUT" : x.ton <= 10 ? "LOW" : "OK";
        const badgeCls =
          x.ton <= 0
            ? "text-error bg-error/10"
            : x.ton <= 10
              ? "text-amber-600 bg-amber-50"
              : "text-emerald-600 bg-emerald-50";
        return `
        <div class="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-slate-100">
          <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm"><span class="material-symbols-outlined text-error">pill</span></div>
          <div class="flex-1">
            <p class="text-sm font-bold text-on-surface">${x.ten}</p>
            <p class="text-xs text-on-surface-variant">Còn lại: ${x.ton}</p>
          </div>
          <div class="text-right"><span class="text-[10px] font-bold px-2 py-1 rounded ${badgeCls}">${badge}</span></div>
        </div>`;
      })
      .join("");
  }

  function renderRecentInvoices(dsHoaDon) {
    const tbody = document.getElementById("db-recent-invoices-body");
    if (!tbody) return;
    const ds = [...(dsHoaDon || [])].slice(0, 5);

    if (!ds.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-8 py-10 text-center text-slate-400">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = ds
      .map((h) => {
        const initials = (h.khachHang?.hoTen || h.khachHang?.ten || "KH")
          .slice(0, 2)
          .toUpperCase();
        const products = (h.chiTietHoaDon || [])
          .slice(0, 2)
          .map((ct) => `${ct.thuoc?.tenThuoc || "Thuốc"} (x${ct.soLuong})`)
          .join(", ");
        return `
        <tr class="hover:bg-surface-container-low transition-colors group">
          <td class="px-8 py-5 text-sm font-bold text-primary">#HD${String(h.id).padStart(5, "0")}</td>
          <td class="px-8 py-5"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">${initials}</div><span class="text-sm font-medium text-on-surface">${h.khachHang?.hoTen || "Khách lẻ"}</span></div></td>
          <td class="px-8 py-5 text-sm text-slate-500">${new Date(h.taoLuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</td>
          <td class="px-8 py-5 text-sm text-on-surface-variant">${products || "—"}</td>
          <td class="px-8 py-5 text-sm font-bold text-on-surface text-right">${fmt(h.tongTien)}</td>
          <td class="px-8 py-5 text-center"><span class="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">HOÀN TẤT</span></td>
        </tr>`;
      })
      .join("");
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    try {
      const [hoaDon, donThuoc, tonKho] = await Promise.all([
        fetchJson("/api/hoa-don"),
        fetchJson("/api/don-thuoc"),
        fetchJson("/api/ton-kho/lo").catch(() => []),
      ]);

      const homNay = (hoaDon || []).filter(
        (h) => new Date(h.taoLuc).toDateString() === todayKey(),
      );
      const doanhThuHomNay = homNay.reduce(
        (s, h) => s + Number(h.tongTien || 0),
        0,
      );

      document.getElementById("db-stat-revenue-today").textContent =
        fmt(doanhThuHomNay);
      document.getElementById("db-stat-invoices").textContent = (
        hoaDon || []
      ).length.toLocaleString("vi-VN");
      document.getElementById("db-stat-prescriptions").textContent = (
        donThuoc || []
      ).length.toLocaleString("vi-VN");

      renderRevenueChart(hoaDon);
      renderLowStock(tonKho);
      renderRecentInvoices(hoaDon);

      document
        .getElementById("db-new-prescription-btn")
        ?.addEventListener("click", () => {
          window.location.href = "quan_ly_don_thuoc.html";
        });
    } catch (err) {
      console.error("Lỗi tải dashboard:", err);
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
