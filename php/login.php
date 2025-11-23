<?php
// File: login.php
// Turn off error reporting to avoid breaking JSON response
error_reporting(0);
ini_set('display_errors', 0);

require_once 'db_connect.php';

// Start a session for storing login status
session_start();

header('Content-Type: application/json');

// 1. Correctly retrieve data from FormData using $_POST
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// 2. Basic validation
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please enter both username and password.']);
    exit();
}

// 3. Prepare SQL to fetch user's stored data (including the password hash)
$sql = "SELECT id, username, password FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Database error during preparation.']);
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // 4. Verify the submitted password against the stored hash
    if (password_verify($password, $user['password'])) {
        
        // 5. Successful login: Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['logged_in'] = true;

        echo json_encode(['success' => true, 'message' => 'Login successful! Redirecting...']);
    } else {
        // Password verification failed
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
} else {
    // User not found
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
}

$stmt->close();
$conn->close();
?>