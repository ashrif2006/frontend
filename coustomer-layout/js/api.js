const BASE_URL = "https://a7-store.vercel.app/api";

import {renderStoreInfo} from './ui.js';

export async function getStoreProducts(slug) {
    try {
        const response = await fetch(`${BASE_URL}/store/${slug}/products`);
        
        if (!response.ok) {
            throw new Error(`خطأ في السيرفر: ${response.status}`);
        }
        
        const data = await response.json();
        renderStoreInfo(data); 
        return data.products || []; 
    } catch (error) {
        console.error("api.js -> getStoreProducts error:", error);
        throw error;
    }
}

/**
 * جلب تفاصيل منتج واحد محدد داخل المتجر
 */
export async function getProductById(slug, productId) {
    try {
        const response = await fetch(`${BASE_URL}/store/${slug}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`خطأ في جلب تفاصيل المنتج: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("api.js -> getProductById error:", error);
        throw error;
    }
}

/**
 * إنشاء طلب جديد لشراء المنتجات (Checkout)
 */
export async function createOrder(slug, orderData) {
    try {
        const response = await fetch(`${BASE_URL}/store/${slug}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `خطأ في إتمام الطلب: ${response.status}`);
            console.log(errorData.message);
            
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("api.js -> createOrder error:", error);
        throw error;
    }
}