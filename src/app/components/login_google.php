<?php

session_start();

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../php/conexion.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["credential"])) {
    echo json_encode([
        "success" => false,
        "error" => "No se recibió la credencial de Google."
    ]);
    exit;
}

$token = $data["credential"];

$client = new Google_Client();

$client->setClientId(
    "568752735945-5jdirugso97ts4qdb72067bsntqdogcs.apps.googleusercontent.com"
);

$payload = $client->verifyIdToken($token);

if (!$payload) {
    echo json_encode([
        "success" => false,
        "error" => "La credencial de Google no es válida."
    ]);
    exit;
}

$email = $payload["email"];
$nombre = $payload["name"] ?? "Usuario";


// Buscar usuario
$sql = "SELECT id, nombre, email, password, rol
        FROM usuarios
        WHERE email = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$resultado = $stmt->get_result();


// Si ya existe
if ($usuario = $resultado->fetch_assoc()) {

    $_SESSION["usuario_id"] = $usuario["id"];
    $_SESSION["nombre"] = $usuario["nombre"];
    $_SESSION["email"] = $usuario["email"];
    $_SESSION["rol"] = $usuario["rol"];

} else {

    // Crear usuario nuevo
    $rol = "cliente";

    $sqlInsert = "INSERT INTO usuarios (nombre, email, password, rol)
                  VALUES (?, ?, '', ?)";

    $stmtInsert = $conn->prepare($sqlInsert);
    $stmtInsert->bind_param(
        "sss",
        $nombre,
        $email,
        $rol
    );

    if (!$stmtInsert->execute()) {

        echo json_encode([
            "success" => false,
            "error" => "No se pudo crear el usuario."
        ]);

        exit;
    }

    $id = $conn->insert_id;

    $_SESSION["usuario_id"] = $id;
    $_SESSION["nombre"] = $nombre;
    $_SESSION["email"] = $email;
    $_SESSION["rol"] = $rol;
}


echo json_encode([
    "success" => true
]);