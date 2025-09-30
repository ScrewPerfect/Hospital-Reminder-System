document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const messageDiv = document.getElementById('message');

    // This check prevents an error if the script is loaded on a page without a form
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = ''; // Clear previous messages
            messageDiv.className = ''; // Clear previous styling

            const formData = new FormData(form);
            const action = form.getAttribute('action'); // Gets either 'login.php' or 'register.php'

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: formData
                });

                // Check if the response is valid JSON before parsing
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const result = await response.json();

                    if (result.success) {
                        messageDiv.textContent = result.message;
                        messageDiv.classList.add('success');
                        // Redirect on success if a redirect URL is provided
                        if (result.redirect) {
                            // Add a small delay so the user can see the success message
                            setTimeout(() => {
                                window.location.href = result.redirect;
                            }, 1000);
                        }
                    } else {
                        messageDiv.textContent = result.message;
                        messageDiv.classList.add('error');
                    }
                } else {
                    // Handle non-JSON responses (like a PHP error page)
                    const textResponse = await response.text();
                    console.error('Server returned a non-JSON response:', textResponse);
                    messageDiv.textContent = 'An unexpected server error occurred. Please check the console.';
                    messageDiv.classList.add('error');
                }

            } catch (error) {
                console.error('Network or fetch error:', error);
                messageDiv.textContent = 'A network error occurred. Please try again.';
                messageDiv.classList.add('error');
            }
        });
    }
});

