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

    // Handle form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fname = document.getElementById('fname').value.trim();
            const prenom = document.getElementById('prenom').value.trim();
            const email = document.getElementById('email').value.trim();
            const number = document.getElementById('number').value.trim();
            const pass = document.getElementById('pass').value;
            const pass_word = document.getElementById('pass_word').value;
            const gender = document.querySelector('input[name="gender"]:checked').value;

            // Validate passwords match
            if (pass !== pass_word) {
                showToast('Passwords do not match');
                return;
            }

            // Check if email already exists in users-db.js
            const emailInDb = EQUINOX_USER_DATABASE.some(user => user.email === email);
            if (emailInDb) {
                showToast('Email is already taken');
                return;
            }

            // Get existing users from localStorage
            const existingUsers = JSON.parse(localStorage.getItem('equinox-users') || '[]');
            
            // Check if email already exists in localStorage
            const emailInLocalStorage = existingUsers.some(user => user.email === email);
            if (emailInLocalStorage) {
                showToast('Email is already taken');
                return;
            }

            // Create new user object
            const newUser = {
                familyName: fname,
                name: prenom,
                email: email,
                phone: number,
                password: pass,
                gender: gender === 'M' ? 'Male' : 'Female',
                role: 'client'
            };

            // Save to localStorage
            existingUsers.push(newUser);
            localStorage.setItem('equinox-users', JSON.stringify(existingUsers));

            // Auto-login the user
            localStorage.setItem('equinox-current-user', JSON.stringify(newUser));

            showToast('Registration successful! You are now logged in.');

            // Close popup and refresh parent if opened as popup
            if (window.opener && !window.opener.closed) {
                setTimeout(() => {
                    window.opener.location.reload();
                    window.close();
                }, 1500);
            } else {
                // If not opened as popup, redirect to home
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            }
        });
    }
});