<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Check if all required fields are provided
    if (isset($_POST['patientName']) && isset($_POST['doctorName']) && isset($_POST['appointmentDate']) && isset($_POST['appointmentTime'])) {
        $patient_name = $_POST['patientName'];
        $doctor_name = $_POST['doctorName'];
        $date = $_POST['appointmentDate'];
        $time = $_POST['appointmentTime'];
        $notes = isset($_POST['notes']) ? $_POST['notes'] : '';

        $stmt = $conn->prepare("INSERT INTO appointments (patient_name, doctor_name, date, time, notes) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $patient_name, $doctor_name, $date, $time, $notes);

        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Appointment added successfully!';
        } else {
            $response['message'] = 'Error: ' . $stmt->error;
        }
        $stmt->close();
    } else {
        $response['message'] = 'Required fields are missing.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

$conn->close();
echo json_encode($response);
?>

