<?php
session_start(); // Start the session to access session variables

header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    // User is logged in
    echo json_encode([
        'success' => true,
        'loggedIn' => true,
        'username' => $_SESSION['username']
    ]);
} else {
    // User is not logged in
    echo json_encode([
        'success' => true,
        'loggedIn' => false
    ]);
}
?>

