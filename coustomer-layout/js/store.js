import { getStoreProducts } from "./api.js";
import { addToCart } from "./cart.js";
import { refreshCartBadge, renderCart } from "./cart-ui.js";
import { escapeHTML, formatPrice, getEffectivePrice, getStoreSlugFromURL } from "./ui.js";

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("productSearchInput");
const filterPills = document.getElementById("filterPills");
const productCountPill = document.getElementById("productCountPill");
const navBrandName = document.getElementById("navBrandName");

const slug = getStoreSlugFromURL();
let allProducts = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingState();
  try {
    allProducts = await getStoreProducts(slug);
    if (navBrandName && window.__currentStore) {
      navBrandName.textContent = window.__currentStore.name || "A7-store";
    }
    updateProductCountPill();
    renderProducts();
  } catch (err) {
    showErrorState();
  }
});

function renderProducts() {
  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    productsGrid.innerHTML = emptyStateHTML();
    return;
  }

  productsGrid.innerHTML = filtered.map(productTileHTML).join("");

  filtered.forEach((product) => {
    const tile = document.querySelector(`[data-product-id="${product.id}"]`);
    if (!tile) return;

    const quickAddBtn = tile.querySelector(".quick-add-btn");
    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1);
        refreshCartBadge();
        renderCart();
        flashAdded(quickAddBtn);
      });
    }
  });
}

function getFilteredProducts() {
  let list = allProducts;

  if (currentFilter === "sale") {
    list = list.filter((p) => p.sale_price && p.sale_price > 0 && p.sale_price < p.price);
  }

  const query = (searchInput?.value || "").trim().toLowerCase();
  if (query) {
    list = list.filter((p) => p.name?.toLowerCase().includes(query));
  }

  return list;
}

function productTileHTML(product) {
  const mainImage = product.images && product.images[0] ? product.images[0].image_url : null;
  const hasSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
  const isOut = product.stock <= 0;
  const effectivePrice = getEffectivePrice(product);

  return `
    <div class="col-6 col-md-4 col-lg-3" data-product-id="${product.id}">
      <a href="product-details.html?store=${slug}&id=${product.id}" class="product-tile text-decoration-none">
        <div class="pt-img-wrap">
          ${
            mainImage
              ? `<img src="${mainImage}" alt="${escapeHTML(product.name)}">`
              : `<div class="pt-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>`
          }
          ${hasSale ? `<span class="pt-badge-sale">خصم ${Math.round((1 - product.sale_price / product.price) * 100)}%</span>` : ""}
          ${isOut ? `<div class="pt-badge-out">نفد المخزون</div>` : ""}
          ${
            !isOut
              ? `<div class="pt-quick-add">
                  <button type="button" class="btn btn-ink btn-sm btn-block quick-add-btn">أضف للسلة</button>
                </div>`
              : ""
          }
        </div>
        <div class="pt-body">
          <div class="pt-name">${escapeHTML(product.name)}</div>
          <div class="pt-price-row">
            <span class="pt-price">${formatPrice(effectivePrice)}</span>
            ${hasSale ? `<span class="pt-price-old">${formatPrice(product.price)}</span>` : ""}
          </div>
        </div>
      </a>
    </div>
  `;
}

function flashAdded(btn) {
  const original = btn.textContent;
  btn.textContent = "تمت الإضافة ✓";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1200);
}

function emptyStateHTML() {
  const hasProducts = allProducts.length > 0;
  return `
    <div class="col-12">
      <div class="empty-state">
        <div class="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
        </div>
        <h5 class="mb-1">${hasProducts ? "لا توجد منتجات تطابق البحث" : "لا توجد منتجات متاحة الآن"}</h5>
        <p class="text-slate mb-0">${hasProducts ? "جرب كلمة بحث أو فلتر مختلف." : "المتجر لسه مفيش فيه منتجات."}</p>
      </div>
    </div>
  `;
}

function showLoadingState() {
  productsGrid.innerHTML = Array(8)
    .fill(0)
    .map(
      () => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="skeleton" style="aspect-ratio:1/1; border-radius:var(--r-md);"></div>
          <div class="skeleton mt-2" style="height:14px; width:80%;"></div>
          <div class="skeleton mt-2" style="height:14px; width:40%;"></div>
        </div>
      `
    )
    .join("");
}

function showErrorState() {
  productsGrid.innerHTML = `
    <div class="col-12">
      <div class="empty-state">
        <div class="icon-wrap" style="background:var(--danger-soft); color:var(--danger);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h5 class="mb-1">المتجر غير موجود أو حدث خطأ</h5>
        <p class="text-slate mb-0">تأكد من الرابط وحاول مرة أخرى.</p>
      </div>
    </div>
  `;
}

function updateProductCountPill() {
  if (productCountPill) {
    productCountPill.textContent = `${allProducts.length} منتج`;
  }
}

// ---------- filters + search ----------
if (filterPills) {
  filterPills.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", function () {
      filterPills.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.filter;
      renderProducts();
    });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", renderProducts);
}