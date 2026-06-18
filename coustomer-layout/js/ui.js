import { getCart, removeFromCart, updateCartQuantity, getCartTotal, getCartCount } from './cart.js';

/**
 * رسم كروت المنتجات داخل صفحة المتجر
 */
export function renderProducts(products) {
    const productsContainer = document.getElementById('products');
    const row = productsContainer.querySelector('.row');
    
    if (!products || products.length === 0) {
        row.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-box-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">لا توجد منتجات متوفرة حالياً في هذا المتجر.</p>
            </div>
        `;
        return;
    }

    row.innerHTML = products.map(product => {
        const hasDiscount = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
        const displayPrice = hasDiscount ? product.sale_price : product.price;
        
        // استخراج أول رابط صورة من الـ Supabase بشكل آمن
        const mainImage = product.images && product.images.length > 0 ? product.images[0].image_url : null;

        return `
            <div class="col">
                <div class="card h-100 product-card" style="cursor: pointer;">
                    <div class="position-relative overflow-hidden card-img-container">
                        ${hasDiscount ? `<span class="badge bg-danger position-absolute top-2 start-2 z-3">خصم</span>` : ''}
                        <div class="product-img-placeholder d-flex align-items-center justify-content-center" style="height: 200px; background-color: #1a1a1a;">
                            ${mainImage 
                                ? `<img src="${mainImage}" class="card-img-top h-100 w-100 object-fit-cover" alt="${product.name}">` 
                                : `<i class="fa-regular fa-image fa-2x text-muted"></i>`}
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-truncate">${product.name}</h5>
                        <p class="card-text text-muted flex-grow-1 text-sm">${product.description || 'لا يوجد وصف لهذا المنتج.'}</p>
                        <div class="d-flex align-items-center justify-content-between my-2">
                            <div>
                                <span class="fw-bold text-accent fs-5">${displayPrice} ج.م</span>
                                ${hasDiscount ? `<span class="text-decoration-line-through text-muted text-xs ms-2">${product.price} ج.م</span>` : ''}
                            </div>
                        </div>
                        <button class="btn btn-add-to-cart w-100 mt-2" data-id="${product.id}">
                            <i class="fa-solid fa-plus me-1"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function renderStoreInfo(store) {
    const storeLogo = document.getElementById('store-logo');
    const storeName = document.getElementById('store-name');
    store.logo_url ? storeLogo.innerHTML = `<img src="${store.logo_url}" alt="${store.name}" class="store-logo-img w-100">` : storeLogo.innerHTML = `<i class="fa-solid fa-shop"></i>`;
    storeName.textContent = store.name || "متجر غير معروف";
}
/**
 * فتح لوحة تفاصيل المنتج ومعرض الصور (Slider) بالكامل ديناميكياً
 */
export function openProductDetailsModal(product) {
    const modalTitle = document.getElementById('detailProductName');
    const title = document.getElementById('detailProductTitle');
    const price = document.getElementById('detailProductPrice');
    const oldPrice = document.getElementById('detailProductOldPrice');
    const desc = document.getElementById('detailProductDesc');
    const mainImage = document.getElementById('sliderMainImage');
    const thumbnailsContainer = document.getElementById('sliderThumbnailsContainer');
    const qtyInput = document.getElementById('detailQtyInput');
    const addToCartBtn = document.getElementById('addToCartFromDetailsBtn');
    
    qtyInput.value = 1; // تعيين الكمية الأولية

    modalTitle.textContent = `تفاصيل: ${product.name}`;
    title.textContent = product.name;
    desc.textContent = product.description || "لا يوجد وصف تفصيلي متوفر لهذا المنتج حالياً.";
    
    const hasDiscount = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
    if (hasDiscount) {
        price.textContent = `${product.sale_price} ج.م`;
        oldPrice.textContent = `${product.price} ج.m`;
        oldPrice.classList.remove('d-none');
    } else {
        price.textContent = `${product.price} ج.م`;
        oldPrice.classList.add('d-none');
    }

    // هندسة الـ Slider للصور
    const imagesList = product.images && product.images.length > 0 
        ? product.images.map(img => img.image_url)
        : ['']; 
        
    let currentImageIndex = 0;

    function updateSliderDisplay() {
        if (imagesList[currentImageIndex]) {
            mainImage.src = imagesList[currentImageIndex];
            mainImage.classList.remove('d-none');
        } else {
            mainImage.src = '';
            mainImage.classList.add('d-none');
        }
        
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail-img');
        thumbnails.forEach((thumb, idx) => {
            if (idx === currentImageIndex) {
                thumb.classList.add('active');
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    if (product.images && product.images.length > 1) {
        thumbnailsContainer.innerHTML = product.images.map((img, idx) => `
            <img src="${img.image_url}" class="thumbnail-img ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        `).join('');
    } else {
        thumbnailsContainer.innerHTML = ''; 
    }

    updateSliderDisplay();

    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    
    if (imagesList.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }

    // تنظيف الـ Event Listeners القديمة عن طريق الاستبدال
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex === 0) ? imagesList.length - 1 : currentImageIndex - 1;
        updateSliderDisplay();
    });

    newNextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex === imagesList.length - 1) ? 0 : currentImageIndex + 1;
        updateSliderDisplay();
    });

    thumbnailsContainer.onclick = (e) => {
        if (e.target.classList.contains('thumbnail-img')) {
            currentImageIndex = parseInt(e.target.dataset.index);
            updateSliderDisplay();
        }
    };

    // التحكم بالكمية داخل الـ Modal
    const decQty = document.getElementById('decreaseDetailQty');
    const incQty = document.getElementById('increaseDetailQty');
    
    const newDecQty = decQty.cloneNode(true);
    const newIncQty = incQty.cloneNode(true);
    decQty.parentNode.replaceChild(newDecQty, decQty);
    incQty.parentNode.replaceChild(newIncQty, incQty);

    newDecQty.addEventListener('click', () => {
        if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    });
    newIncQty.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    // إعداد زرار أضف للسلة من التفاصيل
    const newAddToCartBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
    newAddToCartBtn.setAttribute('data-id', product.id);

    const modalElement = document.getElementById('productDetailsModal');
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
}

/**
 * تحديث واجهة سلة المشتريات بالكامل
 */
export function renderCartUI() {
    const cartItemsContainer = document.querySelector('#cartModal .modal-body .cart-item-list') 
        || createCartListContainer();
    
    const cart = getCart();

    const cartBadges = document.querySelectorAll('.btn-cart .badge');
    cartBadges.forEach(badge => {
        badge.textContent = getCartCount();
    });

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fa-solid fa-basket-shopping fa-2x mb-2"></i>
                <p class="mb-0">سلة المشتريات فارغة</p>
            </div>
        `;
        document.querySelector('#cartModal .fs-4').textContent = '0 ج.م';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom-dark-thin">
            <div class="cart-item-img-placeholder me-3 overflow-hidden d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; background-color: #2b2b2b; border-radius: 6px;">
                ${item.image 
                    ? `<img src="${item.image}" class="w-100 h-100 object-fit-cover" alt="">` 
                    : `<i class="fa-regular fa-image text-muted"></i>`}
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1 fw-bold text-truncate" style="max-width: 180px;">${item.name}</h6>
                <div class="d-flex align-items-center mt-1">
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2 btn-decrease" data-id="${item.productId}">-</button>
                    <span class="mx-2 text-sm fw-bold">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2 btn-increase" data-id="${item.productId}">+</button>
                    <span class="text-accent text-sm ms-3 fw-bold">${item.price_at_purchase * item.quantity} ج.م</span>
                </div>
            </div>
            <button class="btn text-danger btn-sm btn-remove" data-id="${item.productId}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    document.querySelector('#cartModal .fs-4').textContent = `${getCartTotal()} ج.م`;
}

function createCartListContainer() {
    const modalBody = document.querySelector('#cartModal .modal-body');
    const listDiv = document.createElement('div');
    listDiv.className = 'cart-item-list';
    modalBody.insertBefore(listDiv, document.getElementById('checkoutForm'));
    return listDiv;
}

export function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-4 start-50 translate-middle-x z-3`;
    alertDiv.style.minWidth = '300px';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <strong>${type === 'success' ? '🚀 نجاح!' : '⚠️ تنبيه!'}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 4000);
}