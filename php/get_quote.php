<?php
// Set the content type to JSON
header('Content-Type: application/json');

// The URL for the free, no-key-required quote API
$apiUrl = "https://zenquotes.io/api/random";

// Initialize a cURL session
$ch = curl_init();

// Set the cURL options
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// These options are necessary for many local XAMPP setups
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Execute the cURL session
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    // If there's an error, send a failure response
    echo json_encode([
        'success' => false,
        'message' => 'cURL Error: ' . curl_error($ch)
    ]);
    exit();
}

// Close the cURL session
curl_close($ch);

// Decode the JSON response from the API
$data = json_decode($response, true);

// Check if the data is valid and contains a quote
if (is_array($data) && !empty($data) && isset($data[0]['q'])) {
    // If successful, send back the quote
    echo json_encode([
        'success' => true,
        'quote' => $data[0]
    ]);
} else {
    // If the data format is unexpected, send an error
    echo json_encode([
        'success' => false,
        'message' => 'API returned invalid data format.'
    ]);
}
?>

