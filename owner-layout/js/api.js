const BASE_URL = "http://localhost:3000/api";

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