import { getProductById, getStoreProducts } from "./api.js";
import { addToCart } from "./cart.js";
import { refreshCartBadge, renderCart } from "./cart-ui.js";
import { escapeHTML, formatPrice, getEffectivePrice, getStoreSlugFromURL, getProductIdFromURL } from "./ui.js";

const contentEl = document.getElementById("productDetailsContent");
const breadcrumbName = document.getElementById("breadcrumbProductName");
const navBrandName = document.getElementById("navBrandName");
const relatedGrid = document.getElementById("relatedProductsGrid");

const slug = getStoreSlugFromURL();
const productId = getProductIdFromURL();

let currentQty = 1;
let currentProduct = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!productId) {
    showErrorState("لم يتم تحديد منتج");
    return;
  }

  try {
    const product = await getProductById(slug, productId);
    currentProduct = product;
    renderProductDetails(product);
    loadRelatedProducts();
  } catch (err) {
    showErrorState("المنتج غير موجود أو حدث خطأ");
  }
});

function renderProductDetails(product) {
  breadcrumbName.textContent = product.name;
  document.title = `${product.name} — A7-store`;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const mainImage = images[0]?.image_url;
  const hasSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
  const effectivePrice = getEffectivePrice(product);
  const stockInfo = getStockInfo(product.stock);

  contentEl.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <div class="pd-gallery-main" id="pdGalleryMain">
          ${
            mainImage
              ? `<img src="${mainImage}" alt="${escapeHTML(product.name)}" id="pdMainImage">`
              : `<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--slate-light);"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`
          }
        </div>
        ${
          images.length > 1
            ? `<div class="pd-thumb-row" id="pdThumbRow">
                ${images
                  .map(
                    (img, i) => `
                  <div class="pd-thumb ${i === 0 ? "active" : ""}" data-img-url="${img.image_url}">
                    <img src="${img.image_url}" alt="">
                  </div>
                `
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>

      <div class="col-md-6">
        <h1 class="h3 mb-2">${escapeHTML(product.name)}</h1>
        <div class="d-flex align-items-baseline gap-2 mb-3">
          <span class="pt-price" style="font-size:1.6rem;">${formatPrice(effectivePrice)}</span>
          ${hasSale ? `<span class="pt-price-old" style="font-size:1rem;">${formatPrice(product.price)}</span>` : ""}
          ${hasSale ? `<span class="pt-badge-sale" style="position:static;">خصم ${Math.round((1 - product.sale_price / product.price) * 100)}%</span>` : ""}
        </div>

        <span class="pd-stock-pill ${stockInfo.cls}">${stockInfo.label}</span>

        ${product.description ? `<p class="text-slate mt-3 mb-0">${escapeHTML(product.description)}</p>` : ""}

        <div class="pd-section-divider"></div>

        ${
          product.stock > 0
            ? `
          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="form-label mb-0">الكمية</span>
            <div class="qty-stepper lg">
              <button type="button" id="pdQtyDecrease">−</button>
              <span class="qty-val" id="pdQtyVal">1</span>
              <button type="button" id="pdQtyIncrease">+</button>
            </div>
          </div>
          <button type="button" class="btn btn-primary-brand btn-lg btn-block" id="pdAddToCartBtn">
            أضف للسلة — <span id="pdAddToCartTotal">${formatPrice(effectivePrice)}</span>
          </button>
        `
            : `<button type="button" class="btn btn-ghost btn-lg btn-block" disabled>نفد المخزون</button>`
        }
      </div>
    </div>
  `;

  if (images.length > 1) bindThumbnails();
  if (product.stock > 0) bindQuantityAndAddToCart(product);
}

function bindThumbnails() {
  const mainImg = document.getElementById("pdMainImage");
  document.querySelectorAll(".pd-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document.querySelectorAll(".pd-thumb").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      if (mainImg) mainImg.src = thumb.dataset.imgUrl;
    });
  });
}

function bindQuantityAndAddToCart(product) {
  const qtyValEl = document.getElementById("pdQtyVal");
  const totalEl = document.getElementById("pdAddToCartTotal");
  const decreaseBtn = document.getElementById("pdQtyDecrease");
  const increaseBtn = document.getElementById("pdQtyIncrease");
  const addBtn = document.getElementById("pdAddToCartBtn");
  const effectivePrice = getEffectivePrice(product);

  currentQty = 1;

  function updateQtyDisplay() {
    qtyValEl.textContent = currentQty;
    totalEl.textContent = formatPrice(effectivePrice * currentQty);
  }

  decreaseBtn.addEventListener("click", () => {
    if (currentQty > 1) {
      currentQty--;
      updateQtyDisplay();
    }
  });

  increaseBtn.addEventListener("click", () => {
    if (currentQty < product.stock) {
      currentQty++;
      updateQtyDisplay();
    }
  });

  addBtn.addEventListener("click", () => {
    addToCart(product, currentQty);
    refreshCartBadge();
    renderCart();

    const original = addBtn.innerHTML;
    addBtn.innerHTML = "تمت الإضافة للسلة ✓";
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.innerHTML = original;
      addBtn.disabled = false;
    }, 1400);
  });
}

function getStockInfo(stock) {
  if (stock <= 0) return { label: "نفد المخزون", cls: "out-stock" };
  if (stock <= 5) return { label: `متبقي ${stock} فقط`, cls: "low-stock" };
  return { label: "متوفر في المخزون", cls: "in-stock" };
}

function showErrorState(message) {
  contentEl.innerHTML = `
    <div class="empty-state">
      <div class="icon-wrap" style="background:var(--danger-soft); color:var(--danger);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h5 class="mb-1">${escapeHTML(message)}</h5>
      <a href="store.html" class="btn btn-primary-brand mt-2">رجوع للمتجر</a>
    </div>
  `;
}

// ---------- related products ----------
async function loadRelatedProducts() {
  if (!relatedGrid) return;
  try {
    const allProducts = await getStoreProducts(slug);
    if (navBrandName && window.__currentStore) {
      navBrandName.textContent = window.__currentStore.name || "A7-store";
    }

    const related = allProducts.filter((p) => p.id !== productId).slice(0, 4);

    if (related.length === 0) {
      relatedGrid.parentElement.querySelector("h3").style.display = "none";
      return;
    }

    relatedGrid.innerHTML = related.map(relatedTileHTML).join("");
  } catch (err) {
    relatedGrid.parentElement.querySelector("h3").style.display = "none";
  }
}

function relatedTileHTML(product) {
  const mainImage = product.images && product.images[0] ? product.images[0].image_url : null;
  const effectivePrice = getEffectivePrice(product);
  const hasSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;

  return `
    <div class="col-6 col-md-3">
      <a href="product-details.html?store=${slug}&id=${product.id}" class="product-tile text-decoration-none">
        <div class="pt-img-wrap">
          ${
            mainImage
              ? `<img src="${mainImage}" alt="${escapeHTML(product.name)}">`
              : `<div class="pt-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
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