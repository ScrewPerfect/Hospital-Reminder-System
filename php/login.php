<?php
// File: login.php

// Suppress notices and warnings to ensure a clean JSON response
error_reporting(0);

// 1. Start the session
session_start();

// 2. Include the database connection
require_once 'db_connect.php';

// 3. Set the content type to JSON
header('Content-Type: application/json');

// 4. Get the input from the form (compatible with older PHP)
$username = isset($_POST['username']) ? $_POST['username'] : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// 5. Basic validation
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

// 6. Find the user in the database
$sql = "SELECT id, password FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error.']);
    exit();
}
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    // User found, now verify password
    $user = result->fetch_assoc();
    
    if (password_verify($password, $user['password'])) {
        // Password is correct, login successful
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        
        echo json_encode(['success' => true]);
    } else {
        // Incorrect password
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    // User not found
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}

// 7. Close connections
$stmt->close();
$conn->close();
?>

