document.addEventListener('DOMContentLoaded', () => {
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const messageDiv = document.getElementById('message');

    // Safety check: if the password form isn't found, stop the script to avoid errors.
    if (!updatePasswordForm) {
        return;
    }

    const showMessage = (message, isSuccess) => {
        messageDiv.textContent = message;
        messageDiv.className = isSuccess ? 'text-center text-sm font-medium h-5 text-green-600' : 'text-center text-sm font-medium h-5 text-red-600';
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000); 
    };

    // Handle Password Update
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', false);
            return;
        }

        const formData = new FormData(updatePasswordForm);
        formData.append('action', 'update_password'); // Tell PHP this is for password

        try {
            const response = await fetch('php/update_profile.php', {
                method: 'POST',
                body: formData // Sending as FormData
            });
            const result = await response.json();
            showMessage(result.message, result.success);
            if (result.success) {
                updatePasswordForm.reset();
            }
        } catch (error) {
            showMessage('An error occurred. Please try again.', false);
        }
    });
});