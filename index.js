/* index.js - Logic for the landing page */

let scrollAnimationFrame;
let currentScrollX = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadSeasonalProducts();
    renderCategoryGrid();
});

function getCurrentSeason() {
    const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('preferred-theme');
    if (theme) {
        return theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    const month = new Date().getMonth();
    return (month >= 3 && month <= 8) ? "Summer" : "Winter";
}

function seasonIcon(season) {
    return season === "Winter" ? "❄️" : "☀️";
}

async function loadSeasonalProducts() {
    const slider = document.getElementById("seasonal-slider");
    const title = document.getElementById("seasonal-title");
    const wrapper = document.querySelector(".slider-wrapper");
    const headerWrap = document.querySelector(".slider-header-wrap");
    const categoryGrid = document.getElementById("category-capsule-grid");
    if (!slider || !title || !wrapper) return;

    // Start fade out if slider already has content
    if (slider.children.length > 0) {
        if (categoryGrid) categoryGrid.classList.add("fading");
        if (headerWrap) headerWrap.classList.add("fading");
        else title.classList.add("fading");
        wrapper.classList.add("fading");
        // Wait for 0.6s fade transition (as requested)
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    renderCategoryGrid(); // Refresh macro-grid categories to match season

    try {
        const response = await fetch("product.json");
        const data = await response.json();
        const allProducts = data.products;
        
        const currentSeason = getCurrentSeason();
        title.textContent = `${currentSeason} Collection Highlights`;

        const seasonalProducts = allProducts.filter(p => p.season === currentSeason);

        if (seasonalProducts.length === 0) {
            slider.innerHTML = '<p class="empty-state">No products found for this season.</p>';
            title.classList.remove("fading");
            wrapper.classList.remove("fading");
            return;
        }

        const productHTML = seasonalProducts.map(product => `
            <a href="product-details.html?id=${product.id}" class="slider-card">
                <div class="slider-card-image">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        onerror="this.parentElement.innerHTML='${seasonIcon(product.season)}'"
                    >
                </div>
                <div class="slider-card-body">
                    <span class="slider-card-category">${product.category}</span>
                    <h4 class="slider-card-name">${product.name}</h4>
                    <span class="slider-card-price">$${product.price.toFixed(2)}</span>
                </div>
            </a>
        `).join("");

        // Inject original products + a clone of the same products for seamless looping
        slider.innerHTML = productHTML + productHTML;
        
        // Reset scroll position for new season
        slider.scrollLeft = 0;
        currentScrollX = 0;

        // Start movement logic
        startAutoScroll(slider);
        
        // Fade back in
        if (categoryGrid) categoryGrid.classList.remove("fading");
        if (headerWrap) headerWrap.classList.remove("fading");
        title.classList.remove("fading");
        wrapper.classList.remove("fading");

    } catch (err) {
        console.error("Failed to load products for slider:", err);
        slider.innerHTML = '<p class="empty-state">Could not load seasonal products.</p>';
        if (categoryGrid) categoryGrid.classList.remove("fading");
        if (headerWrap) headerWrap.classList.remove("fading");
        title.classList.remove("fading");
        wrapper.classList.remove("fading");
    }
}

/**
 * Renders the 2x3 category capsule grid based on the active season.
 */
function renderCategoryGrid() {
    const grid = document.getElementById("category-capsule-grid");
    if (!grid) return;

    const currentSeason = getCurrentSeason();
    const categories = currentSeason === "Winter"
        ? ['Coats', 'Tops', 'Shirts', 'Bottoms', 'Accessories', 'Sportswear']
        : ['Shirts', 'T-Shirts', 'Bottoms', 'Dresses', 'Accessories', 'Sportswear'];

    grid.innerHTML = categories.map(cat => `
        <a href="products.html?season=${currentSeason.toLowerCase()}&category=${encodeURIComponent(cat.toLowerCase())}" class="category-capsule">
            ${cat}
        </a>
    `).join('');
}

function startAutoScroll(slider) {
    // Cancel any existing animation to prevent speed buildup
    if (scrollAnimationFrame) {
        cancelAnimationFrame(scrollAnimationFrame);
    }

    let baseSpeed = 0.8; 
    let direction = 1; // 1 for right, -1 for left
    let isPaused = false;
    const prevBtn = document.getElementById("slider-prev");
    const nextBtn = document.getElementById("slider-next");

    function step() {
        if (!isPaused && slider.scrollWidth > slider.clientWidth) {
            currentScrollX += baseSpeed * direction;
            slider.scrollLeft = Math.floor(currentScrollX);

            const halfWidth = slider.scrollWidth / 2;
            
            // Rightward loop
            if (direction === 1 && currentScrollX >= halfWidth) {
                currentScrollX = 0;
                slider.scrollLeft = 0;
            } 
            // Leftward loop
            else if (direction === -1 && currentScrollX <= 0) {
                currentScrollX = halfWidth;
                slider.scrollLeft = halfWidth;
            }
        }
        scrollAnimationFrame = requestAnimationFrame(step);
    }

    // Common logic for arrows
    const setupArrow = (btn, dir) => {
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
            direction = dir;
            // Jump the scroll slightly for immediate feedback
            currentScrollX += 260 * dir; 
            slider.scrollLeft = Math.floor(currentScrollX);
        });
    };

    if (prevBtn) setupArrow(prevBtn, -1);
    if (nextBtn) setupArrow(nextBtn, 1);

    // ── Touch Swipe & Mouse Drag Logic ──
    let isDragging = false;
    let startX;
    let scrollLeftStart;

    const startDragging = (e) => {
        isDragging = true;
        isPaused = true;
        slider.classList.add('grabbing');
        startX = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        scrollLeftStart = slider.scrollLeft;
        currentScrollX = slider.scrollLeft; // Sync our internal tracker
    };

    const stopDragging = () => {
        if (!isDragging) return;
        isDragging = false;
        isPaused = false;
        slider.classList.remove('grabbing');
    };

    const moveDragging = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        
        currentScrollX = scrollLeftStart - walk;
        
        // Handle directional memory: if they drag left, change auto-scroll direction to -1
        if (walk < 0) direction = 1;
        if (walk > 0) direction = -1;

        slider.scrollLeft = Math.floor(currentScrollX);

        // Loop handling during drag
        const halfWidth = slider.scrollWidth / 2;
        if (slider.scrollLeft >= halfWidth) {
            currentScrollX -= halfWidth;
            scrollLeftStart -= halfWidth;
        } else if (slider.scrollLeft <= 0) {
            currentScrollX += halfWidth;
            scrollLeftStart += halfWidth;
        }
    };

    slider.addEventListener('mousedown', startDragging);
    slider.addEventListener('touchstart', startDragging, { passive: false });
    
    window.addEventListener('mousemove', moveDragging);
    window.addEventListener('touchmove', moveDragging, { passive: false });
    
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchend', stopDragging);

    // Pause scrolling on hover
    const wrapper = slider.closest(".slider-wrapper");
    if (wrapper && !wrapper.dataset.listenerAttached) {
        wrapper.addEventListener("mouseenter", (e) => {
            if (e.target === wrapper) isPaused = true;
        });
        wrapper.addEventListener("mouseleave", () => isPaused = false);
        wrapper.dataset.listenerAttached = "true";
    }

    // Initial start
    scrollAnimationFrame = requestAnimationFrame(step);
}
