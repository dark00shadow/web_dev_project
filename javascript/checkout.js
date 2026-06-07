function initLocationDropdown(select) {
    const wrapper = select.closest('.location-dropdown');
    const trigger = wrapper.querySelector('.location-dropdown-trigger');
    const valueSpan = trigger.querySelector('.location-dropdown-value');
    const menu = wrapper.querySelector('.location-dropdown-menu');
    const placeholder = select.querySelector('option[value=""]')?.textContent || 'Select…';

    const syncMenu = () => {
        menu.innerHTML = '';
        [...select.options].forEach(opt => {
            if (!opt.value) return;

            const item = document.createElement('li');
            item.className = 'location-dropdown-item';
            item.role = 'option';
            item.dataset.value = opt.value;
            item.textContent = opt.textContent;
            item.setAttribute('aria-selected', select.value === opt.value ? 'true' : 'false');
            if (select.value === opt.value) item.classList.add('selected');

            item.addEventListener('click', () => choose(opt.value, opt.textContent));
            menu.appendChild(item);
        });
    };

    const choose = (value, label) => {
        select.value = value;
        valueSpan.textContent = label;
        menu.querySelectorAll('.location-dropdown-item').forEach(item => {
            const isSelected = item.dataset.value === value;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
        close();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const open = () => {
        if (select.disabled) return;
        syncMenu();
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        wrapper.classList.add('open');
    };

    const close = () => {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        wrapper.classList.remove('open');
    };

    const reset = () => {
        select.value = '';
        valueSpan.textContent = placeholder;
        close();
        menu.innerHTML = '';
    };

    const setDisabled = (disabled) => {
        select.disabled = disabled;
        trigger.disabled = disabled;
        if (disabled) close();
    };

    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (wrapper.classList.contains('open')) close();
        else open();
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) close();
    });

    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (wrapper.classList.contains('open')) close();
            else open();
        }
    });

    return { syncMenu, reset, setDisabled, close };
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('checkout-form');
    const backBtn = document.getElementById('back-to-cart');
    const wilayaSelect = document.getElementById('wilaya');
    const municipalitySelect = document.getElementById('municipality');
    const municipalityGroup = document.getElementById('municipality-group');
    const deliveryMethodSelect = document.getElementById('delivery-method');
    const paymentSelect = document.getElementById('payment');
    const paymentError = document.getElementById('payment-error');
    const locationInput = document.getElementById('location');
    const locationLabel = document.querySelector('label[for="location"]');

    const wilayaDropdown = initLocationDropdown(wilayaSelect);
    const municipalityDropdown = initLocationDropdown(municipalitySelect);

    if (window.name === 'checkout') {
        smoothResizeTo(550, 900);
    }

    // Auto-fill form with logged-in user's information
    const currentUser = getCurrentUser();
    if (currentUser) {
        const fnameInput = document.getElementById('fname');
        const prenomInput = document.getElementById('prenom');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');

        if (fnameInput && currentUser.familyName) {
            fnameInput.value = currentUser.familyName;
        }
        if (prenomInput && currentUser.name) {
            prenomInput.value = currentUser.name;
        }
        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
        }
        if (phoneInput && currentUser.phone) {
            phoneInput.value = currentUser.phone;
        }
    }

    // Visually dim unsupported payment options and add tooltips
    [...paymentSelect.options].forEach(opt => {
        if (opt.value === 'bank' || opt.value === 'edahabia') {
            opt.style.color = 'var(--text-muted-heavy)';
            opt.style.fontStyle = 'italic';
            opt.title = 'Coming soon';
            opt.textContent += ' (Coming soon)';
        }
    });

    const updateLocationFieldState = () => {
        const isCenterDelivery = deliveryMethodSelect.value === 'center';

        if (isCenterDelivery) {
            locationLabel.textContent = 'Shipping Location (Optional)';
            locationInput.placeholder = 'Full address (Optional)';
        } else {
            locationLabel.textContent = 'Shipping Location';
            locationInput.placeholder = 'Full address';
        }

        if (isCenterDelivery && locationInput.value.trim() === '') {
            locationInput.classList.remove('invalid');
            const err = locationInput.parentNode.querySelector('.error-message');
            if (err) {
                err.textContent = '';
                err.style.display = 'none';
            }
        }

        if (typeof window.refreshCheckoutValidation === 'function') {
            window.refreshCheckoutValidation();
        }
    };

    // Handle unsupported payment methods
    paymentSelect.addEventListener('change', () => {
        if (paymentSelect.value !== 'delivery') {
            showToast('Payment is not supported yet', true, 'error');
            if (paymentError) paymentError.style.display = 'block';
        } else {
            if (paymentError) paymentError.style.display = 'none';
        }
        if (typeof window.refreshCheckoutValidation === 'function') {
            window.refreshCheckoutValidation();
        }
    });

    // Enforce numeric only and exactly 10 digits for phone
    const phoneInput = form.querySelector('#phone');
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (typeof window.refreshCheckoutValidation === 'function') {
            window.refreshCheckoutValidation();
        }
    });

    deliveryMethodSelect.addEventListener('change', updateLocationFieldState);

    backBtn.addEventListener('click', () => {
        if (window.opener && !window.opener.closed) {
            window.close();
        } else {
            window.location.href = 'cart.html';
        }
    });

    let wilayas = [];

    fetch('../json/location.json')
        .then(res => res.json())
        .then(data => {
            wilayas = data.wilayas;
            wilayas.forEach(w => {
                const option = document.createElement('option');
                option.value = w.id;
                option.textContent = `${w.id} — ${w.name}`;
                wilayaSelect.appendChild(option);
            });
            wilayaDropdown.syncMenu();
            if (typeof window.refreshCheckoutValidation === 'function') {
                window.refreshCheckoutValidation();
            }
        })
        .catch(() => {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Unable to load wilayas';
            wilayaSelect.appendChild(option);
            wilayaDropdown.setDisabled(true);
        });

    wilayaSelect.addEventListener('change', () => {
        const selected = wilayas.find(w => w.id === wilayaSelect.value);

        municipalitySelect.innerHTML = '<option value="" disabled selected>Select a Municipality</option>';
        municipalityDropdown.reset();

        if (!selected) {
            municipalityGroup.classList.add('hidden');
            municipalityDropdown.setDisabled(true);
            municipalitySelect.dispatchEvent(new Event('change'));
            return;
        }

        selected.Municipalities.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            municipalitySelect.appendChild(option);
        });

        municipalityGroup.classList.remove('hidden');
        municipalityDropdown.setDisabled(false);
        municipalityDropdown.syncMenu();
        municipalitySelect.dispatchEvent(new Event('change'));
    });

    async function buildOrderFromCart() {
        const cart = getCheckoutCart();
        if (!cart.length) return null;

        const response = await fetch('../json/product.json');
        const data = await response.json();
        const products = data.products;

        const items = cart.map(entry => {
            const product = products.find(p => p.id === entry.id);
            return {
                id: entry.id,
                name: product?.name || 'Unknown Item',
                qty: entry.qty,
                size: entry.size,
                price: product?.price || 0
            };
        });

        const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const wilayaOption = wilayaSelect.options[wilayaSelect.selectedIndex];
        const wilayaName = wilayaOption?.textContent?.split('—')[1]?.trim() || wilayaSelect.value;

        return {
            customer: {
                fname: form.querySelector('#fname').value.trim(),
                prenom: form.querySelector('#prenom').value.trim(),
                email: form.querySelector('#email').value.trim(),
                phone: form.querySelector('#phone').value.trim()
            },
            shipping: {
                municipality: municipalitySelect.value,
                wilaya: wilayaName,
                address: locationInput.value.trim(),
                deliveryMethod: deliveryMethodSelect.value
            },
            payment: paymentSelect.value,
            items,
            total
        };
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn.disabled) return;

        const orderData = await buildOrderFromCart();
        if (!orderData) {
            showToast('Your cart is empty.');
            return;
        }

        const order = saveConfirmedOrder(orderData);
        
        // Decrease stock in localStorage for each item in the order
        const cart = getCheckoutCart();
        cart.forEach(item => {
            decreaseProductStock(item.id, item.size, item.qty);
        });
        
        clearCheckoutCart();
        
        // Notify opener window to update cart UI if it's still on cart page
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({ type: 'cartCleared' }, '*');
            } catch (e) {
                // Cross-origin restriction, ignore
            }
        }
        
        showToast(`Order ${order.id} confirmed! Redirecting…`);

        const redirectToOrders = () => {
            if (window.opener && !window.opener.closed) {
                window.opener.location.href = 'orders.html';
                window.close();
            } else {
                window.location.href = 'orders.html';
            }
        };

        setTimeout(redirectToOrders, 1200);
    });
});
