const CART_STORAGE_KEY = "a7_store_cart";

export function getCart() {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/**
 * إضافة منتج إلى السلة أو زيادة كميته
 */
export function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // قراءة أول صورة ديناميكية للمنتج من الـ JSON
        const firstImage = product.images && product.images.length > 0 ? product.images[0].image_url : null;
        
        // حساب سعر الشراء بناءً على وجود خصم (sale_price) أو السعر الأصلي
        const finalPrice = product.sale_price && product.sale_price > 0 && product.sale_price < product.price 
            ? product.sale_price 
            : product.price;

        cart.push({
            productId: product.id,
            name: product.name,
            image: firstImage,
            price_at_purchase: finalPrice,
            quantity: quantity
        });
    }

    saveCart(cart);
}

export function updateCartQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const cart = getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
        item.quantity = newQuantity;
        saveCart(cart);
    }
}

export function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.productId !== productId);
    saveCart(cart);
}

export function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

export function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price_at_purchase * item.quantity), 0);
}

export function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
}