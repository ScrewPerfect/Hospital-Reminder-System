<?php
// Turn off error reporting to screen to prevent HTML breakage
error_reporting(0);
ini_set('display_errors', 0);

session_start();
header('Content-Type: application/json');

try {
    require_once 'db_connect.php';

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in.']);
        exit();
    }

    $user_id = $_SESSION['user_id'];

    // FIX: Check for 'appointment_id' (from your HTML form) OR 'id' (fallback)
    // This ensures it works regardless of which name is sent.
    $id = isset($_POST['appointment_id']) ? $_POST['appointment_id'] : (isset($_POST['id']) ? $_POST['id'] : null);
    
    // Standard fields
    $patient_name = isset($_POST['patient_name']) ? $_POST['patient_name'] : null;
    $doctor_name = isset($_POST['doctor_name']) ? $_POST['doctor_name'] : null;
    
    // FIX: Check for 'appointment_date' OR 'date'
    $date = isset($_POST['appointment_date']) ? $_POST['appointment_date'] : (isset($_POST['date']) ? $_POST['date'] : null);
    
    // FIX: Check for 'appointment_time' OR 'time'
    $time = isset($_POST['appointment_time']) ? $_POST['appointment_time'] : (isset($_POST['time']) ? $_POST['time'] : null);
    
    $status = isset($_POST['status']) ? $_POST['status'] : 'Scheduled';
    $notes = isset($_POST['notes']) ? $_POST['notes'] : '';

    // Validation: Ensure we have all necessary data to perform an update
    if (!$id || !$patient_name || !$doctor_name || !$date || !$time) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields for update. Debug: ID=' . ($id ? $id : 'null')]);
        exit();
    }

    // Prepare the SQL statement
    $sql = "UPDATE appointments SET patient_name=?, doctor_name=?, date=?, time=?, status=?, notes=? WHERE id=? AND user_id=?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Database prepare error: " . $conn->error);
    }

    // Bind parameters: s=string, i=integer
    $stmt->bind_param("ssssssii", $patient_name, $doctor_name, $date, $time, $status, $notes, $id, $user_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Appointment updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database execute error: ' . $stmt->error]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    // Catch any fatal errors and return JSON so the frontend doesn't break
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
?>