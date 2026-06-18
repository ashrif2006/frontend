import { getStoreProducts, createOrder } from './api.js';
import { addToCart, getCart, removeFromCart, updateCartQuantity, clearCart } from './cart.js';
import { renderProducts, renderCartUI, showAlert, openProductDetailsModal , renderStoreInfo } from './ui.js'; 

let localProductsArray = [];

/**
 * استخراج الـ Slug ديناميكياً من رابط المتصفح
 */
function getStoreSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('slug')) {
        return urlParams.get('slug');
    }
    
    const pathParts = window.location.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        return pathParts[storeIndex + 1];
    }
    
    return "FAYEZ-STORE"; 
}

const STORE_SLUG = getStoreSlug();

// === 1. عند تحميل الصفحة أول مرة ===
document.addEventListener('DOMContentLoaded', async () => {
    renderCartUI();
    
    try {
        localProductsArray = await getStoreProducts(STORE_SLUG);
        renderProducts(localProductsArray);
    } catch (error) {
        showAlert("فشل في تحميل منتجات المتجر. يرجى التحقق من اتصال السيرفر.", "danger");
    }
});

// === 2. الاستماع لأحداث الكليك (Event Delegation) ===
document.body.addEventListener('click', (e) => {
    
    // أ: زرار أضف للسلة (المباشر في كارت المنتج)
    if (e.target.closest('.btn-add-to-cart')) {
        e.stopPropagation(); 
        const button = e.target.closest('.btn-add-to-cart');
        const productId = button.dataset.id;
        
        const product = localProductsArray.find(p => p.id === productId);
        if (product) {
            addToCart(product, 1);
            renderCartUI();
            showAlert(`تم إضافة "${product.name}" إلى السلة بنجاح!`, "success");
        }
        return; 
    }

    // ب: إضافة منتج من داخل مودال التفاصيل بالكمية المحددة
    if (e.target.id === 'addToCartFromDetailsBtn') {
        const productId = e.target.dataset.id;
        const qtyInput = document.getElementById('detailQtyInput');
        const quantity = parseInt(qtyInput.value) || 1;
        
        const product = localProductsArray.find(p => p.id === productId);
        if (product) {
            addToCart(product, quantity);
            renderCartUI();
            showAlert(`تم إضافة ${quantity} من "${product.name}" إلى السلة!`, "success");
            
            const modalElement = document.getElementById('productDetailsModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }
        return;
    }

    // ج: الضغط على كارت المنتج بالكامل لفتح تفاصيله والـ Slider
    if (e.target.closest('.product-card')) {
        const card = e.target.closest('.product-card');
        const productId = card.querySelector('.btn-add-to-cart').dataset.id;
        
        const product = localProductsArray.find(p => p.id === productId);
        if (product) {
            openProductDetailsModal(product); 
        }
        return;
    }

    // د: زرار زيادة الكمية (+) داخل السلة
    if (e.target.classList.contains('btn-increase')) {
        const productId = e.target.dataset.id;
        const cart = getCart();
        const currentItem = cart.find(item => item.productId === productId);
        if (currentItem) {
            updateCartQuantity(productId, currentItem.quantity + 1);
            renderCartUI();
        }
    }

    // هـ: زرار تقليل الكمية (-) داخل السلة
    if (e.target.classList.contains('btn-decrease')) {
        const productId = e.target.dataset.id;
        const cart = getCart();
        const currentItem = cart.find(item => item.productId === productId);
        if (currentItem) {
            updateCartQuantity(productId, currentItem.quantity - 1);
            renderCartUI();
        }
    }

    // و: زرار مسح عنصر من السلة تماماً
    if (e.target.closest('.btn-remove')) {
        const button = e.target.closest('.btn-remove');
        const productId = button.dataset.id;
        removeFromCart(productId);
        renderCartUI();
        showAlert("تم إزالة المنتج من السلة.", "danger");
    }
});

// === 3. فورم إتمام الشراء والتوصيل (تم التحديث لإضافة الـ Loading) ===
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = getCart();
        if (cart.length === 0) {
            showAlert("سلتك فارغة! قم بإضافة منتجات أولاً.", "danger");
            return;
        }

        // جلب عناصر زر الإرسال للتحكم في الـ Loading
        const submitBtn = document.getElementById('submitOrderBtn');
        const spinner = document.getElementById('orderBtnSpinner');
        const btnText = document.getElementById('orderBtnText');

        const inputs = checkoutForm.querySelectorAll('input, textarea');
        const customer_name = inputs[0].value.trim();
        const customer_phone = inputs[1].value.trim();
        const customer_address = inputs[2].value.trim();
        const notes = inputs[3] ? inputs[3].value.trim() : "";

        const orderData = {
            customer_name,
            customer_phone,
            customer_address,
            notes: notes || null,
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price_at_purchase: item.price_at_purchase
            }))
        };

        try {
            // ⏳ 1. تشغيل الـ Loading وتعطيل الزرار لمنع تكرار الضغط
            if (submitBtn) submitBtn.disabled = true;
            if (spinner) spinner.classList.remove('d-none');
            if (btnText) btnText.textContent = "جاري إرسال طلبك...";

            // إرسال الطلب الفعلي للسيرفر والانتظار
            await createOrder(STORE_SLUG, orderData);
            
            //  2. إظهار رسالة النجاح الكبيرة بعد انتهاء التحميل
            showAlert("تم إرسال طلبك بنجاح! شكراً لتسوقك معنا.", "success");
            
            // تنظيف السلة والفورم
            clearCart();
            renderCartUI();
            checkoutForm.reset();
            
            // إغلاق المودال الخاص بالسلة تلقائياً
            const modalElement = document.getElementById('cartModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            
        } catch (error) {
            console.error("Checkout submission failed:", error);
            showAlert(error.message || "حدث خطأ أثناء معالجة طلبك، حاول مرة أخرى.", "danger");
        } finally {
            // 🔄 3. إعادة الزرار لوضعه الطبيعي في كل الأحوال (نجاح أو فشل)
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
            if (btnText) btnText.textContent = "إتمام الطلب وتأكيد الشراء";
        }
    });
}