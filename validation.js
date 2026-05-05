/* validation.js - Form validation using RegEx */

/**
 * Validation Regex Patterns
 */
const patterns = {
    username: /^[a-z0-9]{3,16}$/i, // Alphanumeric, 3-16 chars
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    // Min 8 chars, 1 upper, 1 lower, 1 number, 1 special
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    phone: /^\+?[0-9\s-]{8,20}$/, // Basic international phone format
    name: /^[a-zA-Z\s]{2,30}$/ // Alpha and spaces, 2-30 chars
};

/**
 * Validates a field and updates the UI
 */
function validateField(input, pattern, errorMessage) {
    if (!input) return false;
    
    const value = input.value.trim();
    const isValid = pattern.test(value);
    
    // Find or create error message element
    let errorDisplay = input.parentNode.querySelector('.error-message');
    if (!errorDisplay) {
        errorDisplay = document.createElement('span');
        errorDisplay.classList.add('error-message');
        input.parentNode.appendChild(errorDisplay);
    }

    if (!isValid && value !== '') { // Don't show error if empty until submit (optional UX choice, but we'll show it if invalid)
        input.classList.add('invalid');
        errorDisplay.textContent = errorMessage;
        errorDisplay.style.display = 'block';
    } else if (isValid) {
        input.classList.remove('invalid');
        errorDisplay.textContent = '';
        errorDisplay.style.display = 'none';
    } else {
        // If empty, just show invalid state but maybe different message or same
        input.classList.add('invalid');
        errorDisplay.textContent = errorMessage;
        errorDisplay.style.display = 'block';
    }
    
    return isValid;
}

/**
 * Setup validation for Login form
 */
function setupLoginValidation() {
    const form = document.querySelector('form');
    if (!form || !document.getElementById('username')) return;

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('.submit-btn');

    // Function to check overall validity and toggle button
    const checkFormValidity = () => {
        const isUserValid = patterns.username.test(usernameInput.value.trim());
        const isPassValid = patterns.password.test(passwordInput.value.trim());
        submitBtn.disabled = !(isUserValid && isPassValid);
    };

    // Attach Blur events to show UI errors when user leaves the field
    usernameInput.addEventListener('blur', () => validateField(usernameInput, patterns.username, "Username must be 3-16 alphanumeric characters."));
    passwordInput.addEventListener('blur', () => validateField(passwordInput, patterns.password, "Password is invalid or too short."));

    // Attach Input events to check validity in real-time for the button state
    // and also clear errors if the user fixes them while typing
    const handleInput = (input, pattern, errorMessage) => {
        checkFormValidity();
        if (input.classList.contains('invalid')) {
            validateField(input, pattern, errorMessage);
        }
    };

    usernameInput.addEventListener('input', () => handleInput(usernameInput, patterns.username, "Username must be 3-16 alphanumeric characters."));
    passwordInput.addEventListener('input', () => handleInput(passwordInput, patterns.password, "Password is invalid or too short."));

    // Initial check to set button state
    checkFormValidity();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Since button is disabled unless valid, if they click it, it is valid.
        // But just in case:
        const isUserValid = validateField(usernameInput, patterns.username, "Username must be 3-16 alphanumeric characters.");
        const isPassValid = validateField(passwordInput, patterns.password, "Password is invalid or too short.");

        if (isUserValid && isPassValid) {
            alert("Login Successful! (Simulated)");
        }
    });
}

/**
 * Setup validation for Register form
 */
function setupRegisterValidation() {
    const form = document.querySelector('form');
    if (!form || !document.getElementById('fname')) return;

    const fname = document.getElementById('fname');
    const prenom = document.getElementById('prenom');
    const email = document.getElementById('email');
    const number = document.getElementById('number');
    const pass = document.getElementById('pass');
    const pass_word = document.getElementById('pass_word');
    const submitBtn = form.querySelector('.submit-btn');

    const checkFormValidity = () => {
        const isFnameValid = patterns.name.test(fname.value.trim());
        const isPrenomValid = patterns.name.test(prenom.value.trim());
        const isEmailValid = patterns.email.test(email.value.trim());
        const isNumberValid = patterns.phone.test(number.value.trim());
        const isPassValid = patterns.password.test(pass.value.trim());
        const isPassMatch = pass.value === pass_word.value && pass.value !== '';

        submitBtn.disabled = !(isFnameValid && isPrenomValid && isEmailValid && isNumberValid && isPassValid && isPassMatch);
    };

    // Helper for confirm password blur
    const validateConfirmPassword = () => {
        const isValid = pass.value === pass_word.value && pass_word.value !== '';
        let errorDisplay = pass_word.parentNode.querySelector('.error-message');
        if (!errorDisplay) {
            errorDisplay = document.createElement('span');
            errorDisplay.classList.add('error-message');
            pass_word.parentNode.appendChild(errorDisplay);
        }
        
        if (!isValid) {
            pass_word.classList.add('invalid');
            errorDisplay.textContent = "Passwords do not match.";
            errorDisplay.style.display = 'block';
        } else {
            pass_word.classList.remove('invalid');
            errorDisplay.textContent = '';
            errorDisplay.style.display = 'none';
        }
        return isValid;
    };

    // Attach Blur events
    fname.addEventListener('blur', () => validateField(fname, patterns.name, "Family name should be 2-30 letters."));
    prenom.addEventListener('blur', () => validateField(prenom, patterns.name, "Name should be 2-30 letters."));
    email.addEventListener('blur', () => validateField(email, patterns.email, "Please enter a valid email address."));
    number.addEventListener('blur', () => validateField(number, patterns.phone, "Please enter a valid phone number."));
    pass.addEventListener('blur', () => {
        validateField(pass, patterns.password, "Password needs 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.");
        if (pass_word.value !== '') validateConfirmPassword(); // Recheck confirm if it has value
    });
    pass_word.addEventListener('blur', validateConfirmPassword);

    // Attach Input events
    const inputs = [
        { el: fname, pattern: patterns.name, msg: "Family name should be 2-30 letters." },
        { el: prenom, pattern: patterns.name, msg: "Name should be 2-30 letters." },
        { el: email, pattern: patterns.email, msg: "Please enter a valid email address." },
        { el: number, pattern: patterns.phone, msg: "Please enter a valid phone number." },
        { el: pass, pattern: patterns.password, msg: "Password needs 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char." }
    ];

    inputs.forEach(item => {
        item.el.addEventListener('input', () => {
            checkFormValidity();
            if (item.el.classList.contains('invalid')) {
                validateField(item.el, item.pattern, item.msg);
            }
        });
    });

    pass_word.addEventListener('input', () => {
        checkFormValidity();
        if (pass_word.classList.contains('invalid')) {
            validateConfirmPassword();
        }
    });

    // Initial check
    checkFormValidity();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate all just to be sure
        let isValid = true;
        inputs.forEach(item => {
            if (!validateField(item.el, item.pattern, item.msg)) isValid = false;
        });
        if (!validateConfirmPassword()) isValid = false;

        if (isValid) {
            alert("Account Created! (Simulated)");
        }
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupLoginValidation();
    setupRegisterValidation();
});
