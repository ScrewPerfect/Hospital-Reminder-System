<?php
session_start();
require_once 'db_connect.php';

// Security check: ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to add an appointment.']);
    exit();
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $patient_name = $data['patientName'];
    $doctor_name = $data['doctorName'];
    $date = $data['appointmentDate'];
    $time = $data['appointmentTime'];
    $notes = $data['notes'];

    $sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isssss", $user_id, $patient_name, $doctor_name, $date, $time, $notes);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
    $stmt->close();
}
$conn->close();
?>
