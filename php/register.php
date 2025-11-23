<?php
// 1. Include the database connection
require_once 'db_connect.php';

// 2. Set the content type to JSON
header('Content-Type: application/json');

// 3. Get the input from the form (compatible with older PHP)
$username = isset($_POST['username']) ? $_POST['username'] : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// 4. Basic validation
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit();
}

// 5. Check if the username already exists
$sql_check = "SELECT id FROM users WHERE username = ?";
$stmt_check = $conn->prepare($sql_check);
if ($stmt_check === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error (check).']);
    exit();
}
$stmt_check->bind_param("s", $username);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows > 0) {
    // Username already exists
    echo json_encode(['success' => false, 'message' => 'Username already exists. Please choose another.']);
    $stmt_check->close();
    $conn->close();
    exit();
}
$stmt_check->close();

// 6. Hash the password for security
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// 7. Insert the new user into the database
$sql_insert = "INSERT INTO users (username, password) VALUES (?, ?)";
$stmt_insert = $conn->prepare($sql_insert);
if ($stmt_insert === false) {
    echo json_encode(['success' => false, 'message' => 'Database prepare error (insert).']);
    exit();
}
$stmt_insert->bind_param("ss", $username, $hashed_password);

if ($stmt_insert->execute()) {
    // Registration successful
    echo json_encode(['success' => true]);
} else {
    // Registration failed
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

// 8. Close connections
$stmt_insert->close();
$conn->close();
?>

