/* login.js - Specific logic for login page */
window.onload = function() {
    // If opened as a popup, smoothly resize to the appropriate dimensions
    if (window.name === 'popup') {
        smoothResizeTo(520, 800);
    }

    // Handle form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Check against users-db.js (using email as username)
            let user = EQUINOX_USER_DATABASE.find(u => u.email === username && u.password === password);

            // If not found in users-db.js, check localStorage
            if (!user) {
                const localUsers = JSON.parse(localStorage.getItem('equinox-users') || '[]');
                user = localUsers.find(u => u.email === username && u.password === password);
            }

            if (user) {
                // Save logged in user to localStorage
                localStorage.setItem('equinox-current-user', JSON.stringify(user));
                showToast('Login successful!', false, 'success');
                
                // Close popup and refresh parent if opened as popup
                if (window.opener && !window.opener.closed) {
                    window.opener.location.reload();
                    window.close();
                } else {
                    // If opened directly, redirect to home
                    window.location.href = '../index.html';
                }
            } else {
                showToast('Invalid credentials', true, 'error');
            }
        });
    }
};

