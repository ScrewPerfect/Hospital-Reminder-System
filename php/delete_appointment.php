<?php
session_start();
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit();
}

$user_id = $_SESSION['user_id'];
// Use isset() for backward compatibility
$id = isset($_POST['id']) ? $_POST['id'] : null;

// The only required field for a delete operation is the ID.
if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Appointment ID not provided.']);
    exit();
}

// Security Check: Only delete if the appointment belongs to the logged-in user
$sql = "DELETE FROM appointments WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($sql);
if($stmt){
    $stmt->bind_param("ii", $id, $user_id);
    if($stmt->execute()){
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            // This can happen if the appointment doesn't exist or doesn't belong to the user
            echo json_encode(['success' => false, 'message' => 'Appointment not found or you do not have permission to delete it.']);
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

