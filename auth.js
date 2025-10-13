document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, isSuccess) => {
        messageDiv.textContent = message;
        messageDiv.className = isSuccess ? 'text-green-600' : 'text-red-600';
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('php/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                showMessage(result.message, result.success);
                if (result.success) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Network or server error. Please try again.', false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('php/register.php', {
                    method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                showMessage(result.message, result.success);
                if (result.success) {
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('An error occurred. Please try again.', false);
            }
        });
    }
});

