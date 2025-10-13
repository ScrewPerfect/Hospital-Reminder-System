<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';

if ($action === 'update_email') {
    $email = isset($data['email']) ? trim($data['email']) : '';
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'A valid email is required.']);
        exit();
    }

    $sql = "UPDATE users SET email = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $email, $userId);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Email updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: Could not update email.']);
    }
    $stmt->close();

} elseif ($action === 'update_password') {
    $newPassword = isset($data['new_password']) ? $data['new_password'] : '';
    $confirmPassword = isset($data['confirm_password']) ? $data['confirm_password'] : '';

    if (empty($newPassword) || strlen($newPassword) < 3) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 3 characters long.']);
        exit();
    }
    if ($newPassword !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
        exit();
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $sql = "UPDATE users SET password = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $hashedPassword, $userId);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: Could not update password.']);
    }
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>
