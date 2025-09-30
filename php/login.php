<?php
// Report all errors except notices for cleaner JSON output
error_reporting(E_ALL & ~E_NOTICE);
header('Content-Type: application/json');
require_once 'db_connect.php';

session_start(); // Start the session at the very beginning

// Read the JSON input from the request body
$data = json_decode(file_get_contents('php://input'), true);

// Use isset() on the decoded JSON data for backward compatibility
$username = isset($data['username']) ? $data['username'] : null;
$password = isset($data['password']) ? $data['password'] : null;


if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

$sql = "SELECT id, username, password FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        // Verify the hashed password
        if (password_verify($password, $user['password'])) {
            // Password is correct, set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true]);
        } else {
            // Incorrect password
            echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        }
    } else {
        // User not found
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database prepare statement failed.']);
}

$conn->close();
?>

