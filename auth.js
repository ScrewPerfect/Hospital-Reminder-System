// File: auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = 'mb-4 text-center text-sm';

            const formData = new FormData(loginForm);
            const action = loginForm.getAttribute('action');

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const result = await response.json();

                if (result.success) {
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.classList.add('text-green-600');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000); // 1-second delay before redirecting
                } else {
                    messageDiv.textContent = result.message || 'An unknown error occurred.';
                    messageDiv.classList.add('text-red-600');
                }
            } catch (error) {
                console.error('Network or fetch error:', error);
                // This part handles cases where the server response is not valid JSON, which happens during a PHP error.
                const responseText = await error.response?.text(); // Attempt to get raw text if available
                if (responseText) {
                    console.error("Server's raw response:", responseText);
                }
                messageDiv.textContent = 'A server or network error occurred. Please check the console for details.';
                messageDiv.classList.add('text-red-600');
            }
        });
    }

    // Handle Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = 'mb-4 text-center text-sm';

            const formData = new FormData(registerForm);
            const action = registerForm.getAttribute('action');
            
            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    messageDiv.textContent = 'Registration successful! Redirecting to login...';
                    messageDiv.classList.add('text-green-600');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = result.message || 'An unknown error occurred.';
                    messageDiv.classList.add('text-red-600');
                }
            } catch (error) {
                console.error('Network or fetch error:', error);
                 // This part handles cases where the server response is not valid JSON, which happens during a PHP error.
                const responseText = await error.response?.text(); // Attempt to get raw text if available
                if (responseText) {
                    console.error("Server's raw response:", responseText);
                }
                messageDiv.textContent = 'A server or network error occurred. Please check the console for details.';
                messageDiv.classList.add('text-red-600');
            }
        });
    }
});

