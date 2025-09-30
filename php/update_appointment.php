<?php
session_start();
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

// Use isset() for backward compatibility
$id = isset($_POST['id']) ? $_POST['id'] : null;
$patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : null;
$doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : null;
$date = isset($_POST['date']) ? $_POST['date'] : null;
$time = isset($_POST['time']) ? $_POST['time'] : null;
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';
$user_id = $_SESSION['user_id'];

if (!$id || !$patient_name || !$doctor_name || !$date || !$time) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

// Security Check: Make sure the appointment belongs to the logged-in user before updating
$sql = "UPDATE appointments SET patient_name = ?, doctor_name = ?, date = ?, time = ?, notes = ? WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param("sssssii", $patient_name, $doctor_name, $date, $time, $notes, $id, $user_id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No changes made or appointment not found.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
}

$conn->close();
?>

