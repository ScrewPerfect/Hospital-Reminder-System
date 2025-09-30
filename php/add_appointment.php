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

// Get data from POST request using snake_case to match the form
$patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : '';
$doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : '';
$date = isset($_POST['date']) ? $_POST['date'] : '';
$time = isset($_POST['time']) ? $_POST['time'] : '';
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';
$user_id = $_SESSION['user_id'];

// Validate data
if (empty($patient_name) || empty($doctor_name) || empty($date) || empty($time)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

// Prepare and execute the insert statement
$sql = "INSERT INTO appointments (user_id, patient_name, doctor_name, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param("isssss", $user_id, $patient_name, $doctor_name, $date, $time, $notes);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    // This will output the specific database error, e.g., "Column 'patient_name' cannot be null"
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

