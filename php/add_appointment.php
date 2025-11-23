<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
    exit();
}

$user_id = $_SESSION['user_id'];

// FIX: Use isset() for compatibility
$patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : null;
$doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : null;
$date = isset($_POST['appointment_date']) ? $_POST['appointment_date'] : (isset($_POST['date']) ? $_POST['date'] : null);
$time = isset($_POST['appointment_time']) ? $_POST['appointment_time'] : (isset($_POST['time']) ? $_POST['time'] : null);
$status = isset($_POST['status']) ? $_POST['status'] : 'Scheduled';
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';

if (!$patient_name || !$doctor_name || !$date || !$time) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("issssss", $user_id, $patient_name, $doctor_name, $date, $time, $status, $notes);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database prepare failed.']);
}

$conn->close();
?>