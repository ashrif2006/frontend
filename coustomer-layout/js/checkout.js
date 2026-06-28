import { createOrder } from "./api.js";
import { getCart, getCartTotal, clearCart } from "./cart.js";
import { escapeHTML, formatPrice, getStoreSlugFromURL } from "./ui.js";

const slug = getStoreSlugFromURL();

const lineItemsEl = document.getElementById("checkoutLineItems");
const subtotalEl = document.getElementById("checkoutSubtotal");
const totalEl = document.getElementById("checkoutTotal");

const nameInput = document.getElementById("customerName");
const phoneInput = document.getElementById("customerPhone");
const addressInput = document.getElementById("customerAddress");
const notesInput = document.getElementById("customerNotes");

const submitBtn = document.getElementById("submitOrderBtn");
const errorMsg = document.getElementById("checkoutErrorMsg");

const formView = document.getElementById("checkoutFormView");
const successView = document.getElementById("checkoutSuccessView");
const successOrderId = document.getElementById("successOrderId");
const successWhatsappBtn = document.getElementById("successWhatsappBtn");

document.addEventListener("DOMContentLoaded", () => {
  const cart = getCart();

  if (cart.length === 0) {
    showEmptyCartRedirect();
    return;
  }

  renderSummary(cart);
});

function renderSummary(cart) {
  lineItemsEl.innerHTML = cart
    .map(
      (item) => `
      <div class="checkout-line-item">
        ${
          item.image
            ? `<img src="${item.image}" alt="${escapeHTML(item.name)}">`
            : `<div style="width:48px;height:48px;border-radius:var(--r-sm);background:#fff;display:flex;align-items:center;justify-content:center;color:var(--slate-light);flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
        }
        <div>
          <div class="cli-name">${escapeHTML(item.name)}</div>
          <div class="cli-qty">الكمية: ${item.quantity}</div>
        </div>
        <div class="cli-price">${formatPrice(item.price_at_purchase * item.quantity)}</div>
      </div>
    `
    )
    .join("");

  const total = getCartTotal();
  subtotalEl.textContent = formatPrice(total);
  totalEl.textContent = formatPrice(total);
}

function showEmptyCartRedirect() {
  formView.innerHTML = `
    <div class="empty-state">
      <div class="icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </div>
      <h5 class="mb-1">سلتك فاضية</h5>
      <p class="text-slate mb-3">ضيف منتجات من المتجر الأول قبل إتمام الطلب.</p>
      <a href="store.html" class="btn btn-primary-brand">رجوع للمتجر</a>
    </div>
  `;
}

// ---------- validation ----------
function clearFieldErrors() {
  [nameInput, phoneInput, addressInput].forEach((el) => el.classList.remove("is-invalid"));
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.style.display = "none";
}

function validateForm() {
  clearFieldErrors();
  clearError();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();

  if (!name) {
    nameInput.classList.add("is-invalid");
    showError("من فضلك أدخل اسمك بالكامل");
    return null;
  }

  if (!phone || !/^[0-9]{10,11}$/.test(phone)) {
    phoneInput.classList.add("is-invalid");
    showError("من فضلك أدخل رقم تليفون صحيح (10-11 رقم)");
    return null;
  }

  if (!address) {
    addressInput.classList.add("is-invalid");
    showError("من فضلك أدخل عنوان التوصيل بالتفصيل");
    return null;
  }

  return {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    notes: notesInput.value.trim() || undefined,
  };
}

// ---------- submit ----------
submitBtn.addEventListener("click", async () => {
  const customerData = validateForm();
  if (!customerData) return;

  const cart = getCart();
  if (cart.length === 0) {
    showEmptyCartRedirect();
    return;
  }

  const orderData = {
    ...customerData,
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };

  setSubmitting(true);

  try {
    const result = await createOrder(slug, orderData);
    handleOrderSuccess(result);
  } catch (err) {
    showError(err.message || "حدث خطأ أثناء إتمام الطلب، حاول مرة أخرى");
    setSubmitting(false);
  }
});

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitBtn.textContent = isSubmitting ? "جاري تأكيد الطلب..." : "تأكيد الطلب";
}

function handleOrderSuccess(result) {
  // backend returns { ...order, whatsapp_url }
  const order = result.order || result;
  const shortId = order.id ? order.id.slice(0, 8) : "—";

  successOrderId.textContent = `#${shortId}`;

  if (result.whatsapp_url || order.whatsapp_url) {
    successWhatsappBtn.href = result.whatsapp_url || order.whatsapp_url;
    successWhatsappBtn.style.display = "inline-block";
  }

  clearCart();

  formView.style.display = "none";
  successView.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}