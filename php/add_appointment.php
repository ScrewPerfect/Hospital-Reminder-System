<?php
session_start();
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

// Use isset() for backward compatibility with older PHP versions
$patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : null;
$doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : null;
$date = isset($_POST['date']) ? $_POST['date'] : null;
$time = isset($_POST['time']) ? $_POST['time'] : null;
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';
$user_id = $_SESSION['user_id'];

// Basic validation
if (!$patient_name || !$doctor_name || !$date || !$time) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit();
}

$sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param("isssss", $user_id, $patient_name, $doctor_name, $date, $time, $notes);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$conn->close();
?>

