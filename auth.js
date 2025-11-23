document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    const showMessage = (message, isSuccess) => {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = isSuccess ? 'text-green-600' : 'text-red-600';
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            
            // Send as FormData (matches $_POST in PHP)
            try {
                const response = await fetch('php/login.php', {
                    method: 'POST',
                    body: formData 
                });
                const result = await response.json();
                showMessage(result.message, result.success);
                if (result.success) {
                    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                }
            } catch (error) {
                showMessage('Network or server error. Please try again.', false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);

            // Send as FormData (matches $_POST in PHP)
            try {
                const response = await fetch('php/register.php', {
                    method: 'POST',
                    body: formData 
                });
                const result = await response.json();
                showMessage(result.message, result.success);
                if (result.success) {
                    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
                }
            } catch (error) {
                showMessage('An error occurred. Please try again.', false);
            }
        });
    }
});