<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // or your frontend domain

$apiKey   = "11616c7dc6ef457182a7d830fc4a3e82"; 
$endpoint = "https://newsapi.org/v2/everything";

// Get params from your frontend
$topicQuery = $_GET["topicQuery"] ?? "";
$page       = $_GET["page"]       ?? 1;
$from       = $_GET["from"]       ?? "";
$to         = $_GET["to"]         ?? "";

// Build NewsAPI URL
$params = [
    "q"          => $topicQuery,
    "from"       => $from,
    "to"         => $to,
    "sortBy"     => "publishedAt",
    "language"   => "en",
    "pageSize"   => "10",
    "page"       => $page,
    "apiKey"     => $apiKey,
];

$url = $endpoint . "?" . http_build_query($params);


$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_URL            => $url,
]);

$response = curl_exec($curl);
$error    = curl_error($curl);

curl_close($curl);

if ($error) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to fetch news",
    ]);
} else {
    echo $response;
}