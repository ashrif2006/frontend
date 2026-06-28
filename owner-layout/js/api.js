const BASE_URL = "https://a7-store.vercel.app/api";

function getHeader() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Same as getHeader but WITHOUT Content-Type, because when sending
// FormData (file upload) the browser must set its own multipart
// boundary header automatically. Setting Content-Type manually for
// FormData breaks the upload.
function getAuthHeaderOnly() {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginAPI(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    console.log(response.ok, data);
    return { ok: response.ok, data: data };
  } catch (error) {
    console.log("fetch error", error);
  }
}

export async function registerAPI(ownerData) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ownerData),
  });
  const data = await response.json();
  console.log(data);
  return { ok: response.ok, data: data };
}

export async function getStoreData() {
  try {
    const response = await fetch(`${BASE_URL}/store/me`, {
      method: "GET",
      headers: getHeader(),
    });

    const store = await response.json();
    return { ok: response.ok, data: store };
  } catch (e) {
    console.error("store error", e);
  }
}

// Updates store text fields: name, slug, whatsapp_number...
// Matches: router.put("/", authenticate, updateStore)
export async function updateStoreAPI(storeData) {
  try {
    const response = await fetch(`${BASE_URL}/store`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify(storeData),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("update store error", e);
    return { ok: false, data: { message: "حدث خطأ في الاتصال بالسيرفر" } };
  }
}

// Uploads the store logo as multipart/form-data.
// Matches: router.post("/logo", authenticate, upload.single(...), uploadLogo)
export async function uploadLogoAPI(file) {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(`${BASE_URL}/store/logo`, {
      method: "POST",
      headers: getAuthHeaderOnly(),
      body: formData,
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("upload logo error", e);
    return { ok: false, data: { message: "حدث خطأ أثناء رفع الشعار" } };
  }
}

export async function removeLogoAPI() {
  try {
    const response = await fetch(`${BASE_URL}/store/logo`, {
      method: "DELETE",
      headers: getHeader(),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("remove logo error", e);
    return { ok: false, data: { message: "حدث خطأ أثناء حذف الشعار" } };
  }
}

// Fetches the store's orders. Pass a status (e.g. "PENDING") to filter,
// or omit it to get all orders.
// Matches: router.get("/dashboard/orders", authenticate, getStoreOrders)
export async function getOrdersAPI(status) {
  try {
    const url = status
      ? `${BASE_URL}/dashboard/orders?status=${encodeURIComponent(status)}`
      : `${BASE_URL}/dashboard/orders`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeader(),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("get orders error", e);
    return { ok: false, data: { message: "حدث خطأ في جلب الطلبات" } };
  }
}

// Updates an order's status. status must be one of:
// PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
// Matches: router.put("/orders/:id/status", authenticate, updateOrderStatus)
export async function updateOrderStatusAPI(orderId, status) {
  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("update order status error", e);
    return { ok: false, data: { message: "حدث خطأ في تحديث حالة الطلب" } };
  }
}

// Fetches all of the logged-in owner's products.
// Matches: router.get("/products", authenticate, getMyProducts)
export async function getMyProductsAPI() {
  try {
    const response = await fetch(`${BASE_URL}/products`, {
      method: "GET",
      headers: getHeader(),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("get products error", e);
    return { ok: false, data: { message: "حدث خطأ في جلب المنتجات" } };
  }
}

// Creates a new product with up to 3 images.
// productData: { name, price, sale_price, description, stock }
// imageFiles: array of File objects (max 3) — field name must be "images"
// to match: upload.array("images", 3)
// Matches: router.post("/products", authenticate, upload.array("images", 3), createProduct)
export async function createProductAPI(productData, imageFiles) {
  try {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    (imageFiles || []).forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: getAuthHeaderOnly(),
      body: formData,
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("create product error", e);
    return { ok: false, data: { message: "حدث خطأ في إضافة المنتج" } };
  }
}

// Updates a product's text fields only — this endpoint does NOT accept
// image uploads (the backend's updateProduct service ignores files).
// productData: { name, price, sale_price, description, stock, is_available }
// Matches: router.put("/products/:id", authenticate, updateProduct)
export async function updateProductAPI(productId, productData) {
  try {
    const response = await fetch(`${BASE_URL}/products/${productId}`, {
      method: "PUT",
      headers: getHeader(),
      body: JSON.stringify(productData),
    });
    const data = await response.json();
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("update product error", e);
    return { ok: false, data: { message: "حدث خطأ في تحديث المنتج" } };
  }
}

// Deletes a product (and its images on the server side).
// Matches: router.delete("/products/:id", authenticate, deleteProduct)
export async function deleteProductAPI(productId) {
  try {
    const response = await fetch(`${BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: getHeader(),
    });
    const data = await response.json();
    console.log(data);
    return { ok: response.ok, data: data };
  } catch (e) {
    console.error("delete product error", e);
    return { ok: false, data: { message: "حدث خطأ في حذف المنتج" } };
  }
}