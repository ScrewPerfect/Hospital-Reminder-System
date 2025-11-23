<?php
// Database credentials for XAMPP
$servername = "localhost";
$username = "root"; // Default XAMPP username
$password = "";     // Default XAMPP password is empty
$dbname = "hospital_db";

// Create the database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check if the connection was successful
if ($conn->connect_error) {
    // FIX: Instead of die(), output a JSON error and exit
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Check server status.']);
    exit(); // Exit immediately
}
?>