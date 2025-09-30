document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, isSuccess) => {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = isSuccess ? 'message success' : 'message error';
            messageDiv.style.display = 'block';
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('php/login.php', {
                    method: 'POST',
                    // This headers block is the crucial fix
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (result.success) {
                    showMessage('Login successful! Redirecting...', true);
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showMessage(result.message || 'An unknown error occurred.', false);
                }
            } catch (error) {
                console.error('Login fetch error:', error);
                showMessage('A network error occurred. Please try again.', false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;

            try {
                const response = await fetch('php/register.php', {
                    method: 'POST',
                    // This headers block is also needed for registration
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                 if (result.success) {
                    showMessage('Registration successful! Please log in.', true);
                     setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                } else {
                    showMessage(result.message || 'An unknown error occurred.', false);
                }
            } catch (error) {
                console.error('Registration fetch error:', error);
                showMessage('A network error occurred. Please try again.', false);
            }
        });
    }
});

