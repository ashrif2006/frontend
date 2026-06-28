import { getMyProductsAPI, getOrdersAPI } from "./api.js";

const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_COUNT = 5;
const LOW_STOCK_DISPLAY_COUNT = 5;

const statTotalSales = document.getElementById("statTotalSales");
const statPendingOrders = document.getElementById("statPendingOrders");
const statTotalOrders = document.getElementById("statTotalOrders");
const statActiveProducts = document.getElementById("statActiveProducts");
const statActiveProductsTrend = document.getElementById("statActiveProductsTrend");

const recentOrdersList = document.getElementById("recentOrdersList");
const lowStockList = document.getElementById("lowStockList");
const pendingOrdersSubtitle = document.getElementById("pendingOrdersSubtitle");
const todayDateLabel = document.getElementById("todayDateLabel");
const bellBadge = document.querySelector(".topbar-bell-badge");

const STATUS_LABELS = {
  PENDING: { label: "معلّق", badge: "badge-pending" },
  CONFIRMED: { label: "مؤكد", badge: "badge-confirmed" },
  SHIPPED: { label: "في الشحن", badge: "badge-shipped" },
  DELIVERED: { label: "تم التوصيل", badge: "badge-delivered" },
  CANCELLED: { label: "ملغي", badge: "badge-cancelled" },
};

// ---------- auth guard + load ----------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("غير مسموح لك بدخول هذه الصفحة، برجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  setTodayDate();
  await loadDashboard();
});

function setTodayDate() {
  if (!todayDateLabel) return;
  const today = new Date();
  todayDateLabel.textContent = today.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function loadDashboard() {
  const [productsResult, ordersResult] = await Promise.all([getMyProductsAPI(), getOrdersAPI()]);

  const productsOk = productsResult && productsResult.ok;
  const ordersOk = ordersResult && ordersResult.ok;

  const products = productsOk
    ? Array.isArray(productsResult.data)
      ? productsResult.data
      : productsResult.data.products || []
    : [];

  const orders = ordersOk
    ? Array.isArray(ordersResult.data)
      ? ordersResult.data
      : ordersResult.data.orders || []
    : [];

  if (!productsOk) showSectionError(statActiveProducts, "—");
  if (!ordersOk) {
    showSectionError(statTotalSales, "—");
    showSectionError(statPendingOrders, "—");
    showSectionError(statTotalOrders, "—");
  }

  renderStats(products, orders);
  renderRecentOrders(orders);
  renderLowStock(products);
}

function showSectionError(el, text) {
  if (el) el.textContent = text;
}

// ---------- stats ----------
function renderStats(products, orders) {
  // total sales = sum of totalPrice for DELIVERED orders only
  const totalSales = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.filter((p) => p.is_available).length;

  statTotalSales.textContent = formatCurrency(totalSales);
  statPendingOrders.textContent = pendingCount;
  statTotalOrders.textContent = totalOrdersCount;
  statActiveProducts.textContent = activeProductsCount;
  statActiveProductsTrend.textContent = `من أصل ${products.length} منتج`;

  if (pendingOrdersSubtitle) {
    pendingOrdersSubtitle.textContent =
      pendingCount > 0 ? `${pendingCount} طلب يحتاج ردك` : "لا يوجد طلبات معلّقة";
  }

  // sidebar + bell badge
  document.querySelectorAll(".badge-count").forEach((el) => {
    el.textContent = pendingCount;
  });
  if (bellBadge) {
    if (pendingCount > 0) {
      bellBadge.textContent = pendingCount;
      bellBadge.style.display = "block";
    } else {
      bellBadge.style.display = "none";
    }
  }
}

// ---------- recent orders ----------
function renderRecentOrders(orders) {
  if (!recentOrdersList) return;

  if (orders.length === 0) {
    recentOrdersList.innerHTML = `
      <div class="empty-state">
        <p class="text-slate mb-0">مفيش طلبات لسه.</p>
      </div>
    `;
    return;
  }

  // orders already come sorted desc by createdAt from the API
  const recent = orders.slice(0, RECENT_ORDERS_COUNT);

  recentOrdersList.innerHTML = recent.map(orderRowHTML).join("");
}

function orderRowHTML(order) {
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;
  const initial = (order.customer_name || "؟")[0];
  const shortId = order.id ? order.id.slice(0, 8) : "—";
  const timeAgo = formatTimeAgo(order.createdAt);

  return `
    <div class="order-row-mini">
      <div class="customer-init">${escapeHTML(initial)}</div>
      <div class="order-info">
        <div class="cname">${escapeHTML(order.customer_name || "بدون اسم")}</div>
        <div class="oid">#${shortId} · ${timeAgo}</div>
      </div>
      <span class="badge-status ${statusInfo.badge}">${statusInfo.label}</span>
      <span class="price">${order.totalPrice} ج.م</span>
    </div>
  `;
}

// ---------- low stock ----------
function renderLowStock(products) {
  if (!lowStockList) return;

  const lowStockProducts = products
    .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, LOW_STOCK_DISPLAY_COUNT);

  if (lowStockProducts.length === 0) {
    lowStockList.innerHTML = `
      <p class="text-slate mb-0" style="font-size:0.88rem;">كل المنتجات بمخزون كافي 👍</p>
      <a href="products.html" class="btn btn-ghost btn-sm mt-2 text-center">إدارة المخزون</a>
    `;
    return;
  }

  lowStockList.innerHTML =
    lowStockProducts.map(lowStockRowHTML).join("") +
    `<a href="products.html" class="btn btn-ghost btn-sm mt-2 text-center">إدارة المخزون</a>`;
}

function lowStockRowHTML(product) {
  const badgeClass = product.stock <= 2 ? "badge-cancelled" : "badge-pending";
  return `
    <div class="d-flex justify-content-between align-items-center">
      <span style="font-size:0.9rem;">${escapeHTML(product.name)}</span>
      <span class="badge-status ${badgeClass} num">${product.stock} قطعة</span>
    </div>
  `;
}

// ---------- helpers ----------
function formatCurrency(amount) {
  return amount.toLocaleString("en-US") + " ج.م";
}

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