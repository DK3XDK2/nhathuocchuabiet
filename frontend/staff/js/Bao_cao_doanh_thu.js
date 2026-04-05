(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  let hoaDon = [];
  let range = "today";

  const fmt = (n) =>
    Number(n || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const trongKhoang = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    if (range === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (range === "week") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - 6);
      return d >= start && d <= now;
    }
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= startMonth && d <= now;
  };

  const renderBars = (ds) => {
    const wrap = document.getElementById("bc-chart-bars");
    if (!wrap) return;
    const daily = new Map();
    ds.forEach((h) => {
      const key = new Date(h.taoLuc).toLocaleDateString("vi-VN");
      daily.set(key, (daily.get(key) || 0) + Number(h.tongTien || 0));
    });
    const values = [...daily.values()].slice(-10);
    const max = Math.max(...values, 1);
    wrap.innerHTML = values
      .map(
        (v) =>
          `<div class="flex-1 bg-primary/40 rounded-t-lg" style="height:${Math.max(8, Math.round((v / max) * 100))}%"></div>`,
      )
      .join("");
    if (!values.length) {
      wrap.innerHTML =
        '<div class="w-full text-center text-xs text-outline self-center">Không có dữ liệu</div>';
    }
  };

  const renderTop = (ds) => {
    const tbody = document.getElementById("bc-top-products-body");
    if (!tbody) return;
    const byProduct = new Map();

    ds.forEach((h) => {
      (h.chiTietHoaDon || []).forEach((ct) => {
        const name = ct.thuoc?.tenThuoc || "Thuốc";
        const cur = byProduct.get(name) || { qty: 0, rev: 0 };
        cur.qty += Number(ct.soLuong || 0);
        cur.rev += Number(ct.thanhTien || 0);
        byProduct.set(name, cur);
      });
    });

    const top = [...byProduct.entries()]
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);

    if (!top.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-8 text-center text-outline">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = top
      .map(
        (x) => `
        <tr class="hover:bg-surface-container-low transition-colors">
          <td class="px-6 py-4 text-xs font-bold">${x.name}</td>
          <td class="px-6 py-4 text-xs text-on-surface-variant">${x.qty.toLocaleString("vi-VN")}</td>
          <td class="px-6 py-4 text-xs font-bold">${fmt(x.rev)}</td>
          <td class="px-6 py-4 text-xs text-right text-emerald-600 font-bold">Top</td>
        </tr>`,
      )
      .join("");
  };

  const renderRecent = () => {
    const wrap = document.getElementById("bc-recent-invoices");
    if (!wrap) return;
    const recent = [...hoaDon].slice(0, 5);
    wrap.innerHTML = recent
      .map(
        (h) => `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-outline text-lg">receipt</span></div>
          <div class="flex-1">
            <p class="text-xs font-bold">#HD-${String(h.id).padStart(5, "0")}</p>
            <p class="text-[10px] text-outline">${new Date(h.taoLuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} • ${h.phuongThucThanhToan}</p>
          </div>
          <span class="text-xs font-bold text-on-surface">${fmt(h.tongTien)}</span>
        </div>`,
      )
      .join("");
  };

  const renderSummary = (ds) => {
    const total = ds.reduce((s, h) => s + Number(h.tongTien || 0), 0);
    const count = ds.length;
    const avg = count ? total / count : 0;
    document.getElementById("bc-total-revenue").textContent = fmt(total);
    document.getElementById("bc-avg-ticket").textContent = fmt(avg);
    document.getElementById("bc-total-invoices").textContent =
      count.toLocaleString("vi-VN");
  };

  const applyRange = () => {
    const ds = hoaDon.filter((h) => trongKhoang(h.taoLuc));
    renderSummary(ds);
    renderBars(ds);
    renderTop(ds);
  };

  async function taiDuLieu() {
    const res = await fetch(`${API_BASE}/api/hoa-don`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) throw new Error(await res.text());
    hoaDon = await res.json();
    renderRecent();
    applyRange();
  }

  function initRangeButtons() {
    document.querySelectorAll(".bc-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        range = btn.dataset.range;
        document.querySelectorAll(".bc-range-btn").forEach((b) => {
          b.classList.remove("bg-primary", "text-on-primary", "font-bold");
          b.classList.add("text-on-surface-variant");
        });
        btn.classList.add("bg-primary", "text-on-primary", "font-bold");
        btn.classList.remove("text-on-surface-variant");
        applyRange();
      });
    });
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    try {
      initRangeButtons();
      await taiDuLieu();
    } catch (err) {
      console.error(err);
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
