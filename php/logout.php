<?php
// Start the session to access session variables.
session_start();

// Unset all of the session variables.
$_SESSION = array();

// Destroy the session completely.
session_destroy();

// Redirect the user to the login page.
// Since this file is in 'php/', we need to go up one level to reach 'login.html'
header("location: ../login.html");
exit;
?>