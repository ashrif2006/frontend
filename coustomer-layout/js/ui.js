/**
 * Renders the store's identity (logo, name, whatsapp pill) into the
 * header markup. Called automatically by getStoreProducts() in api.js.
 * Safe to call multiple times — it just re-fills the same elements.
 */
export function renderStoreInfo(data) {
  const nameEl = document.getElementById("storeName");
  const logoEl = document.getElementById("storeLogoImg");
  const logoFallback = document.getElementById("storeLogoFallback");
  const waPill = document.getElementById("storeWaPill");
  const pageTitle = document.getElementById("pageTitleSlot");

  if (nameEl) nameEl.textContent = data.name || "المتجر";
  if (pageTitle) document.title = `${data.name || "المتجر"} — A7-store`;

  if (logoEl && logoFallback) {
    if (data.logo_url) {
      logoEl.src = data.logo_url;
      logoEl.style.display = "block";
      logoFallback.style.display = "none";
    } else {
      logoEl.style.display = "none";
      logoFallback.style.display = "flex";
      logoFallback.textContent = (data.name || "A")[0];
    }
  }

  if (waPill) {
    if (data.whatsapp_number) {
      waPill.style.display = "inline-flex";
      waPill.querySelector(".wa-pill-text").textContent = "تواصل واتساب";
      waPill.href = `https://wa.me/${data.whatsapp_number}`;
    } else {
      waPill.style.display = "none";
    }
  }

  // stash the store on window so other scripts (cart, checkout) can
  // reference its slug/whatsapp without re-fetching
  window.__currentStore = data;
  if(data && data.slug){
    localStorage.setItem("current_store_slug", data.slug);
  }
}

/** Escapes a string for safe HTML insertion. */
export function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Formats a number as Egyptian pounds, e.g. 1250 -> "1,250 ج.م" */
export function formatPrice(amount) {
  return Number(amount).toLocaleString("en-US") + " ج.م";
}

/** Returns the effective sale price if valid, otherwise the original price. */
export function getEffectivePrice(product) {
  const hasSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
  return hasSale ? product.sale_price : product.price;
}

/** Reads ?store=slug from the current URL. Falls back to a default for local testing. */
export function getStoreSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  const urlSlug = params.get("store");
  if(urlSlug){
    localStorage.setItem("current_store_slug", urlSlug);
    return urlSlug;
  }
  const savedSlug = localStorage.getItem("current_store_slug");
  return savedSlug ;
}

/** Reads ?id=productId from the current URL. */
export function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}