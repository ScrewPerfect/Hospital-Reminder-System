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
    // If it fails, stop the script and show an error
    die("Connection failed: " . $conn->connect_error);
}
?>

