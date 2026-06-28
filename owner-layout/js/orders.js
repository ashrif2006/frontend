import { getOrdersAPI, updateOrderStatusAPI } from "./api.js";

const ordersListEl = document.getElementById("ordersList");
const searchInput = document.getElementById("orderSearchInput");

// holds the full set of orders fetched from the server, so we can
// filter/search client-side without re-fetching every time.
let allOrders = [];
let currentStatusFilter = "all";

const STATUS_LABELS = {
  PENDING: { label: "معلّق", badge: "badge-pending", cardClass: "pending" },
  CONFIRMED: {
    label: "مؤكد",
    badge: "badge-confirmed",
    cardClass: "confirmed",
  },
  SHIPPED: { label: "في الشحن", badge: "badge-shipped", cardClass: "shipped" },
  DELIVERED: {
    label: "تم التوصيل",
    badge: "badge-delivered",
    cardClass: "delivered",
  },
  CANCELLED: {
    label: "ملغي",
    badge: "badge-cancelled",
    cardClass: "cancelled",
  },
};

// ---------- auth guard + initial load ----------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("غير مسموح لك بدخول هذه الصفحة، برجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }
  await loadOrders();
});

async function loadOrders() {
  showLoadingState();
  const result = await getOrdersAPI();

  if (!result || !result.ok) {
    showErrorState(result?.data?.message || "فشل تحميل الطلبات، حاول مرة أخرى");
    return;
  }

  // backend may return an array directly, or { orders: [...] } — handle both
  allOrders = Array.isArray(result.data)
    ? result.data
    : result.data.orders || [];
  updateTabCounts();
  renderOrders();
}

// ---------- rendering ----------
function renderOrders() {
  const filtered = getFilteredOrders();

  if (filtered.length === 0) {
    ordersListEl.innerHTML = emptyStateHTML();
    return;
  }

  ordersListEl.innerHTML = filtered.map(orderCardHTML).join("");

  // bind header click (expand/collapse) + action buttons for each card
  filtered.forEach((order) => {
    const card = document.querySelector(`[data-order-id="${order.id}"]`);
    if (!card) return;

    card
      .querySelector(".order-card-header")
      .addEventListener("click", () => toggleOrder(card));
    bindActionButtons(card, order);
    // const whatsappBtn = card.querySelector('.btn-whatsapp');
    // if(whatsappBtn){
    //     whatsappBtn.addEventListener('click' , (e)=>{
    //         e.stopPropagation();
    //     })
    // }
  });
}

function getFilteredOrders() {
  let list = allOrders;
  if (currentStatusFilter !== "all") {
    list = list.filter((o) => o.status === currentStatusFilter);
  }
  const query = (searchInput?.value || "").trim().toLowerCase();
  if (query) {
    list = list.filter(
      (o) =>
        o.customer_name?.toLowerCase().includes(query) ||
        o.id?.toLowerCase().includes(query),
    );
  }
  return list;
}

function orderCardHTML(order) {
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;
  const shortId = order.id ? order.id.slice(0, 8) : "—";
  const timeAgo = formatTimeAgo(order.createdAt);
  const items = order.items || [];

  return `
    <div class="order-card ${statusInfo.cardClass}" data-status="${order.status}" data-order-id="${order.id}">
      <div class="order-card-header">
        <div>
          <div class="customer-name">${escapeHTML(order.customer_name || "بدون اسم")}</div>
          <div class="order-id">#${shortId}</div>
        </div>
        <span class="badge-status ${statusInfo.badge}">${statusInfo.label}</span>
        <div class="order-time me-auto">${timeAgo}</div>
        <div class="order-total">${order.totalPrice} ج.م</div>
        <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition:transform 0.2s; flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="order-card-body" style="display:none;">
        <div class="order-detail-row"><span class="detail-label">العميل</span><span class="detail-val">${escapeHTML(order.customer_name || "—")}</span></div>
        <div class="order-detail-row"><span class="detail-label">رقم التليفون</span><span class="detail-val">${escapeHTML(order.customer_phone || "—")}</span></div>
        <div class="order-detail-row"><span class="detail-label">العنوان</span><span class="detail-val">${escapeHTML(order.customer_address || "—")}</span></div>
        ${order.notes ? `<div class="order-detail-row"><span class="detail-label">ملاحظات</span><span class="detail-val text-slate">${escapeHTML(order.notes)}</span></div>` : ""}

        <div class="mt-3 mb-1"><span class="eyebrow">المنتجات</span></div>
        <div class="order-items-list">
          ${items.map(itemRowHTML).join("")}
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3 pt-2" style="border-top:1.5px solid var(--line);">
          <span class="text-slate fw-semibold">الإجمالي</span>
          <span class="num fw-bold" style="font-size:1.05rem;">${order.totalPrice} ج.م</span>
        </div>

        <div class="order-actions mt-2">
          ${actionsHTML(order.status)}
          ${order.customer_phone ? whatsappButtonHTML(order.customer_phone , order) : ""}
        </div>
      </div>
    </div>
  `;
}

function itemRowHTML(item) {
  const name = item.product?.name || "منتج محذوف";
  return `
    <div class="order-item-row">
      <div><div class="order-item-name">${escapeHTML(name)}</div><div class="order-item-qty">× ${item.quantity}</div></div>
      <div class="order-item-price">${item.price_at_purchase * item.quantity} ج.م</div>
    </div>
  `;
}

function actionsHTML(status) {
  if (status === "PENDING") {
    return `
      <button class="btn btn-accent" data-action="CONFIRMED">قبول الطلب</button>
      <button class="btn btn-danger-soft" data-action="CANCELLED">رفض الطلب</button>
    `;
  }
  if (status === "CONFIRMED") {
    return `
      <button class="btn btn-ink" data-action="SHIPPED">تحديث: في الشحن</button>
      <button class="btn btn-danger-soft" data-action="CANCELLED">إلغاء الطلب</button>
    `;
  }
  if (status === "SHIPPED") {
    return `<button class="btn btn-accent" data-action="DELIVERED">تأكيد الاستلام</button>`;
  }
  if (status === "DELIVERED") {
    return `<span class="text-slate" style="font-size:0.88rem;">✓ تم التوصيل بنجاح</span>`;
  }
  if (status === "CANCELLED") {
    return `<span class="text-slate" style="font-size:0.88rem;">تم إلغاء الطلب</span>`;
  }
  return "";
}

function whatsappButtonHTML(phone , order) {
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("01")) {
    cleanPhone = "2" + cleanPhone;
  } else if (cleanPhone.startsWith("1")) {
    cleanPhone = "20" + cleanPhone;
  }
  const customerName = order.customer_name || "يا فندم";
  const itemsList = (order.items || [])
    .map((item) => `- ${item.product?.name || "منتج"} (عدد: ${item.quantity})`)
    .join("\n");

    const messageText = `أهلاً بك يا ${customerName}،
    معاك خدمة العملاء.. كنت حابب أأكد مع حضرتك طلبك:
    ${itemsList}
    إجمالي الحساب: ${order.totalPrice} ج.م.
    هل البيانات دي صحيحة لشحن الطلب؟`;

    const encodeMessage = encodeURIComponent(messageText);
  return `
    <a href="https://wa.me/${cleanPhone}?text=${encodeMessage}" target="_blank" class="btn btn-whatsapp me-auto">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left:5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
      واتساب
    </a>
  `;
}

function emptyStateHTML() {
  return `
    <div class="empty-state">
      <div class="icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
      </div>
      <h5 class="mb-1">لا توجد طلبات</h5>
      <p class="text-slate mb-0">مفيش طلبات تطابق الفلتر أو البحث الحالي.</p>
    </div>
  `;
}

function showLoadingState() {
  ordersListEl.innerHTML = `
    <div class="empty-state">
      <p class="text-slate mb-0">جاري تحميل الطلبات…</p>
    </div>
  `;
}

function showErrorState(message) {
  ordersListEl.innerHTML = `
    <div class="empty-state">
      <div class="icon-wrap" style="background:var(--warn-soft); color:var(--warn);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h5 class="mb-1">حدث خطأ</h5>
      <p class="text-slate mb-0">${escapeHTML(message)}</p>
    </div>
  `;
}

// ---------- interactions ----------
function toggleOrder(card) {
  const header = card.querySelector(".order-card-header");
  const body = card.querySelector(".order-card-body");
  const chevron = header.querySelector(".chevron");
  const open = body.style.display !== "none";
  body.style.display = open ? "none" : "block";
  chevron.style.transform = open ? "" : "rotate(180deg)";
}

function bindActionButtons(card, order) {
  card.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleStatusChange(order.id, btn.dataset.action, btn);
    });
  });
}

async function handleStatusChange(orderId, newStatus, btnEl) {
  const originalText = btnEl.textContent;
  btnEl.disabled = true;
  btnEl.textContent = "جاري التحديث...";

  const result = await updateOrderStatusAPI(orderId, newStatus);

  if (!result || !result.ok) {
    alert(result?.data?.message || "فشل تحديث حالة الطلب، حاول مرة أخرى");
    btnEl.disabled = false;
    btnEl.textContent = originalText;
    return;
  }

  // update local cache then re-render so counts/badges stay in sync
  const order = allOrders.find((o) => o.id === orderId);
  if (order) order.status = newStatus;
  updateTabCounts();
  renderOrders();
}

// ---------- tabs / filter ----------
window.filterOrders = function (status, btn) {
  currentStatusFilter = status;
  document
    .querySelectorAll(".status-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderOrders();
};

function updateTabCounts() {
  const counts = { all: allOrders.length };
  Object.keys(STATUS_LABELS).forEach((s) => {
    counts[s] = allOrders.filter((o) => o.status === s).length;
  });

  setTabCount("all", counts.all);
  setTabCount("PENDING", counts.PENDING || 0);

  // also update the sidebar pending badge if present
  document.querySelectorAll(".badge-count").forEach((el) => {
    el.textContent = counts.PENDING || 0;
  });
}

function setTabCount(status, count) {
  const tab = Array.from(document.querySelectorAll(".status-tab")).find((t) =>
    t.getAttribute("onclick")?.includes(`'${status}'`),
  );
  if (tab) {
    const countEl = tab.querySelector(".tab-count");
    if (countEl) countEl.textContent = count;
  }
}

if (searchInput) {
  searchInput.addEventListener("input", renderOrders);
}

// ---------- helpers ----------
function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimeAgo(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "منذ لحظات";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}
