document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = ''; // Clear previous messages
        messageDiv.classList.remove('success', 'error');

        const formData = new FormData(form);
        const action = form.getAttribute('action'); // Gets either 'login.php' or 'register.php'

        try {
            const response = await fetch(action, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                messageDiv.textContent = result.message;
                messageDiv.classList.add('success');
                // Redirect on success
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            } else {
                messageDiv.textContent = result.message;
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'A network error occurred. Please try again.';
            messageDiv.classList.add('error');
        }
    });
});

