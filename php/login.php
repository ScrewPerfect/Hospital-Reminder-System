<?php
// File: php/login.php
error_reporting(0); // Suppress notices for older PHP versions

require_once 'db_connect.php';

// Always start the session at the very beginning
session_start();

header('Content-Type: application/json');

$response = array('success' => false, 'message' => 'An unknown error occurred.');

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if (empty($username) || empty($password)) {
    $response['message'] = 'Please enter both username and password.';
    echo json_encode($response);
    exit();
}

// Prepare statement to prevent SQL injection
$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
if ($stmt === false) {
    $response['message'] = 'Database prepare statement failed.';
     echo json_encode($response);
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    // Verify the password against the stored hash
    if (password_verify($password, $user['password'])) {
        // Password is correct, set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        
        $response['success'] = true;
        $response['message'] = 'Login successful!';
    } else {
        $response['message'] = 'Invalid username or password.';
    }
} else {
    $response['message'] = 'Invalid username or password.';
}

$stmt->close();
$conn->close();

echo json_encode($response);
?>

