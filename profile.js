// File: profile.js (Temporary Debug Version)
document.addEventListener('DOMContentLoaded', () => {
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const messageDiv = document.getElementById('message');

    // NEW LOG 1: Check if the form element was found
    console.log('DOM Content Loaded. Form element found:', updatePasswordForm ? true : false);

    // Safety check: if the password form isn't found, stop the script to avoid errors.
    if (!updatePasswordForm) {
        return;
    }
    // ... (showMessage function remains the same) ...

    // Handle Password Update
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // NEW LOG 2: Check if the submit event is firing
        console.log('Submit event Fired. Attempting password check...');
        
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (newPassword !== confirmPassword) {
            // ...
            return;
        }

        const formData = new FormData(updatePasswordForm);
        formData.append('action', 'update_password');

        // NEW LOG 3: Check data sent and fetch start
        console.log('Starting fetch request to php/update_profile.php');
        
        try {
            const response = await fetch('php/update_profile.php', {
                method: 'POST',
                body: formData
            });
            
            // ... (rest of the code) ...
            
        } catch (error) {
            // This catch should now be triggered if the request fails silently
            console.error('Fetch failed or returned bad data:', error);
            showMessage('An error occurred. Please try again.', false);
        }
    });
});