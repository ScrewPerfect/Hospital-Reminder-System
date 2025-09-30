<?php
// File: php/check_session.php

// Always start the session to access session data
session_start();

header('Content-Type: application/json');

// Check if the user_id session variable is set
if (isset($_SESSION['user_id'])) {
    // User is logged in
    echo json_encode([
        'loggedIn' => true,
        'username' => $_SESSION['username'] // Send username back to display
    ]);
} else {
    // User is not logged in
    echo json_encode(['loggedIn' => false]);
}
?>
