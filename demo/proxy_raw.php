<?php

// URL
$query = $_SERVER[ "QUERY_STRING" ];

// Open Session
$session = curl_init( $query );

// Only return contents, no headers
curl_setopt( $session, CURLOPT_HEADER, false );
curl_setopt( $session, CURLOPT_RETURNTRANSFER, true );

// Execute
$response = curl_exec( $session );
	
// Output
header( "Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept" );
header( "Access-Control-Allow-Origin: *" );
header( "Content-Type: application/json" );

echo $response;

// Done
curl_close( $session );
