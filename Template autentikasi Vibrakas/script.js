const logregBox = document.querySelector('.logreg-box');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');

registerLink.addEventListener('click', () => {
    logregBox.classList.add('active');
});

loginLink.addEventListener('click', () => {
    logregBox.classList.remove('active');
});

// Handle label animation for all input fields
const inputBoxes = document.querySelectorAll('.input-box');

inputBoxes.forEach(inputBox => {
    const input = inputBox.querySelector('input');
    
    // Check on page load if input has value
    if (input.value.trim() !== '') {
        inputBox.classList.add('has-value');
    }
    
    // Handle input events
    input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
            inputBox.classList.add('has-value');
        } else {
            inputBox.classList.remove('has-value');
        }
    });
    
    // Handle focus events
    input.addEventListener('focus', () => {
        inputBox.classList.add('has-value');
    });
    
    // Handle blur events - only remove if empty
    input.addEventListener('blur', () => {
        if (input.value.trim() === '') {
            inputBox.classList.remove('has-value');
        }
    });
});