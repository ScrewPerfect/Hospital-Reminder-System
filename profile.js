document.addEventListener('DOMContentLoaded', () => {
    const updateEmailForm = document.getElementById('updateEmailForm');
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const emailInput = document.getElementById('email');
    const messageDiv = document.getElementById('message');

    // Fetch user details to pre-fill the form
    const fetchUserDetails = async () => {
        try {
            const response = await fetch('php/get_user_details.php');
            const data = await response.json();
            if (data.success && data.user) {
                // Ensure the email input element exists before setting its value
                if (emailInput && data.user.email) {
                    emailInput.value = data.user.email;
                }
            } else {
                 // If session is invalid or user not found, redirect to login
                 console.log('Session invalid or user not found. Redirecting to login.');
                 window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const showMessage = (message, isSuccess) => {
        // Ensure the message div exists before trying to use it
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = isSuccess ? 'text-green-600' : 'text-red-600';
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 3000);
        }
    };

    // Only add event listeners if the forms actually exist on the page
    if (updateEmailForm) {
        updateEmailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            
            try {
                const response = await fetch('php/update_profile.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_email', email: email })
                });
                const result = await response.json();
                showMessage(result.message, result.success);
            } catch (error) {
                console.error('Error updating email:', error);
                showMessage('An error occurred. Please try again.', false);
            }
        });
    } else {
        console.error('Could not find the updateEmailForm element on this page.');
    }

    if (updatePasswordForm) {
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
                        confirm_password: confirmPassword
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
    } else {
        console.error('Could not find the updatePasswordForm element on this page.');
    }

    // Initial fetch of user details
    fetchUserDetails();
});

