(function () {
  const CART_ITEMS_KEY = "cartItems";

  const safeParse = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const getProducts = () =>
    Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];

  const getProductById = (id) => getProducts().find((item) => item.id === id);

  const normalizeItems = (items) =>
    (Array.isArray(items) ? items : [])
      .map((item) => ({
        id: String(item?.id || ""),
        qty: Number(item?.qty || 0),
      }))
      .filter((item) => item.id && item.qty > 0);

  const getItems = () => {
    const raw = safeParse(localStorage.getItem(CART_ITEMS_KEY), []);
    return normalizeItems(raw);
  };

  const getCount = () => getItems().reduce((sum, item) => sum + item.qty, 0);

  const syncCountBadges = () => {
    const count = getCount();
    localStorage.setItem("cartCount", String(count));
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = String(count);
    });
  };

  const saveItems = (items) => {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(normalizeItems(items)));
    syncCountBadges();
    window.dispatchEvent(new CustomEvent("cart:updated"));
  };

  const add = (productId, qty = 1) => {
    const amount = Number(qty || 1);
    if (!productId || amount <= 0) return;
    const items = getItems();
    const found = items.find((item) => item.id === productId);
    if (found) {
      found.qty += amount;
    } else {
      items.push({ id: productId, qty: amount });
    }
    saveItems(items);
  };

  const remove = (productId) => {
    const items = getItems().filter((item) => item.id !== productId);
    saveItems(items);
  };

  const updateQty = (productId, qty) => {
    const amount = Number(qty || 0);
    if (amount <= 0) {
      remove(productId);
      return;
    }
    const items = getItems();
    const found = items.find((item) => item.id === productId);
    if (!found) return;
    found.qty = amount;
    saveItems(items);
  };

  const clear = () => saveItems([]);

  const formatMoney = (value) => {
    if (typeof window.formatVnd === "function") return window.formatVnd(value);
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  };

  const getDetailedItems = () =>
    getItems()
      .map((item) => {
        const product = getProductById(item.id);
        if (!product) return null;
        const unitPrice = Number(product.price || 0);
        return {
          id: product.id,
          name: product.name,
          image: product.cardImage || product.image || "",
          category: product.category || "",
          qty: item.qty,
          unitPrice,
          lineTotal: unitPrice * item.qty,
        };
      })
      .filter(Boolean);

  const createMiniCartMarkup = (items) => {
    if (items.length === 0) {
      return `
        <p class="text-sm text-slate-500">Giỏ hàng đang trống.</p>
        <a href="danh_muc.html" class="inline-flex mt-3 text-sm font-bold text-primary hover:underline">Mua sắm ngay</a>
      `;
    }

    const topItems = items.slice(0, 4);
    const content = topItems
      .map(
        (item) => `
        <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
          <img src="${item.image}" alt="${item.name}" class="w-10 h-10 rounded object-cover bg-slate-100" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">${item.name}</p>
            <div class="mt-1 flex items-center gap-2">
              <button type="button" data-qty-action="decrease" data-item-id="${item.id}" class="w-5 h-5 rounded border border-slate-300 text-slate-700 leading-none">-</button>
              <span class="text-xs text-slate-600 min-w-4 text-center">${item.qty}</span>
              <button type="button" data-qty-action="increase" data-item-id="${item.id}" class="w-5 h-5 rounded border border-slate-300 text-slate-700 leading-none">+</button>
              <span class="text-xs text-slate-500 ml-1">${formatMoney(item.lineTotal)}</span>
            </div>
          </div>
          <button type="button" data-remove-id="${item.id}" class="text-xs text-red-600 hover:underline">Xóa</button>
        </div>
      `,
      )
      .join("");

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return `
      <div class="max-h-72 overflow-auto pr-1">${content}</div>
      <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
        <span class="text-sm text-slate-600">Tổng</span>
        <span class="font-bold text-slate-900">${formatMoney(total)}</span>
      </div>
      <a href="thanh_toan.html" class="mt-3 inline-flex w-full justify-center bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:brightness-110">Xem giỏ & thanh toán</a>
    `;
  };

  const initMiniCart = (selector = 'a[href="thanh_toan.html"]') => {
    const triggers = document.querySelectorAll(selector);
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      if (trigger.dataset.miniCartInit === "1") return;
      trigger.dataset.miniCartInit = "1";

      const container = trigger.parentElement;
      if (!container) return;
      container.classList.add("relative");

      const dropdown = document.createElement("div");
      dropdown.className =
        "hidden absolute right-0 top-full mt-3 w-80 max-w-[88vw] bg-white rounded-xl border border-slate-200 shadow-2xl p-3 z-[120]";
      container.appendChild(dropdown);

      const render = () => {
        dropdown.innerHTML = createMiniCartMarkup(getDetailedItems());
      };

      const open = () => {
        render();
        dropdown.classList.remove("hidden");
      };

      const close = () => {
        dropdown.classList.add("hidden");
      };

      let closeTimer;
      trigger.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        open();
      });
      trigger.addEventListener("mouseleave", () => {
        closeTimer = setTimeout(close, 120);
      });
      dropdown.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
      });
      dropdown.addEventListener("mouseleave", () => {
        closeTimer = setTimeout(close, 120);
      });

      dropdown.addEventListener("click", (event) => {
        const qtyBtn = event.target.closest("[data-qty-action][data-item-id]");
        if (qtyBtn) {
          event.preventDefault();
          event.stopPropagation();
          const itemId = qtyBtn.dataset.itemId;
          const action = qtyBtn.dataset.qtyAction;
          const current = getItems().find((it) => it.id === itemId);
          if (!current) return;
          if (action === "increase") {
            updateQty(itemId, current.qty + 1);
          } else if (action === "decrease") {
            updateQty(itemId, current.qty - 1);
          }
          render();
          return;
        }

        const removeBtn = event.target.closest("[data-remove-id]");
        if (!removeBtn) return;
        event.preventDefault();
        event.stopPropagation();
        remove(removeBtn.dataset.removeId);
        render();
      });

      window.addEventListener("cart:updated", () => {
        if (!dropdown.classList.contains("hidden")) {
          render();
        }
      });
    });
  };

  window.CartStore = {
    getItems,
    getDetailedItems,
    getCount,
    add,
    remove,
    updateQty,
    clear,
    syncCountBadges,
    initMiniCart,
    formatMoney,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncCountBadges);
  } else {
    syncCountBadges();
  }
})();
