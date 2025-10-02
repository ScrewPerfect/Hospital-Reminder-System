<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated. Please log in again.']);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = $_POST; // Read data from the standard POST variable

// Detailed validation
$errors = [];
if (empty($data['patient_name'])) {
    $errors[] = 'Patient Name';
}
if (empty($data['doctor_name'])) {
    $errors[] = 'Doctor\'s Name';
}
if (empty($data['appointment_date'])) {
    $errors[] = 'Appointment Date';
}
if (empty($data['appointment_time'])) {
    $errors[] = 'Appointment Time';
}

if (!empty($errors)) {
    $errorMessage = 'Missing required fields: ' . implode(', ', $errors) . '.';
    echo json_encode(['success' => false, 'message' => $errorMessage]);
    exit();
}

$patient_name = $data['patient_name'];
$doctor_name = $data['doctor_name'];
$date = $data['appointment_date'];
$time = $data['appointment_time'];
$status = isset($data['status']) ? $data['status'] : 'Scheduled';
$notes = isset($data['notes']) ? $data['notes'] : '';

$sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("issssss", $user_id, $patient_name, $doctor_name, $date, $time, $notes, $status);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Appointment added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: Could not save appointment.']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: Could not prepare statement.']);
}

$conn->close();
?>

