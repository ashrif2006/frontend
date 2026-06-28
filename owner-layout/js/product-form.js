import { getMyProductsAPI, createProductAPI, updateProductAPI } from "./api.js";

const MAX_IMAGES = 3;

// ---------- element refs ----------
const pageTitle = document.getElementById("pageTitle");

const nameInput = document.getElementById("nameInput");
const descriptionInput = document.getElementById("descriptionInput");
const priceInput = document.getElementById("priceInput");
const saleInput = document.getElementById("salePriceInput");
const stockInput = document.getElementById("stockInput");
const isAvailableInput = document.getElementById("isAvailable");
const pricePreview = document.getElementById("pricePreview");

const uploadZone = document.getElementById("uploadZone");
const imgInput = document.getElementById("imgInput");
const previewGrid = document.getElementById("previewGrid");
const uploadZoneBlock = document.getElementById("uploadZoneBlock");
const existingImagesBlock = document.getElementById("existingImagesBlock");
const existingImagesGrid = document.getElementById("existingImagesGrid");
const editModeImagesNote = document.getElementById("editModeImagesNote");

const saveBtn = document.getElementById("saveProductBtn");
const formErrorMsg = document.getElementById("formErrorMsg");

// holds File objects selected for upload (create mode only)
let selectedFiles = [];

// edit mode state
const params = new URLSearchParams(window.location.search);
const editingProductId = params.get("id");
const isEditMode = Boolean(editingProductId);

// ---------- auth guard + mode setup ----------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("غير مسموح لك بدخول هذه الصفحة، برجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  if (isEditMode) {
    setupEditMode();
    await loadProductForEdit();
  }
});

function setupEditMode() {
  pageTitle.textContent = "تعديل المنتج";
  document.title = "تعديل منتج — دكّان";
  saveBtn.textContent = "حفظ التغييرات";

  // images can't be changed via the update endpoint, so hide the
  // upload zone and show the existing images (read-only) instead
  uploadZoneBlock.style.display = "none";
  existingImagesBlock.style.display = "block";
  editModeImagesNote.style.display = "block";
}

async function loadProductForEdit() {
  // there's no GET /products/:id for the owner, so we fetch the full
  // list and find the one we need — fine given the 15-product cap
  const result = await getMyProductsAPI();
  if (!result || !result.ok) {
    showFormError("فشل تحميل بيانات المنتج");
    return;
  }

  const products = Array.isArray(result.data) ? result.data : result.data.products || [];
  const product = products.find((p) => p.id === editingProductId);

  if (!product) {
    showFormError("المنتج غير موجود");
    return;
  }

  fillForm(product);
}

function fillForm(product) {
  nameInput.value = product.name || "";
  descriptionInput.value = product.description || "";
  priceInput.value = product.price ?? "";
  saleInput.value = product.sale_price || "";
  stockInput.value = product.stock ?? 0;
  isAvailableInput.checked = Boolean(product.is_available);

  updatePricePreview();
  renderExistingImages(product.images || []);
}

function renderExistingImages(images) {
  if (!images.length) {
    existingImagesGrid.innerHTML = `<p class="text-slate mb-0" style="font-size:0.85rem;">لا توجد صور لهذا المنتج.</p>`;
    return;
  }
  existingImagesGrid.innerHTML = images
    .map(
      (img) => `
        <div class="img-preview-item">
          <img src="${img.image_url}" style="width:100%;height:100%;object-fit:cover;">
        </div>
      `
    )
    .join("");
}

// ---------- image upload (create mode only) ----------
if (uploadZone) {
  uploadZone.addEventListener("click", () => imgInput.click());
  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
  imgInput.addEventListener("change", () => handleFiles(imgInput.files));
}

function handleFiles(files) {
  const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (!incoming.length) return;

  const remainingSlots = MAX_IMAGES - selectedFiles.length;
  if (remainingSlots <= 0) {
    showFormError(`أقصى عدد صور هو ${MAX_IMAGES} — شيل صورة لإضافة صورة جديدة`);
    return;
  }

  const toAdd = incoming.slice(0, remainingSlots);
  if (incoming.length > remainingSlots) {
    showFormError(`تم إضافة أول ${remainingSlots} صورة فقط — الحد الأقصى ${MAX_IMAGES} صور`);
  } else {
    clearFormError();
  }

  toAdd.forEach((file) => {
    selectedFiles.push(file);
    renderImagePreview(file);
  });

  imgInput.value = "";
}

function renderImagePreview(file) {
  previewGrid.style.display = "grid";
  const reader = new FileReader();
  reader.onload = (e) => {
    const item = document.createElement("div");
    item.className = "img-preview-item";
    item.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">
      <button type="button" class="remove-img">✕</button>`;
    item.querySelector(".remove-img").addEventListener("click", () => {
      const idx = selectedFiles.indexOf(file);
      if (idx > -1) selectedFiles.splice(idx, 1);
      item.remove();
      if (selectedFiles.length === 0) previewGrid.style.display = "none";
    });
    previewGrid.appendChild(item);
  };
  reader.readAsDataURL(file);
}

// ---------- price discount preview ----------
function updatePricePreview() {
  const p = parseFloat(priceInput.value);
  const s = parseFloat(saleInput.value);
  if (p > 0 && s > 0 && s < p) {
    const pct = Math.round((1 - s / p) * 100);
    document.getElementById("pp-sale").textContent = s + " ج.م";
    document.getElementById("pp-pct").textContent = pct + "% خصم";
    pricePreview.style.display = "";
  } else {
    pricePreview.style.display = "none";
  }
}
priceInput.addEventListener("input", updatePricePreview);
saleInput.addEventListener("input", updatePricePreview);

// ---------- validation ----------
function clearFieldErrors() {
  [nameInput, priceInput, stockInput].forEach((el) => el.classList.remove("is-invalid"));
}

function validateForm() {
  clearFieldErrors();
  clearFormError();

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const stock = parseInt(stockInput.value, 10);
  const salePrice = saleInput.value ? parseFloat(saleInput.value) : null;

  if (!name) {
    nameInput.classList.add("is-invalid");
    showFormError("من فضلك أدخل اسم المنتج");
    return null;
  }

  if (!price || price <= 0) {
    priceInput.classList.add("is-invalid");
    showFormError("من فضلك أدخل سعر صحيح أكبر من صفر");
    return null;
  }

  if (salePrice !== null && salePrice >= price) {
    saleInput.classList.add("is-invalid");
    showFormError("سعر الخصم لازم يكون أقل من السعر الأصلي");
    return null;
  }

  if (stock === null || isNaN(stock) || stock < 0) {
    stockInput.classList.add("is-invalid");
    showFormError("من فضلك أدخل كمية مخزون صحيحة");
    return null;
  }

  return {
    name,
    price,
    sale_price: salePrice,
    description: descriptionInput.value.trim(),
    stock,
    is_available: isAvailableInput.checked,
  };
}

function showFormError(message) {
  formErrorMsg.textContent = message;
  formErrorMsg.style.display = "inline";
  formErrorMsg.style.color = "var(--warn)";
}

function clearFormError() {
  formErrorMsg.style.display = "none";
}

// ---------- save (create or update) ----------
saveBtn.addEventListener("click", async () => {
  const formData = validateForm();
  if (!formData) return;

  setSaving(true);

  const result = isEditMode
    ? await updateProductAPI(editingProductId, formData)
    : await createProductAPI(formData, selectedFiles);

  setSaving(false);

  if (!result || !result.ok) {
    showFormError(result?.data?.message || "حدث خطأ، حاول مرة أخرى");
    return;
  }

  // success — go back to the products list
  window.location.href = "products.html";
});

function setSaving(isSaving) {
  saveBtn.disabled = isSaving;
  saveBtn.textContent = isSaving
    ? "جاري الحفظ..."
    : isEditMode
    ? "حفظ التغييرات"
    : "حفظ المنتج";
}