import { getCart, getCartCount, getCartTotal, updateCartQuantity, removeFromCart } from "./cart.js";
import { escapeHTML, formatPrice } from "./ui.js";

const cartBody = document.getElementById("cartOffcanvasBody");
const cartCountBadges = document.querySelectorAll(".cart-count-badge");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");

/** Re-renders the cart badge count on every cart trigger button on the page. */
export function refreshCartBadge() {
  const count = getCartCount();
  cartCountBadges.forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  });
}

/** Re-renders the full offcanvas cart body + footer total. */
export function renderCart() {
  if (!cartBody) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="empty-cart-state">
        <div class="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h6 class="mb-1">السلة فاضية</h6>
        <p class="text-slate mb-0" style="font-size:0.88rem;">ضيف منتجات من المتجر وهتظهر هنا.</p>
      </div>
    `;
    if (cartCheckoutBtn) cartCheckoutBtn.classList.add("disabled");
    updateCartFooterVisibility(false);
    refreshCartBadge();
    return;
  }

  updateCartFooterVisibility(true);

  const itemsHTML = cart
    .map(
      (item) => `
      <div class="cart-item-row" data-product-id="${item.productId}">
        ${
          item.image
            ? `<img src="${item.image}" class="ci-img" alt="${escapeHTML(item.name)}">`
            : `<div class="ci-img d-flex align-items-center justify-content-center text-slate-light"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>`
        }
        <div class="ci-info">
          <div class="ci-name">${escapeHTML(item.name)}</div>
          <div class="ci-price">${formatPrice(item.price_at_purchase)}</div>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <div class="qty-stepper">
              <button type="button" class="qty-decrease" aria-label="تقليل الكمية">−</button>
              <span class="qty-val">${item.quantity}</span>
              <button type="button" class="qty-increase" aria-label="زيادة الكمية">+</button>
            </div>
            <button type="button" class="ci-remove" aria-label="إزالة من السلة">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  cartBody.innerHTML = itemsHTML;

  // bind qty +/- and remove buttons
  cart.forEach((item) => {
    const row = cartBody.querySelector(`[data-product-id="${item.productId}"]`);
    if (!row) return;

    row.querySelector(".qty-increase").addEventListener("click", () => {
      updateCartQuantity(item.productId, item.quantity + 1);
      renderCart();
    });
    row.querySelector(".qty-decrease").addEventListener("click", () => {
      updateCartQuantity(item.productId, item.quantity - 1);
      renderCart();
    });
    row.querySelector(".ci-remove").addEventListener("click", () => {
      removeFromCart(item.productId);
      renderCart();
    });
  });

  if (cartCheckoutBtn) cartCheckoutBtn.classList.remove("disabled");
  refreshCartBadge();
}

function updateCartFooterVisibility(hasItems) {
  if (!cartSubtotalEl) return;
  const footer = cartSubtotalEl.closest(".cart-footer");
  if (!footer) return;
  footer.style.display = hasItems ? "block" : "none";
  if (hasItems) {
    cartSubtotalEl.textContent = formatPrice(getCartTotal());
  }
}

// wire up every "add to cart" trigger that exists on the page at load
// time isn't possible here since products render dynamically — pages
// call refreshCartBadge()/renderCart() themselves after adding an item.

document.addEventListener("DOMContentLoaded", () => {
  refreshCartBadge();
  renderCart();
});