/* register.js */
document.addEventListener("DOMContentLoaded", () => {
    // If opened as a popup (or navigated to within a popup), smoothly resize to fit all elements
    if (window.name === 'register' || window.name === 'popup') {
        smoothResizeTo(550, 950);
    }

    // Enforce numeric only and exactly 10 digits for phone
    const numberInput = document.getElementById('number');
    if (numberInput) {
        numberInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
    }
});