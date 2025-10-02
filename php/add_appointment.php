<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

// Use isset() for backward compatibility
$patient_name = isset($data['patient_name']) ? $data['patient_name'] : null;
$doctor_name = isset($data['doctor_name']) ? $data['doctor_name'] : null;
$date = isset($data['appointment_date']) ? $data['appointment_date'] : null;
$time = isset($data['appointment_time']) ? $data['appointment_time'] : null;
$status = isset($data['status']) ? $data['status'] : 'Scheduled'; // Add status
$notes = isset($data['notes']) ? $data['notes'] : '';

if (!$patient_name || !$doctor_name || !$date || !$time) {
    echo json_encode(['success' => false, 'message' => 'Error adding appointment: Missing required fields.']);
    exit();
}

$sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("issssss", $user_id, $patient_name, $doctor_name, $date, $time, $notes, $status);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Appointment added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database execute failed.']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database prepare statement failed.']);
}

$conn->close();
?>

