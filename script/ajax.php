<?php

require_once 'QueryServer.class.php';
require_once 'FlagDecoder.class.php';

header('Content-type: application/json');

/*$whitelist = array(
    0 => array("46.249.47.12", 2332),
    1 => array("ip_two", "port_two"),
    2 => array("ip_three", "port_three")
);

$ip = trim($_POST['ip']);
$port = (int) $_POST['port'];

foreach ($whitelist as $server) {
    if ($server[0] == $ip && $server[1] == $port) {
        $found = true;
        break;
    }
}

if (!isset($found)) {
    echo json_encode(array(
        "error" => "You are not allowed to query this server",
        "errorcode" => 1
    ));
    return;
}*/

$buffer = " ";
$query = new QueryServer($buffer, trim($_POST['ip']), (int) $_POST['port']);
if (($response = $query->runQuery()) !== false) {
    $response['hostname'] = str_replace("", "", trim($response['hostname']));
    echo json_encode($response);
} else {
    echo json_encode(array(
        "error" => $query->getError(),
        "errorcode" => $query->getErrorCode())
    );
}
