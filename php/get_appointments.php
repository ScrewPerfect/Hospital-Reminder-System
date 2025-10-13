<?php
session_start();

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

require_once 'db_connect.php';

$user_id = $_SESSION['user_id'];

// Prepare and execute the query to get appointments for the logged-in user
$sql = "SELECT id, patient_name, doctor_name, date, time, notes, status FROM appointments WHERE user_id = ?";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error: ' . $conn->error]);
    exit();
}

$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $appointments[] = $row;
    }
    echo json_encode(['success' => true, 'appointments' => $appointments]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database execute error: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

