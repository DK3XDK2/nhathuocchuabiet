(function () {
  // Inject fade transition ASAP to avoid flash of content
  (function () {
    const s = document.createElement("style");
    s.textContent =
      "body{opacity:0;transition:opacity 0.18s ease;}" +
      "body.page-visible{opacity:1;}";
    document.head.appendChild(s);
  })();

  const STAFF_TOKEN_KEY = "staffToken";
  const STAFF_USER_KEY = "staffUser";
  const REDIRECT_KEY = "staffRedirectAfterLogin";
  const LOGIN_PAGE = "dang_nhapAdmin.html";
  const DASHBOARD_PAGE = "Dashboard.html";

  const PAGE_BY_KEY = {
    dashboard: "Dashboard.html",
    medication: "quan_ly_thuoc.html",
    inventory_2: "quan_ly_ton_kho.html",
    prescriptions: "quan_ly_don_thuoc.html",
    receipt_long: "lap_hoa_don.html",
    format_list_bulleted: "danh_sach_hoa_don.html",
    shopping_cart: "quan_ly_don_hang.html",
    psychology: "goi_y_AI.html",
    account_circle: "quan_ly_tai_khoan.html",
    assessment: "Bao_cao_doanh_thu.html",
  };

  const API_BASE =
    (typeof __API_URL__ !== "undefined" && __API_URL__) ||
    window.APP_CONFIG?.apiBaseUrl ||
    localStorage.getItem("apiBaseUrl") ||
    "https://nhathuocchuabiet-production.up.railway.app";

  const loadingState = {
    pendingGetRequests: 0,
    pendingManualLoads: 0,
    hideTimer: null,
    bootstrapTimer: null,
    overlayEl: null,
    textEl: null,
  };

  const responseMonitor = {
    intervalId: null,
    inFlight: false,
  };

  const fullPath = window.location.pathname.split("/").pop() || "";
  const currentPage = fullPath.split("?")[0]; // Remove query string
  const isLoginPage =
    currentPage.toLowerCase() === LOGIN_PAGE.toLowerCase() ||
    currentPage.toLowerCase() === LOGIN_PAGE.toLowerCase().replace(".html", "");

  function readToken() {
    const token = localStorage.getItem(STAFF_TOKEN_KEY);
    console.log(
      `🔑 Read token from localStorage:`,
      token ? "✓ Found" : "✗ None",
    );
    return token && token.trim() ? token.trim() : "";
  }

  function readStaffUser() {
    try {
      const raw = localStorage.getItem(STAFF_USER_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function roleLabel(vaiTro) {
    if (vaiTro === "QUAN_LY") return "Quản trị viên";
    if (vaiTro === "NHAN_VIEN") return "Nhân viên";
    return "Nhân sự";
  }

  function capNhatThongTinHeader() {
    if (isLoginPage) return;

    const nguoiDung = readStaffUser();
    const tenHienThi =
      String(nguoiDung?.hoTen || "").trim() ||
      String(nguoiDung?.email || "").trim() ||
      "Nhân viên";
    const vaiTroHienThi = roleLabel(nguoiDung?.vaiTro);

    document.querySelectorAll("header .text-right").forEach((box) => {
      const lines = box.querySelectorAll("p");
      if (lines[0]) lines[0].textContent = tenHienThi;
      if (lines[1]) lines[1].textContent = vaiTroHienThi;
      if (lines[2]) {
        lines[2].textContent = "thời gian phản hồi: ? ms";
        lines[2].style.color = "";
      }
    });
  }

  function capNhatMauPhanHoi(elapsed) {
    const mau =
      typeof elapsed !== "number"
        ? ""
        : elapsed < 120
          ? "#16a34a"
          : elapsed < 300
            ? "#d97706"
            : "#dc2626";

    document.querySelectorAll("header .text-right").forEach((box) => {
      const lines = box.querySelectorAll("p");
      if (!lines[2]) return;
      lines[2].style.color = mau;
    });
  }

  async function capNhatDoTrePhanHoi() {
    if (isLoginPage) return;
    if (responseMonitor.inFlight) return;

    const token = readToken();
    if (!token) return;

    responseMonitor.inFlight = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const startedAt = performance.now();

    try {
      await fetch(`${API_BASE}/api/don-thuoc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-skip-global-loading": "1",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const elapsed = Math.max(1, Math.round(performance.now() - startedAt));
      document.querySelectorAll("header .text-right").forEach((box) => {
        const lines = box.querySelectorAll("p");
        if (lines[2])
          lines[2].textContent = `thời gian phản hồi: ${elapsed} ms`;
      });
      capNhatMauPhanHoi(elapsed);
    } catch {
      document.querySelectorAll("header .text-right").forEach((box) => {
        const lines = box.querySelectorAll("p");
        if (lines[2]) lines[2].textContent = "thời gian phản hồi: ? ms";
      });
      capNhatMauPhanHoi(null);
    } finally {
      clearTimeout(timeoutId);
      responseMonitor.inFlight = false;
    }
  }

  function batDauTheoDoiPhanHoiRealtime() {
    if (isLoginPage) return;
    if (responseMonitor.intervalId) return;

    capNhatDoTrePhanHoi();
    responseMonitor.intervalId = setInterval(capNhatDoTrePhanHoi, 5000);

    window.addEventListener("beforeunload", () => {
      if (responseMonitor.intervalId) {
        clearInterval(responseMonitor.intervalId);
        responseMonitor.intervalId = null;
      }
    });
  }

  function setSession(token, nguoiDung) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
    localStorage.setItem(STAFF_USER_KEY, JSON.stringify(nguoiDung || {}));
  }

  function clearSession() {
    localStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(STAFF_USER_KEY);
  }

  function showToast(message, isError) {
    const old = document.getElementById("staff-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "staff-toast";
    toast.style.cssText =
      "position:fixed;top:1rem;right:1rem;z-index:9999;padding:0.65rem 1rem;border-radius:0.75rem;color:#fff;font-size:0.875rem;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.16);" +
      (isError ? "background:#ba1a1a;" : "background:#0a7f42;");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function resolvePageByLabel(labelText) {
    const text = (labelText || "").toLowerCase();
    if (text.includes("dashboard")) return PAGE_BY_KEY.dashboard;
    if (text.includes("quản lý thuốc")) return PAGE_BY_KEY.medication;
    if (text.includes("quản lý tồn kho")) return PAGE_BY_KEY.inventory_2;
    if (text.includes("quản lý đơn thuốc")) return PAGE_BY_KEY.prescriptions;
    if (text.includes("lập hóa đơn")) return PAGE_BY_KEY.receipt_long;
    if (text.includes("danh sách hóa đơn"))
      return PAGE_BY_KEY.format_list_bulleted;
    if (text.includes("quản lý đơn hàng")) return PAGE_BY_KEY.shopping_cart;
    if (text.includes("gợi ý ai")) return PAGE_BY_KEY.psychology;
    if (text.includes("quản lý tài khoản")) return PAGE_BY_KEY.account_circle;
    if (text.includes("báo cáo doanh thu")) return PAGE_BY_KEY.assessment;
    return "";
  }

  function wireSidebarLinks() {
    const navLinks = document.querySelectorAll("aside nav a");
    navLinks.forEach((link) => {
      const icon =
        link.querySelector("[data-icon]")?.getAttribute("data-icon") || "";
      const label = link.textContent || "";
      const targetPage = PAGE_BY_KEY[icon] || resolvePageByLabel(label);
      if (!targetPage) return;

      link.setAttribute("href", targetPage);

      const isActive = targetPage.toLowerCase() === currentPage.toLowerCase();
      if (isActive) {
        link.classList.add("font-bold");
      }
    });
  }

  function wireLogout() {
    const logoutTriggers = Array.from(
      document.querySelectorAll("[data-icon='logout']"),
    )
      .map((el) => el.closest("a, button"))
      .filter(Boolean);

    logoutTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        clearSession();
        navigateTo(LOGIN_PAGE);
      });
    });
  }

  function guardStaffPage() {
    const token = readToken();
    console.log(`🛡️  Guard page "${currentPage}" | Has token: ${!!token}`);

    if (!isLoginPage && !token) {
      console.log(
        "🚫 Không có token và không ở trang login → Redirect to login",
      );
      localStorage.setItem(
        REDIRECT_KEY,
        window.location.pathname.split("/").pop() || DASHBOARD_PAGE,
      );
      window.location.href = LOGIN_PAGE;
      return false;
    }

    if (isLoginPage && token) {
      const redirectPage = localStorage.getItem(REDIRECT_KEY) || DASHBOARD_PAGE;
      console.log(`✓ Ở trang login và có token → Redirect to ${redirectPage}`);
      localStorage.removeItem(REDIRECT_KEY);
      window.location.href = redirectPage;
      return false;
    }

    console.log("✓ Guard passed");
    return true;
  }

  async function loginStaff(identity, password) {
    console.log("📝 Đăng nhập với email:", identity);

    const response = await fetch(`${API_BASE}/api/xac-thuc/dang-nhap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: identity,
        matKhau: password,
      }),
    });

    console.log("📡 Response status:", response.status);

    const payload = await response.json().catch(() => ({}));
    console.log("✅ Response payload:", payload);

    if (!response.ok) {
      throw new Error(payload?.thongBao || "Đăng nhập thất bại");
    }

    const vaiTro = payload?.nguoiDung?.vaiTro;
    console.log("👤 Vai trò:", vaiTro);

    if (!vaiTro || (vaiTro !== "QUAN_LY" && vaiTro !== "NHAN_VIEN")) {
      throw new Error("Tài khoản không có quyền truy cập trang nhân viên");
    }

    console.log("💾 Lưu session...");
    setSession(payload.token, payload.nguoiDung);
    console.log("✓ Session saved!");

    return true;
  }

  function wireLoginForm() {
    if (!isLoginPage) return;

    const form = document.querySelector("form");
    const identityInput = document.getElementById("identity");
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("password-toggle");

    if (!form || !identityInput || !passwordInput) {
      console.warn("⚠️  Form elements not found");
      return;
    }

    if (passwordToggle) {
      passwordToggle.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";

        const icon = passwordToggle.querySelector(".material-symbols-outlined");
        if (icon) {
          icon.textContent = isPassword ? "visibility_off" : "visibility";
        }

        passwordToggle.setAttribute(
          "aria-label",
          isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
        );
        passwordToggle.setAttribute(
          "aria-pressed",
          isPassword ? "true" : "false",
        );
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const identity = identityInput.value.trim();
      const password = passwordInput.value;

      if (!identity || !password) {
        showToast("Vui lòng nhập đầy đủ thông tin", true);
        return;
      }

      try {
        console.log("🔐 Bắt đầu đăng nhập...");
        await loginStaff(identity, password);
        showToast("Đăng nhập thành công ✓", false);

        const redirectPage =
          localStorage.getItem(REDIRECT_KEY) || DASHBOARD_PAGE;
        localStorage.removeItem(REDIRECT_KEY);
        console.log("🔄 Redirect tới:", redirectPage);

        // Redirect ngay lập tức
        navigateTo(redirectPage);
      } catch (error) {
        console.error("❌ Lỗi đăng nhập:", error.message);
        showToast(error.message || "Không thể đăng nhập", true);
      }
    });
  }

  function navigateTo(url) {
    document.body.classList.remove("page-visible");
    setTimeout(() => {
      window.location.href = url;
    }, 180);
  }

  function wirePageTransitions() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto")
      )
        return;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(href);
      });
    });
  }

  function ensureGlobalLoadingOverlay() {
    if (loadingState.overlayEl) return;

    const style = document.createElement("style");
    style.textContent = `
      #staff-global-loading {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        background: rgba(247, 249, 251, 0.92);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity .18s ease;
      }
      #staff-global-loading.hidden {
        opacity: 0;
        pointer-events: none;
      }
      #staff-global-loading .loading-card {
        display: flex;
        align-items: center;
        gap: .65rem;
        background: #ffffff;
        color: #2a3439;
        padding: .8rem 1rem;
        border-radius: .9rem;
        border: 1px solid #d9e4ea;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .08);
        font-size: .92rem;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "staff-global-loading";
    overlay.className = "hidden";
    overlay.innerHTML = `
      <div class="loading-card" role="status" aria-live="polite">
        <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        <span id="staff-global-loading-text">Đang tải dữ liệu...</span>
      </div>
    `;
    document.body.appendChild(overlay);

    loadingState.overlayEl = overlay;
    loadingState.textEl = overlay.querySelector("#staff-global-loading-text");
  }

  function showGlobalLoading(message) {
    if (isLoginPage) return;
    ensureGlobalLoadingOverlay();
    if (loadingState.textEl && message)
      loadingState.textEl.textContent = message;
    loadingState.overlayEl.classList.remove("hidden");
  }

  function hideGlobalLoading() {
    if (!loadingState.overlayEl) return;
    loadingState.overlayEl.classList.add("hidden");
  }

  function canHideGlobalLoading() {
    return (
      loadingState.pendingGetRequests === 0 &&
      loadingState.pendingManualLoads === 0
    );
  }

  function scheduleHideGlobalLoading() {
    if (!canHideGlobalLoading()) return;
    clearTimeout(loadingState.bootstrapTimer);
    clearTimeout(loadingState.hideTimer);
    loadingState.hideTimer = setTimeout(() => {
      if (canHideGlobalLoading()) hideGlobalLoading();
    }, 140);
  }

  function startManualGlobalLoading(message = "Đang tải dữ liệu...") {
    if (isLoginPage) return;
    loadingState.pendingManualLoads += 1;
    clearTimeout(loadingState.hideTimer);
    showGlobalLoading(message);
  }

  function doneManualGlobalLoading() {
    if (isLoginPage) return;
    loadingState.pendingManualLoads = Math.max(
      0,
      loadingState.pendingManualLoads - 1,
    );
    scheduleHideGlobalLoading();
  }

  function shouldTrackApiGet(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = (init?.method || "GET").toUpperCase();
    const headers = init?.headers;

    let skipLoading = false;
    if (headers instanceof Headers) {
      skipLoading =
        headers.get("x-skip-global-loading") === "1" ||
        headers.get("X-Skip-Global-Loading") === "1";
    } else if (headers && typeof headers === "object") {
      const rawValue =
        headers["x-skip-global-loading"] || headers["X-Skip-Global-Loading"];
      skipLoading = String(rawValue || "") === "1";
    }

    return method === "GET" && /\/api\//i.test(url) && !skipLoading;
  }

  function setupGlobalFetchLoading() {
    if (isLoginPage || window.__staffFetchLoadingPatched) return;

    window.__staffFetchLoadingPatched = true;
    const originalFetch = window.fetch.bind(window);

    showGlobalLoading("Đang tải dữ liệu...");
    loadingState.bootstrapTimer = setTimeout(() => {
      if (loadingState.pendingGetRequests === 0) hideGlobalLoading();
    }, 1200);

    window.fetch = async (input, init) => {
      const tracked = shouldTrackApiGet(input, init);

      if (tracked) {
        loadingState.pendingGetRequests += 1;
        clearTimeout(loadingState.hideTimer);
        showGlobalLoading("Đang tải dữ liệu...");
      }

      try {
        return await originalFetch(input, init);
      } finally {
        if (!tracked) return;

        loadingState.pendingGetRequests = Math.max(
          0,
          loadingState.pendingGetRequests - 1,
        );
        scheduleHideGlobalLoading();
      }
    };

    window.staffPageLoading = {
      start: startManualGlobalLoading,
      done: doneManualGlobalLoading,
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    console.log(`📄 Page loaded: ${currentPage} | isLoginPage: ${isLoginPage}`);
    if (!guardStaffPage()) return;

    setupGlobalFetchLoading();

    console.log("🔧 Wiring sidebar, logout, login...");
    wireSidebarLinks();
    wireLogout();
    capNhatThongTinHeader();
    wireLoginForm();
    wirePageTransitions();
    batDauTheoDoiPhanHoiRealtime();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("page-visible");
      });
    });
  });
})();
