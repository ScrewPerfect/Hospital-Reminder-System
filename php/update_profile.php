<?php
// File: update_profile.php

// Disable error printing to avoid breaking JSON response
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// ==========================================================
// FIX: Manually parse input if $_POST is empty (Common FormData issue)
// ==========================================================
if (empty($_POST) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read the raw input stream
    $input = file_get_contents('php://input');
    
    // Check if the input is URL-encoded (as sent by FormData)
    if (strpos($_SERVER['CONTENT_TYPE'], 'application/x-www-form-urlencoded') !== false || 
        strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        
        // Parse the input string and populate $_POST
        parse_str($input, $_POST);
    }
}
// ==========================================================
// END FIX
// ==========================================================


// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];

// Read parameters from $_POST array (which is now guaranteed to be populated if data was sent)
$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($action === 'update_password') {
    $newPassword = isset($_POST['new_password']) ? $_POST['new_password'] : '';
    $confirmPassword = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

    // Validation
    if (empty($newPassword) || strlen($newPassword) < 3) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 3 characters long.']);
        exit();
    }
    
    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
        exit();
    }

    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update database
    $sql = "UPDATE users SET password = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        $stmt->bind_param("si", $hashedPassword, $userId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database error: Could not update password.']);
        }
        $stmt->close();
    } else {
         echo json_encode(['success' => false, 'message' => 'Database prepare error.']);
    }

} else {
    // This should now only catch requests that truly are missing the 'action' parameter (shouldn't happen)
    echo json_encode(['success' => false, 'message' => 'Invalid action or request.']);
}

$conn->close();
?>