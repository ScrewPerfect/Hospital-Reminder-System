<?php
session_start();
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get data from POST request
$id = isset($_POST['id']) ? $_POST['id'] : '';
$patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : '';
$doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : '';
$date = isset($_POST['date']) ? $_POST['date'] : '';
$time = isset($_POST['time']) ? $_POST['time'] : '';
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';
$user_id = $_SESSION['user_id'];

// Validate data
if (empty($id) || empty($patient_name) || empty($doctor_name) || empty($date) || empty($time)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

// Prepare and execute the update statement
$sql = "UPDATE appointments SET patient_name = ?, doctor_name = ?, date = ?, time = ?, notes = ? WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param("ssssssi", $patient_name, $doctor_name, $date, $time, $notes, $id, $user_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes were made or appointment not found.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating appointment: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

