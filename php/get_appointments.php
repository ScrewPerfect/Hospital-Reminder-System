<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$appointments = [];
$sql = "SELECT id, patient_name, doctor_name, date, time, notes FROM appointments ORDER BY date ASC, time ASC";
$result = $conn->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $appointments[] = $row;
    }
    $result->free();
}

$conn->close();
echo json_encode($appointments);
?>

