/* index.js - Logic for the landing page */

document.addEventListener("DOMContentLoaded", () => {
    loadSeasonalProducts();
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
    if (!slider) return;

    try {
        const response = await fetch("product.json");
        const data = await response.json();
        const allProducts = data.products;
        
        const currentSeason = getCurrentSeason();
        title.textContent = `${currentSeason} Collection Highlights`;

        const seasonalProducts = allProducts.filter(p => p.season === currentSeason);

        if (seasonalProducts.length === 0) {
            slider.innerHTML = '<p class="empty-state">No products found for this season.</p>';
            return;
        }

        const productHTML = seasonalProducts.map(product => `
            <a href="products.html?search=${encodeURIComponent(product.name)}" class="slider-card">
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

        startAutoScroll(slider);

    } catch (err) {
        console.error("Failed to load products for slider:", err);
        slider.innerHTML = '<p class="empty-state">Could not load seasonal products.</p>';
    }
}

function startAutoScroll(slider) {
    let scrollSpeed = 1; // Pixels per frame
    let isPaused = false;
    const prevBtn = document.getElementById("slider-prev");
    const nextBtn = document.getElementById("slider-next");

    function step() {
        if (!isPaused) {
            slider.scrollLeft += scrollSpeed;

            // Seamless loop: if we've scrolled past the first set of items, jump back to the start
            if (slider.scrollLeft >= slider.scrollWidth / 2) {
                slider.scrollLeft = 0;
            }
        }
        requestAnimationFrame(step);
    }

    // Manual navigation logic
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const halfWidth = slider.scrollWidth / 2;
            slider.scrollLeft -= 320; // Scroll back by a bit more than one card

            // If we go below 0, jump to the same relative position in the second set
            if (slider.scrollLeft <= 0) {
                slider.scrollLeft += halfWidth;
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const halfWidth = slider.scrollWidth / 2;
            slider.scrollLeft += 320; // Scroll forward

            // If we go past the first set, jump back to the same relative position in the first set
            if (slider.scrollLeft >= halfWidth) {
                slider.scrollLeft -= halfWidth;
            }
        });
    }

    // Pause scrolling on hover of the wrapper or buttons
    const wrapper = slider.closest(".slider-wrapper");
    if (wrapper) {
        wrapper.addEventListener("mouseenter", () => isPaused = true);
        wrapper.addEventListener("mouseleave", () => isPaused = false);
    }

    // Initial start
    requestAnimationFrame(step);
}
