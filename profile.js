document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the profile page before running any code
    const updateEmailForm = document.getElementById('updateEmailForm');
    if (!updateEmailForm) {
        return; // Exit if not on the profile page
    }

    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const emailInput = document.getElementById('email');
    const messageDiv = document.getElementById('message');

    // Fetch user details to pre-fill the form
    const fetchUserDetails = async () => {
        try {
            const response = await fetch('php/get_user_details.php');
            const data = await response.json();
            if (data.success && data.user && data.user.email) {
                emailInput.value = data.user.email;
            } else if (!data.success) {
                // If the session is invalid or user not found, redirect to login
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const showMessage = (message, isSuccess) => {
        messageDiv.textContent = message;
        messageDiv.className = isSuccess ? 'text-green-600 text-center text-sm font-medium h-5' : 'text-red-600 text-center text-sm font-medium h-5';
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000); // Message disappears after 3 seconds
    };

    updateEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('php/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_email', email: emailInput.value })
            });
            const result = await response.json();
            showMessage(result.message, result.success);
        } catch (error) {
            console.error('Error updating email:', error);
            showMessage('An error occurred. Please try again.', false);
        }
    });

    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', false);
            return;
        }

        try {
            const response = await fetch('php/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_password', 
                    new_password: newPassword,
                    confirm_password: confirmPassword // Sending confirmation for completeness
                })
            });
            const result = await response.json();
            showMessage(result.message, result.success);
            if (result.success) {
                updatePasswordForm.reset();
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showMessage('An error occurred. Please try again.', false);
        }
    });

    // Initial load
    fetchUserDetails();
});

