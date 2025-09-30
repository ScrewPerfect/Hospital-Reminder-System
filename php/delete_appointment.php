<?php
session_start();
require_once 'db_connect.php';

// Security check: ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete an appointment.']);
    exit();
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $appointment_id = $data['id'];

    // Security: Ensure the user owns the appointment they are trying to delete
    $sql = "DELETE FROM appointments WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $appointment_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            // Either the appointment didn't exist or the user didn't have permission
            echo json_encode(['success' => false, 'message' => 'Appointment not found or permission denied.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    $stmt->close();
}
$conn->close();
?>

<?php
session_start();
require_once 'db_connect.php';

// Security check: ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete an appointment.']);
    exit();
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $appointment_id = $data['id'];

    // Security: Ensure the user owns the appointment they are trying to delete
    $sql = "DELETE FROM appointments WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $appointment_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            // Either the appointment didn't exist or the user didn't have permission
            echo json_encode(['success' => false, 'message' => 'Appointment not found or permission denied.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    $stmt->close();
}
$conn->close();
?>

<?php
session_start();
require_once 'db_connect.php';

// Security check: ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete an appointment.']);
    exit();
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $appointment_id = $data['id'];

    // Security: Ensure the user owns the appointment they are trying to delete
    $sql = "DELETE FROM appointments WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $appointment_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            // Either the appointment didn't exist or the user didn't have permission
            echo json_encode(['success' => false, 'message' => 'Appointment not found or permission denied.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    $stmt->close();
}
$conn->close();
?>

<?php
session_start();
require_once 'db_connect.php';

// Security check: ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete an appointment.']);
    exit();
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $appointment_id = $data['id'];

    // Security: Ensure the user owns the appointment they are trying to delete
    $sql = "DELETE FROM appointments WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $appointment_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true]);
        } else {
            // Either the appointment didn't exist or the user didn't have permission
            echo json_encode(['success' => false, 'message' => 'Appointment not found or permission denied.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
    $stmt->close();
}
$conn->close();
?>

