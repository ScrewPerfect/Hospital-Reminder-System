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

// Fetch appointments for the logged-in user
$sql = "SELECT id, patient_name, doctor_name, date, time, notes FROM appointments WHERE user_id = ? ORDER BY date, time";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $appointments[] = $row;
    }
    echo json_encode(['success' => true, 'appointments' => $appointments]);
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Database prepare statement failed.']);
}

$conn->close();
?>
