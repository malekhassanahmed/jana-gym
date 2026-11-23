/* =========================================================
   Pizza House — Interactions
   ========================================================= */

(() => {
  "use strict";

  const CART_KEY = "pizzaHouseCart";
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const body = document.body;
  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("mainNav");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartOverlay = document.querySelector("[data-cart-overlay]");
  const cartItemsEl = document.querySelector("[data-cart-items]");
  const cartEmptyEl = document.querySelector("[data-cart-empty]");
  const cartFooterEl = document.querySelector("[data-cart-footer]");
  const cartToggle = document.querySelector("[data-cart-toggle]");
  const cartCountEls = document.querySelectorAll("[data-cart-count]");
  const cartSubtotalEl = document.querySelector("[data-cart-subtotal]");
  const cartDeliveryEl = document.querySelector("[data-cart-delivery]");
  const cartTotalEl = document.querySelector("[data-cart-total]");
  const toastEl = document.querySelector("[data-toast]");
  const toastMessageEl = document.querySelector("[data-toast-message]");
  const menuCountEl = document.querySelector("[data-menu-count]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const menuCards = document.querySelectorAll("[data-category]");

  let cart = readCart();
  let lastFocusedElement = null;
  let toastTimer = null;

  /* -------------------------------------------------------
     Utilities
     ------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* Storage can be unavailable in private mode. The cart still works in-memory. */
    }
  }

  function showToast(message) {
    if (!toastEl || !toastMessageEl) return;

    toastMessageEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  function getTotals() {
    const items = Object.values(cart);
    const quantity = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const delivery = subtotal > 0 && subtotal < 35 ? 3.9 : 0;
    return { quantity, subtotal, delivery, total: subtotal + delivery };
  }

  /* -------------------------------------------------------
     Cart
     ------------------------------------------------------- */

  function addToCart({ id, name, price, image }) {
    if (!id) return;

    if (cart[id]) {
      cart[id].qty += 1;
    } else {
      cart[id] = {
        id,
        name,
        price: Number(price),
        image,
        qty: 1,
      };
    }

    saveCart();
    renderCart();

    const count = getTotals().quantity;
    cartCountEls.forEach((el) => {
      el.textContent = count;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    });

    if (cartToggle) {
      cartToggle.setAttribute(
        "aria-label",
        `Open cart, ${count} ${count === 1 ? "item" : "items"}`
      );
    }

    showToast(`${name} added to your cart`);
  }

  function updateQuantity(id, change) {
    if (!cart[id]) return;

    cart[id].qty += change;
    if (cart[id].qty < 1) {
      delete cart[id];
    }

    saveCart();
    renderCart();
  }

  function removeItem(id) {
    if (!cart[id]) return;
    const name = cart[id].name;
    delete cart[id];
    saveCart();
    renderCart();
    showToast(`${name} removed from your cart`);
  }

  function renderCart() {
    const items = Object.values(cart);
    const { quantity, subtotal, delivery, total } = getTotals();

    cartCountEls.forEach((el) => {
      el.textContent = quantity;
    });

    if (cartToggle) {
      cartToggle.setAttribute(
        "aria-label",
        `Open cart, ${quantity} ${quantity === 1 ? "item" : "items"}`
      );
    }

    if (cartEmptyEl) cartEmptyEl.hidden = items.length > 0;
    if (cartFooterEl) cartFooterEl.hidden = items.length === 0;

    if (cartItemsEl) {
      cartItemsEl.innerHTML = items
        .map(
          (item) => `
            <div class="cart-item">
              <img src="${escapeHtml(item.image)}" alt="" loading="lazy">
              <div class="cart-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <span>${currency.format(item.price)}</span>
                <div class="qty-control">
                  <button type="button" data-qty="minus" data-id="${escapeHtml(
                    item.id
                  )}" aria-label="Decrease quantity of ${escapeHtml(item.name)}">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
                  </button>
                  <span aria-live="polite">${item.qty}</span>
                  <button type="button" data-qty="plus" data-id="${escapeHtml(
                    item.id
                  )}" aria-label="Increase quantity of ${escapeHtml(item.name)}">
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                </div>
              </div>
              <div class="cart-item-side">
                <strong>${currency.format(item.price * item.qty)}</strong>
                <button class="remove-item" type="button" data-remove="${escapeHtml(
                  item.id
                )}" aria-label="Remove ${escapeHtml(item.name)} from cart">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                </button>
              </div>
            </div>
          `
        )
        .join("");
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = currency.format(subtotal);
    if (cartDeliveryEl) {
      cartDeliveryEl.textContent = delivery === 0 ? "FREE" : currency.format(delivery);
    }
    if (cartTotalEl) cartTotalEl.textContent = currency.format(total);
  }

  function openCart() {
    if (!cartDrawer) return;
    lastFocusedElement = document.activeElement;
    body.classList.add("cart-open");
    cartDrawer.removeAttribute("inert");
    cartDrawer.setAttribute("aria-hidden", "false");
    const closeButton = cartDrawer.querySelector("[data-cart-close]");
    if (closeButton) {
      setTimeout(() => closeButton.focus(), 60);
    }
  }

  function closeCart() {
    if (!cartDrawer || !body.classList.contains("cart-open")) return;
    body.classList.remove("cart-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartDrawer.setAttribute("inert", "");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  if (cartToggle) {
    cartToggle.addEventListener("click", openCart);
  }

  document.querySelectorAll("[data-cart-close]").forEach((button) => {
    button.addEventListener("click", closeCart);
  });

  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCart);
  }

  document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    if (button.dataset.name) {
      button.setAttribute("aria-label", `Add ${button.dataset.name} to cart`);
    }

    button.addEventListener("click", () => {
      addToCart({
        id: button.dataset.id,
        name: button.dataset.name,
        price: button.dataset.price,
        image: button.dataset.image,
      });

      const label = button.querySelector("span");
      if (!label) return;

      const original = label.textContent;
      button.classList.add("added");
      label.textContent = "Added";
      setTimeout(() => {
        button.classList.remove("added");
        label.textContent = original;
      }, 1300);
    });
  });

  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", (event) => {
      const qtyButton = event.target.closest("[data-qty]");
      if (qtyButton) {
        const change = qtyButton.dataset.qty === "plus" ? 1 : -1;
        updateQuantity(qtyButton.dataset.id, change);
        return;
      }

      const removeButton = event.target.closest("[data-remove]");
      if (removeButton) {
        removeItem(removeButton.dataset.remove);
      }
    });
  }

  const checkoutButton = document.querySelector("[data-checkout]");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      const { quantity } = getTotals();
      if (!quantity) return;
      showToast("Checkout is a demo — your pizza is almost yours!");
    });
  }

  /* -------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------- */

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    body.classList.remove("nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      body.classList.toggle("nav-open", isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("open")) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });
  }

  /* -------------------------------------------------------
     Keyboard support
     ------------------------------------------------------- */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (body.classList.contains("cart-open")) {
        closeCart();
      } else {
        closeNav();
      }
    }

    if (event.key !== "Tab" || !body.classList.contains("cart-open") || !cartDrawer) {
      return;
    }

    const focusable = cartDrawer.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* -------------------------------------------------------
     Menu filtering
     ------------------------------------------------------- */

  function applyFilter(filter) {
    let visible = 0;

    menuCards.forEach((card) => {
      const matches = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-filtered", !matches);
      if (matches) visible += 1;
    });

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (menuCountEl) {
      menuCountEl.textContent = `${visible} ${visible === 1 ? "item" : "items"}`;
    }
  }

  if (filterButtons.length && menuCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => applyFilter(button.dataset.filter));
    });
    applyFilter("all");
  }

  /* -------------------------------------------------------
     Copy promo code
     ------------------------------------------------------- */

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(code);
        showToast(`Code ${code} copied to your clipboard`);
      } catch {
        const temp = document.createElement("textarea");
        temp.value = code;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          showToast(`Code ${code} copied to your clipboard`);
        } catch {
          showToast(`Your promo code is ${code}`);
        }
        temp.remove();
      }
    });
  });

  /* -------------------------------------------------------
     Newsletter
     ------------------------------------------------------- */

  document.querySelectorAll("[data-newsletter]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;
      form.reset();
      showToast("Thanks for joining the table. Fresh news is on its way!");
    });
  });

  /* -------------------------------------------------------
     Header on scroll
     ------------------------------------------------------- */

  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------- */

  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("in-view"));
  }

  /* -------------------------------------------------------
     Dynamic year
     ------------------------------------------------------- */

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* -------------------------------------------------------
     Init
     ------------------------------------------------------- */

  renderCart();
})();
