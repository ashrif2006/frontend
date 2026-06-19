import { getStoreData, updateStoreAPI, uploadLogoAPI, removeLogoAPI } from "./api.js";

// ---------- element refs ----------
const logoInput = document.getElementById("logoInput");
const logoImg = document.getElementById("logoImg");
const logoPlaceholder = document.getElementById("logoPlaceholder");
const logoRemove = document.getElementById("logoRemove");
const previewLogo = document.getElementById("previewLogo");

const storeNameInput = document.getElementById("storeName");
const slugInput = document.getElementById("slugInput");
const whatsappInput = document.getElementById("whatsappInput");
const saveBtn = document.getElementById("saveBtn");

const previewName = document.getElementById("previewName");
const previewSlug = document.getElementById("previewSlug");
const previewWa = document.getElementById("previewWa");
const slugDisplay = document.getElementById("slugDisplay");

// tracks the new logo file selected by the owner (null = no change)
let selectedLogoFile = null;
// tracks whether the owner removed the logo (so we know to call removeLogoAPI)
let logoRemoved = false;

// ---------- auth guard + initial load ----------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("غير مسموح لك بدخول هذه الصفحة، برجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  const result = await getStoreData();
  if (result && result.ok) {
    displayDataForStore(result.data.store);
  } else {
    showFieldError(null, "فشل في جلب بيانات المتجر، حاول تسجيل الدخول مرة أخرى");
  }
});

function displayDataForStore(store) {
  storeNameInput.value = store.name || "";
  slugInput.value = store.slug || "";
  whatsappInput.value = store.whatsapp_number || "";

  slugDisplay.textContent = "dokkan.com/" + (store.slug || "your-store");
  previewName.textContent = store.name || "اسم المتجر";
  previewSlug.textContent = "dokkan.com/" + (store.slug || "your-store");
  previewWa.textContent = store.whatsapp_number
    ? "+20" + store.whatsapp_number
    : "لم يضف رقم واتساب بعد";

  if (store.logo_url) {
    logoImg.src = store.logo_url;
    logoImg.style.display = "block";
    logoPlaceholder.style.display = "none";
    logoRemove.style.display = "flex";
    previewLogo.innerHTML = `<img src="${store.logo_url}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    logoImg.style.display = "none";
    logoPlaceholder.style.display = "flex";
    logoRemove.style.display = "none";
    previewLogo.textContent = (store.name || "م")[0];
  }
}

// ---------- logo upload preview ----------
logoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  selectedLogoFile = file;
  logoRemoved = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    logoImg.src = e.target.result;
    logoImg.style.display = "block";
    logoPlaceholder.style.display = "none";
    logoRemove.style.display = "flex";
    previewLogo.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
  };
  reader.readAsDataURL(file);
});

function removeLogo(e) {
  e.stopPropagation();
  logoImg.src = "";
  logoImg.style.display = "none";
  logoPlaceholder.style.display = "flex";
  logoRemove.style.display = "none";
  logoInput.value = "";

  selectedLogoFile = null;
  logoRemoved = true;

  previewLogo.textContent = (storeNameInput.value || "م")[0];
}
// expose for the inline onclick in the HTML
window.removeLogo = removeLogo;

// ---------- live preview while typing ----------
storeNameInput.addEventListener("input", function () {
  previewName.textContent = this.value || "اسم المتجر";
  if (!logoImg.src || logoImg.style.display === "none") {
    previewLogo.textContent = (this.value || "م")[0];
  }
});

slugInput.addEventListener("input", function () {
  const val = this.value || "your-store";
  slugDisplay.textContent = "dokkan.com/" + val;
  previewSlug.textContent = "dokkan.com/" + val;
});

whatsappInput.addEventListener("input", function () {
  const val = this.value.trim();
  previewWa.textContent = val ? "+20" + val : "لم يضف رقم واتساب بعد";
});

// ---------- validation ----------
function clearFieldErrors() {
  [storeNameInput, slugInput, whatsappInput].forEach((el) => {
    el.classList.remove("is-invalid");
  });
}

function showFieldError(el, message) {
  if (el) el.classList.add("is-invalid");
  let banner = document.getElementById("settingsErrorBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "settingsErrorBanner";
    banner.className = "alert mb-3";
    banner.style.background = "var(--warn-soft)";
    banner.style.color = "var(--warn)";
    banner.style.border = "1px solid #fbd0c4";
    banner.style.borderRadius = "var(--r-sm)";
    document.querySelector(".dash-main").prepend(banner);
  }
  banner.textContent = message;
  banner.style.display = "block";
}

function hideErrorBanner() {
  const banner = document.getElementById("settingsErrorBanner");
  if (banner) banner.style.display = "none";
}

function validateForm() {
  clearFieldErrors();
  hideErrorBanner();

  const name = storeNameInput.value.trim();
  const slug = slugInput.value.trim();
  const whatsapp = whatsappInput.value.trim();

  if (!name) {
    showFieldError(storeNameInput, "من فضلك أدخل اسم المتجر");
    return null;
  }

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    showFieldError(slugInput, "الرابط لازم يكون حروف إنجليزية صغيرة وأرقام وـ(-) بس");
    return null;
  }

  if (whatsapp && !/^[0-9]{10,11}$/.test(whatsapp)) {
    showFieldError(whatsappInput, "رقم الواتساب لازم يكون أرقام بس (10-11 رقم)");
    return null;
  }

  return { name, slug, whatsapp_number: whatsapp || null };
}

// ---------- save ----------
async function saveSettings() {
  const formData = validateForm();
  if (!formData) return;

  setSaving(true);

  try {
    // 1) save text fields
    const updateResult = await updateStoreAPI(formData);

    if (!updateResult || !updateResult.ok) {
      showFieldError(null, updateResult?.data?.message || "فشل حفظ بيانات المتجر");
      setSaving(false);
      return;
    }

    // 2) upload new logo file, if the owner picked one
    if (selectedLogoFile) {
      const logoResult = await uploadLogoAPI(selectedLogoFile);
      if (!logoResult || !logoResult.ok) {
        showFieldError(null, logoResult?.data?.message || "تم حفظ البيانات، لكن فشل رفع الشعار");
        setSaving(false);
        showToast("تم حفظ البيانات، لكن حدث خطأ في رفع الشعار", true);
        return;
      }
      selectedLogoFile = null;
    }
    // 3) if the owner explicitly removed the logo (and didn't pick a new one)
    else if (logoRemoved) {
      const removeResult = await removeLogoAPI();
      if (!removeResult || !removeResult.ok) {
        showFieldError(null, removeResult?.data?.message || "تم حفظ البيانات، لكن فشل حذف الشعار");
        setSaving(false);
        return;
      }
      logoRemoved = false;
    }

    showToast("تم حفظ إعدادات المتجر بنجاح", false);
  } catch (err) {
    console.error("save settings error", err);
    showFieldError(null, "حدث خطأ غير متوقع، حاول مرة أخرى");
  } finally {
    setSaving(false);
  }
}
window.saveSettings = saveSettings;

function setSaving(isSaving) {
  saveBtn.disabled = isSaving;
  saveBtn.textContent = isSaving ? "جاري الحفظ..." : "حفظ التغييرات";
}

function showToast(message, isError) {
  const toastEl = document.getElementById("saveToast");
  const body = toastEl.querySelector(".toast-body");
  body.lastChild
    ? (body.lastChild.textContent = message)
    : (body.textContent = message);

  toastEl.style.background = isError ? "var(--warn)" : "var(--ink)";
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

// ---------- delete store confirm gate (UI only — no destructive call yet) ----------
const deleteConfirmInput = document.getElementById("deleteConfirmInput");
if (deleteConfirmInput) {
  deleteConfirmInput.addEventListener("input", function () {
    document.getElementById("confirmDeleteBtn").disabled = this.value !== slugInput.value;
  });
}