(() => {
  "use strict";

  const API_BASE =
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";
  const token = () => localStorage.getItem("staffToken");

  const LOAI_LABEL = {
    TON_KHO_THAP: "Tồn kho thấp",
    SAP_HET_HAN: "Sắp hết hạn",
    XU_HUONG_MUA: "Xu hướng mua",
  };

  const fmtTime = (iso) => {
    if (!iso) return "Vừa xong";
    const d = new Date(iso);
    return (
      d.toLocaleDateString("vi-VN") +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  function cardCanhBao(g) {
    return `
      <div class="bg-white p-4 rounded-xl border-l-4 border-error shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-sm font-bold text-on-surface">${LOAI_LABEL[g.loai] || g.loai}</h4>
          <span class="text-[10px] text-on-surface-variant">${fmtTime(g.taoLuc)}</span>
        </div>
        <p class="text-xs text-on-surface-variant leading-relaxed mb-3">${g.duLieuDauRa || g.duLieuDauVao || "Không có dữ liệu"}</p>
      </div>`;
  }

  function cardGoiY(g) {
    return `
      <div class="bg-surface-container-highest/40 p-4 rounded-xl border border-outline-variant/20 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2 bg-white rounded-lg shadow-sm"><span class="material-symbols-outlined text-primary text-sm">auto_awesome</span></div>
          <h4 class="text-sm font-bold text-on-surface">${LOAI_LABEL[g.loai] || g.loai}</h4>
        </div>
        <p class="text-xs text-on-surface-variant leading-relaxed mb-2">${g.duLieuDauRa || "Không có gợi ý"}</p>
        <p class="text-[10px] text-outline">Độ tin cậy: ${Math.round(Number(g.doTinCay || 0) * 100)}%</p>
      </div>`;
  }

  async function taiGoiY() {
    const res = await fetch(`${API_BASE}/api/goi-y-ai`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function render() {
    const alertWrap = document.getElementById("ai-alert-list");
    const suggestWrap = document.getElementById("ai-suggest-list");
    const countEl = document.getElementById("ai-new-count");

    try {
      const ds = await taiGoiY();
      const moi = ds.filter((x) => x.trangThai === "CHO_DUYET");
      const daDuyet = ds.filter((x) => x.trangThai === "DA_DUYET");

      countEl.textContent = `${moi.length} MỚI`;
      alertWrap.innerHTML = (moi.length ? moi : ds.slice(0, 3))
        .slice(0, 4)
        .map(cardCanhBao)
        .join("");
      suggestWrap.innerHTML = (daDuyet.length ? daDuyet : ds.slice(0, 3))
        .slice(0, 4)
        .map(cardGoiY)
        .join("");

      if (!ds.length) {
        alertWrap.innerHTML =
          '<div class="text-xs text-outline bg-white p-4 rounded-xl">Chưa có cảnh báo AI</div>';
        suggestWrap.innerHTML =
          '<div class="text-xs text-outline bg-white p-4 rounded-xl">Chưa có gợi ý AI</div>';
      }
    } catch (err) {
      console.error(err);
      alertWrap.innerHTML =
        '<div class="text-xs text-error bg-white p-4 rounded-xl">Lỗi tải dữ liệu AI</div>';
      suggestWrap.innerHTML =
        '<div class="text-xs text-error bg-white p-4 rounded-xl">Lỗi tải dữ liệu AI</div>';
    }
  }

  async function init() {
    window.staffPageLoading?.start("Đang tải dữ liệu...");
    document
      .getElementById("ai-refresh-btn")
      ?.addEventListener("click", render);
    await render();
    window.staffPageLoading?.done();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
