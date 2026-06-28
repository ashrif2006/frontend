import { getMyProductsAPI, deleteProductAPI } from "./api.js";

const MAX_PRODUCTS = 15;

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("productSearchInput");
const filterBar = document.getElementById("filterBar");
const productCountLabel = document.getElementById("productCountLabel");
const addProductBtn = document.getElementById("addProductBtn");

let allProducts = [];
let currentFilter = "all";
let productPendingDelete = null; // id of the product the delete modal is acting on

// ---------- auth guard + initial load ----------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("غير مسموح لك بدخول هذه الصفحة، برجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }
  await loadProducts();
});

async function loadProducts() {
  showLoadingState();
  const result = await getMyProductsAPI();

  if (!result || !result.ok) {
    showErrorState(result?.data?.message || "فشل تحميل المنتجات، حاول مرة أخرى");
    return;
  }

  // backend may return an array directly, or { products: [...] }
  allProducts = Array.isArray(result.data) ? result.data : result.data.products || [];
  updateFilterCounts();
  updateProductCountLabel();
  renderProducts();
}

// ---------- rendering ----------
function renderProducts() {
  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    productsGrid.innerHTML = emptyStateHTML();
    return;
  }

  productsGrid.innerHTML = filtered.map(productCardHTML).join("") + addCardHTML();

  filtered.forEach((product) => {
    const card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (!card) return;
    const deleteBtn = card.querySelector(".delete-product-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => openDeleteModal(product));
    }
  });
}

function getFilteredProducts() {
  let list = allProducts;

  if (currentFilter === "available") {
    list = list.filter((p) => p.is_available && p.stock > 0);
  } else if (currentFilter === "out") {
    list = list.filter((p) => p.stock <= 0);
  }

  const query = (searchInput?.value || "").trim().toLowerCase();
  if (query) {
    list = list.filter((p) => p.name?.toLowerCase().includes(query));
  }

  return list;
}

function productCardHTML(product) {
  const mainImage = product.images && product.images[0] ? product.images[0].image_url : null;
  const isLow = product.stock > 0 && product.stock <= 5;
  const isOut = product.stock <= 0;
  const hasSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;

  return `
    <div class="col-6 col-md-4 col-xl-3" data-product-id="${product.id}">
      <div class="product-card" style="${!product.is_available ? "opacity:0.7;" : ""}">
        <div class="p-img" style="${isOut ? "background:#f0f0ef;" : ""}">
          ${
            mainImage
              ? `<img src="${mainImage}" alt="${escapeHTML(product.name)}">`
              : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`
          }
        </div>
        <div class="p-body">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div class="p-name">${escapeHTML(product.name)}</div>
            <span class="avail-badge ${product.is_available ? "on" : "off"}">${product.is_available ? "متاح" : "مخفي"}</span>
          </div>
          <div class="p-price">
            ${hasSale ? `${product.sale_price} ج.م <span class="p-sale">${product.price}</span>` : `${product.price} ج.م`}
          </div>
          <div class="p-stock ${isLow ? "low" : ""} mt-1">
            ${isOut ? "نفد المخزون" : isLow ? `⚠ متبقي ${product.stock} فقط` : `المخزون: ${product.stock}`}
          </div>
        </div>
        <div class="p-actions">
          <a href="product-form.html?id=${product.id}" class="btn btn-ghost btn-sm flex-fill">تعديل</a>
          <button class="btn btn-danger-soft btn-sm delete-product-btn" title="حذف">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function addCardHTML() {
  if (allProducts.length >= MAX_PRODUCTS) return "";
  return `
    <div class="col-6 col-md-4 col-xl-3">
      <a href="product-form.html" class="product-card text-decoration-none" style="min-height:200px; align-items:center; justify-content:center; border-style:dashed; background:transparent;">
        <div class="text-center p-4">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--accent-soft); color:var(--accent-dark); display:flex; align-items:center; justify-content:center; margin:0 auto 0.8rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span class="fw-semibold text-slate">إضافة منتج جديد</span>
        </div>
      </a>
    </div>
  `;
}

function emptyStateHTML() {
  const hasProducts = allProducts.length > 0;
  return `
    <div class="col-12">
      <div class="empty-state">
        <div class="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <h5 class="mb-1">${hasProducts ? "لا توجد منتجات تطابق البحث" : "لسه مفيش منتجات"}</h5>
        <p class="text-slate mb-3">${hasProducts ? "جرب تغيير كلمة البحث أو الفلتر." : "ابدأ بإضافة أول منتج في متجرك."}</p>
        ${!hasProducts ? `<a href="product-form.html" class="btn btn-accent">إضافة منتج جديد</a>` : ""}
      </div>
    </div>
  `;
}

function showLoadingState() {
  productsGrid.innerHTML = `
    <div class="col-12">
      <div class="empty-state"><p class="text-slate mb-0">جاري تحميل المنتجات…</p></div>
    </div>
  `;
}

function showErrorState(message) {
  productsGrid.innerHTML = `
    <div class="col-12">
      <div class="empty-state">
        <div class="icon-wrap" style="background:var(--warn-soft); color:var(--warn);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h5 class="mb-1">حدث خطأ</h5>
        <p class="text-slate mb-0">${escapeHTML(message)}</p>
      </div>
    </div>
  `;
}

// ---------- filter chips ----------
if (filterBar) {
  filterBar.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", function () {
      filterBar.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      renderProducts();
    });
  });
}

function updateFilterCounts() {
  const all = allProducts.length;
  const available = allProducts.filter((p) => p.is_available && p.stock > 0).length;
  const out = allProducts.filter((p) => p.stock <= 0).length;

  setChipCount("all", all);
  setChipCount("available", available);
  setChipCount("out", out);
}

function setChipCount(filter, count) {
  const chip = filterBar?.querySelector(`[data-filter="${filter}"] .count`);
  if (chip) chip.textContent = count;
}

function updateProductCountLabel() {
  if (!productCountLabel) return;
  productCountLabel.textContent = `${allProducts.length} من ${MAX_PRODUCTS} منتج`;

  if (allProducts.length >= MAX_PRODUCTS) {
    productCountLabel.classList.add("text-warning");
    if (addProductBtn) {
      addProductBtn.classList.add("disabled");
      addProductBtn.setAttribute("aria-disabled", "true");
      addProductBtn.title = "وصلت للحد الأقصى من المنتجات";
      addProductBtn.addEventListener("click", (e) => e.preventDefault());
    }
  }
}

// ---------- search ----------
if (searchInput) {
  searchInput.addEventListener("input", renderProducts);
}

// ---------- delete flow ----------
function openDeleteModal(product) {
  productPendingDelete = product.id;
  const nameEl = document.getElementById("deleteModalProductName");
  if (nameEl) {
    nameEl.textContent = `هتشيل "${product.name}" نهائيًا من المتجر. الخطوة دي مش ممكن ترجعها.`;
  }
  const modalEl = document.getElementById("deleteModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

const confirmDeleteBtn = document.getElementById("confirmDeleteProductBtn");
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!productPendingDelete) return;

    const originalText = confirmDeleteBtn.textContent;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "جاري الحذف...";

    const result = await deleteProductAPI(productPendingDelete);

    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = originalText;

    if (!result || !result.ok) {
      alert( "فشل حذف المنتج، من الاسباب انو موجود في اوردر");
      return;
    }

    allProducts = allProducts.filter((p) => p.id !== productPendingDelete);
    productPendingDelete = null;

    const modalEl = document.getElementById("deleteModal");
    bootstrap.Modal.getOrCreateInstance(modalEl).hide();

    updateFilterCounts();
    updateProductCountLabel();
    renderProducts();
  });
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