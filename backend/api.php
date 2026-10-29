<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function configValue(string $key, string $default=''): string {
    $value=getenv($key);
    if ($value!==false && $value!=='') return $value;

    static $fileValues=null;
    if ($fileValues===null) {
        $fileValues=[];
        $envFile=dirname(__DIR__).'/.env';
        if (is_file($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line=trim($line);
                if ($line==='' || substr($line, 0, 1)==='#' || strpos($line, '=')===false) continue;
                [$envKey,$envValue]=explode('=', $line, 2);
                $fileValues[trim($envKey)]=trim(trim($envValue), "\"'");
            }
        }
    }

    return $fileValues[$key] ?? $default;
}

$host = configValue('TECH_DB_HOST', '127.0.0.1');
$db   = configValue('TECH_DB_NAME', 'techaraujo');
$user = configValue('TECH_DB_USER', 'root');
$pass = configValue('TECH_DB_PASS');
$googleClientId = configValue('GOOGLE_CLIENT_ID', configValue('VITE_GOOGLE_CLIENT_ID'));

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    error_log('Error de conexión a MySQL: '.$e->getMessage());
    http_response_code(500); echo json_encode(['error'=>'No se pudo conectar a MySQL']); exit;
}

function body(): array { $raw=file_get_contents('php://input'); $data=json_decode($raw ?: '{}', true); return is_array($data)?$data:[]; }
function out($data,int $code=200): void { http_response_code($code); echo json_encode($data,JSON_UNESCAPED_UNICODE); exit; }
function userFromRow(array $r): array {
    $roles=[0=>'cliente',1=>'tecnico',2=>'administrador'];
    return ['id'=>(string)$r['id'],'nombre'=>trim(($r['nombre']??'').' '.($r['apellido']??'')),'email'=>$r['email']??'', 'telefono'=>null,'contraseña'=>'','rol'=>$roles[(int)$r['rol']]??'cliente','fechaCreacion'=>($r['fecha']??date('c')).'T00:00:00'];
}
function roleId(string $r): int { return ['cliente'=>0,'tecnico'=>1,'administrador'=>2][$r] ?? 0; }
function ticketStateName(int $s): string { return ['nuevo','pendiente','aprobado','rechazado'][$s] ?? 'nuevo'; }
function ticketStateId(string $s): int { return ['nuevo'=>0,'pendiente'=>1,'aprobado'=>2,'rechazado'=>3][$s] ?? 0; }
function workStateName(int $s): string { return ['recibida','diagnosticando','reparando','lista','entregada'][$s] ?? 'recibida'; }
function workStateId(string $s): int { return ['recibida'=>0,'diagnosticando'=>1,'reparando'=>2,'lista'=>3,'entregada'=>4][$s] ?? 0; }
function ticketTypeId(string $t): int { return $t==='laptop' ? 1 : 0; }
function ticketTypeName(int $t): string { return $t===1 ? 'laptop' : 'pc'; }
function ensureGoogleIdentityColumn(PDO $pdo): void {
  $hasColumn=$pdo->query("SHOW COLUMNS FROM usuario LIKE 'google_sub'")->fetchColumn();
  if (!$hasColumn) $pdo->exec('ALTER TABLE usuario ADD COLUMN google_sub VARCHAR(255) NULL AFTER email');

  $hasIndex=$pdo->query("SHOW INDEX FROM usuario WHERE Key_name='uq_usuario_google_sub'")->fetchColumn();
  if (!$hasIndex) $pdo->exec('CREATE UNIQUE INDEX uq_usuario_google_sub ON usuario (google_sub)');
}
function messagesForWork(PDO $pdo, int $workId): array {
  $st=$pdo->prepare('SELECT m.*, CONCAT_WS(\' \',u.nombre,u.apellido) nombre,u.rol FROM mensaje m JOIN chat c ON c.id=m.chat_id LEFT JOIN usuario u ON u.id=m.usuario_id WHERE c.trabajo_id=? ORDER BY m.fecha,m.id');
  $st->execute([$workId]);
  $roles=[0=>'cliente',1=>'tecnico',2=>'administrador'];
  $messages=[];
  foreach($st as $r)$messages[]=['id'=>(string)$r['id'],'idRemitente'=>(string)$r['usuario_id'],'nombreRemitente'=>$r['nombre']??'','rolRemitente'=>$roles[(int)$r['rol']]??'cliente','texto'=>$r['mensaje']??'','fechaHora'=>$r['fecha']??''];
  return $messages;
}

$method=$_SERVER['REQUEST_METHOD'];
$resource=$_GET['resource']??'';
$id=isset($_GET['id'])?(int)$_GET['id']:0;
try {
  if ($resource==='health') out(['ok'=>true,'database'=>$db,'googleLoginConfigured'=>$googleClientId!=='']);

  if ($resource==='login' && $method==='POST') {
    $d=body(); $st=$pdo->prepare('SELECT * FROM usuario WHERE email=? LIMIT 1'); $st->execute([$d['email']??'']); $r=$st->fetch();
    if (!$r || ($r['password_hash']??'') !== md5((string)($d['contraseña']??''))) out(['error'=>'Correo o contraseña incorrectos'],401);
    out(userFromRow($r));
  }

  if ($resource==='login-google' && $method==='POST') {
    if ($googleClientId==='') out(['error'=>'Falta configurar GOOGLE_CLIENT_ID en el servidor'],503);

    $credential=trim((string)(body()['credential']??''));
    if ($credential==='') out(['error'=>'No se recibió la credencial de Google'],422);

    $autoload=dirname(__DIR__).'/vendor/autoload.php';
    if (!is_file($autoload)) out(['error'=>'No está instalada la librería de Google para PHP'],503);

    try {
      require_once $autoload;
      $googleClient=new Google\Client(['client_id'=>$googleClientId]);
      $googleUser=$googleClient->verifyIdToken($credential);
    } catch (Throwable $e) {
      error_log('Error al verificar el token de Google: '.$e->getMessage());
      out(['error'=>'No se pudo verificar la cuenta de Google'],401);
    }

    if (!is_array($googleUser)) out(['error'=>'La credencial de Google no es válida'],401);

    $email=filter_var((string)($googleUser['email']??''), FILTER_VALIDATE_EMAIL);
    $emailVerified=filter_var($googleUser['email_verified']??false, FILTER_VALIDATE_BOOLEAN);
    $googleSub=trim((string)($googleUser['sub']??''));
    if (!$googleUser || !$email || !$emailVerified || $googleSub==='') out(['error'=>'La cuenta de Google no tiene un correo verificado'],401);

    ensureGoogleIdentityColumn($pdo);
    $st=$pdo->prepare('SELECT * FROM usuario WHERE google_sub=? LIMIT 1');
    $st->execute([$googleSub]);
    $account=$st->fetch();

    if (!$account) {
      $st=$pdo->prepare('SELECT * FROM usuario WHERE email=? LIMIT 1');
      $st->execute([$email]);
      $account=$st->fetch();

      if ($account) {
        $linkedSub=trim((string)($account['google_sub']??''));
        if ($linkedSub!=='' && !hash_equals($linkedSub, $googleSub)) out(['error'=>'Este correo ya está vinculado a otra cuenta de Google'],409);
        $pdo->prepare('UPDATE usuario SET google_sub=? WHERE id=?')->execute([$googleSub,$account['id']]);
      } else {
        $nameParts=preg_split('/\s+/', trim((string)($googleUser['name']??'')), 2);
        $firstName=substr($nameParts[0]??'Usuario', 0, 20);
        $lastName=substr($nameParts[1]??'', 0, 30);
        $pdo->prepare('INSERT INTO usuario(nombre,apellido,rol,email,google_sub,fecha) VALUES(?,?,0,?,?,CURDATE())')->execute([$firstName,$lastName,$email,$googleSub]);
        $st=$pdo->prepare('SELECT * FROM usuario WHERE id=? LIMIT 1');
        $st->execute([(int)$pdo->lastInsertId()]);
        $account=$st->fetch();
      }
    }

    out(userFromRow($account));
  }

  if ($resource==='usuarios') {
    if ($method==='GET') { $rows=$pdo->query('SELECT * FROM usuario ORDER BY id')->fetchAll(); out(array_map('userFromRow',$rows)); }
    if ($method==='POST') { $d=body(); $parts=preg_split('/\s+/',trim((string)($d['nombre']??'')),2); $nombre=$parts[0]??''; $apellido=$parts[1]??''; $st=$pdo->prepare('INSERT INTO usuario(nombre,apellido,rol,email,password_hash,fecha) VALUES(?,?,?,?,?,CURDATE())'); $st->execute([$nombre,$apellido,roleId($d['rol']??'cliente'),$d['email']??'',md5((string)($d['contraseña']??''))]); $r=$pdo->query('SELECT * FROM usuario WHERE id='.$pdo->lastInsertId())->fetch(); out(userFromRow($r),201); }
    if (($method==='PATCH'||$method==='PUT') && $id) { $d=body(); if(isset($d['rol'])) { $st=$pdo->prepare('UPDATE usuario SET rol=? WHERE id=?'); $st->execute([roleId($d['rol']),$id]); } $r=$pdo->query('SELECT * FROM usuario WHERE id='.$id)->fetch(); out(userFromRow($r)); }
  }

  if ($resource==='tickets') {
    if ($method==='GET') {
      $sql='SELECT t.*, e.id equipo_id, CONCAT_WS(\' \',u.nombre,u.apellido) cliente_nombre, u.email FROM ticket t LEFT JOIN usuario u ON u.id=t.cliente_id LEFT JOIN equipo e ON e.ticket_id=t.id ORDER BY t.id DESC';
      $rows=$pdo->query($sql)->fetchAll(); $out=[];
      foreach($rows as $r){ $out[]=['id'=>(string)$r['id'],'cliente'=>$r['cliente_nombre']??'','telefono'=>$r['telefono']??'','email'=>$r['email']??'','tipoDispositivo'=>ticketTypeName((int)$r['tipo']),'marca'=>'','modelo'=>'','problema'=>$r['descripcion']??'','estado'=>ticketStateName((int)$r['estado']),'tecnicoAsignadoId'=>$r['tecnico_id']?(string)$r['tecnico_id']:null,'idPC'=>$r['equipo_id']!==null?(string)$r['equipo_id']:null,'fechaCreacion'=>($r['fecha_emi']??date('Y-m-d')).'T00:00:00']; }
      out($out);
    }
    if ($method==='POST') { $d=body(); $clientId=(int)($d['clienteId']??$d['usuarioId']??0); if(!$clientId) { $st=$pdo->prepare('SELECT id FROM usuario WHERE email=? LIMIT 1'); $st->execute([$d['email']??'']); $clientId=(int)($st->fetchColumn()?:0); } if(!$clientId) out(['error'=>'clienteId es obligatorio'],422); $st=$pdo->prepare('INSERT INTO ticket(tipo,descripcion,estado,fecha_emi,cliente_id,telefono) VALUES(?,?,?,?,?,?)'); $st->execute([ticketTypeId($d['tipoDispositivo']??'pc'),$d['problema']??'',ticketStateId($d['estado']??'nuevo'),date('Y-m-d'),$clientId,$d['telefono']??'']); $new=(int)$pdo->lastInsertId(); out(['id'=>(string)$new,'ok'=>true],201); }
    if (($method==='PATCH'||$method==='PUT') && $id) { $d=body(); $fields=[];$vals=[]; if(isset($d['estado'])){$fields[]='estado=?';$vals[]=ticketStateId($d['estado']);} if(array_key_exists('tecnicoAsignadoId',$d)){$fields[]='tecnico_id=?';$vals[]=$d['tecnicoAsignadoId']?intval($d['tecnicoAsignadoId']):null;} if(!$fields) out(['ok'=>true]); $vals[]=$id; $pdo->prepare('UPDATE ticket SET '.implode(',',$fields).' WHERE id=?')->execute($vals); out(['ok'=>true]); }
  }

  if ($resource==='pcs') {
    if ($method==='GET') {
      $sql='SELECT tr.*, e.id equipo_id,e.marca,e.modelo,e.ticket_id,t.cliente_id,t.telefono,t.tecnico_id, CONCAT_WS(\' \',u.nombre,u.apellido) cliente_nombre,u.email FROM trabajo tr JOIN equipo e ON e.id=tr.equipo_id LEFT JOIN ticket t ON t.id=e.ticket_id LEFT JOIN usuario u ON u.id=t.cliente_id ORDER BY tr.id DESC';
      $rows=$pdo->query($sql)->fetchAll(); $out=[];
      foreach($rows as $r){ $cs=$pdo->prepare('SELECT nombre,precio,instalado FROM componente WHERE trabajo_id=? ORDER BY id');$cs->execute([$r['id']]);$components=[];foreach($cs as $c)$components[]=['nombre'=>$c['nombre']??'','precio'=>(string)($c['precio']??''),'verificado'=>(bool)$c['instalado']]; $ss=$pdo->prepare('SELECT nombre,estado,precio FROM servicio WHERE trabajo_id=? ORDER BY id');$ss->execute([$r['id']]);$rep=[];$totalServicios=0.0;foreach($ss as $s){$precioServicio=(float)($s['precio']??0);$totalServicios+=$precioServicio;$rep[]=['descripcion'=>$s['nombre']??'','realizada'=>(bool)$s['estado'],'precio'=>$precioServicio>0?(string)$s['precio']:''];} $out[]=['id'=>(string)$r['equipo_id'],'cliente'=>$r['cliente_nombre']??'','contacto'=>trim(($r['telefono']??'').' / '.($r['email']??'')),'marca'=>$r['marca']??'','modelo'=>$r['modelo']??'','estado'=>workStateName((int)$r['estado']),'componentes'=>$components,'reparaciones'=>$rep,'precioTotal'=>(string)(array_sum(array_map(fn($x)=>(float)$x['precio'],$components))+$totalServicios),'presupuesto'=>(string)($r['presupuesto']??''),'diagnostico'=>$r['diagnostico']??'','notas'=>$r['notas']??'','tecnicoAsignadoId'=>$r['tecnico_id']?(string)$r['tecnico_id']:null,'mensajes'=>messagesForWork($pdo,(int)$r['id']),'fechaCreacion'=>($r['fecha_ing']??date('Y-m-d')).'T00:00:00']; }
      out($out);
    }
    if ($method==='POST') { $d=body(); $pdo->beginTransaction(); $ticketId=(int)($d['ticketId']??0); if(!$ticketId){
      $clientId=(int)($d['clienteId']??0); if(!$clientId){ $contact=(string)($d['contacto']??''); $email=filter_var(trim(explode('/', $contact)[1]??''), FILTER_VALIDATE_EMAIL) ?: null; $nombre=trim((string)($d['cliente']??'Cliente')); if($email){$st=$pdo->prepare('SELECT id FROM usuario WHERE email=? LIMIT 1');$st->execute([$email]);$clientId=(int)($st->fetchColumn()?:0);} if(!$clientId){$st=$pdo->prepare('INSERT INTO usuario(nombre,apellido,rol,email,fecha) VALUES(?,"",0,?,CURDATE())');$st->execute([$nombre,$email]);$clientId=(int)$pdo->lastInsertId();} }$st=$pdo->prepare('INSERT INTO ticket(tipo,descripcion,estado,fecha_emi,cliente_id,telefono) VALUES(?,?,?,?,?,?)');$st->execute([0,$d['diagnostico']??'',2,date('Y-m-d'),$clientId,$d['contacto']??'']);$ticketId=(int)$pdo->lastInsertId();} $st=$pdo->prepare('INSERT INTO equipo(ticket_id,marca,modelo,descripcion) VALUES(?,?,?,?)');$st->execute([$ticketId,$d['marca']??'',$d['modelo']??'',$d['notas']??'']);$equipo=(int)$pdo->lastInsertId();$st=$pdo->prepare('INSERT INTO trabajo(diagnostico,notas,presupuesto,estado,fecha_ing,equipo_id) VALUES(?,?,?,?,CURDATE(),?)');$st->execute([$d['diagnostico']??'',$d['notas']??'',($d['presupuesto']??'')!==''?$d['presupuesto']:null,workStateId($d['estado']??'recibida'),$equipo]);$trabajo=(int)$pdo->lastInsertId();$pdo->prepare('INSERT INTO chat(trabajo_id) VALUES(?)')->execute([$trabajo]);$pdo->commit();out(['id'=>(string)$equipo,'ok'=>true],201); }
    if (($method==='PATCH'||$method==='PUT') && $id) { $d=body(); $sets=[];$vals=[]; foreach(['diagnostico'=>'diagnostico','notas'=>'notas','presupuesto'=>'presupuesto'] as $k=>$col){if(array_key_exists($k,$d)){$sets[]="$col=?";$vals[]=$d[$k];}} if(isset($d['estado'])){$sets[]='estado=?';$vals[]=workStateId($d['estado']);} if(isset($d['marca'])||isset($d['modelo'])){ $sets2=[];$vals2=[];if(isset($d['marca'])){$sets2[]='marca=?';$vals2[]=$d['marca'];}if(isset($d['modelo'])){$sets2[]='modelo=?';$vals2[]=$d['modelo'];}$vals2[]=$id;$pdo->prepare('UPDATE equipo SET '.implode(',',$sets2).' WHERE id=?')->execute($vals2);} if(isset($d['componentes'])){ $st=$pdo->prepare('DELETE FROM componente WHERE trabajo_id=(SELECT id FROM trabajo WHERE equipo_id=? LIMIT 1)'); $st->execute([$id]); $st=$pdo->prepare('SELECT id FROM trabajo WHERE equipo_id=? LIMIT 1'); $st->execute([$id]); $tidComp=(int)$st->fetchColumn(); if($tidComp){$ins=$pdo->prepare('INSERT INTO componente(nombre,precio,instalado,trabajo_id) VALUES(?,?,?,?)'); foreach((array)$d['componentes'] as $c)$ins->execute([$c['nombre']??'',($c['precio']??'')!==''?$c['precio']:0,!empty($c['verificado']),$tidComp]);}} if(isset($d['reparaciones'])){ $st=$pdo->prepare('DELETE FROM servicio WHERE trabajo_id=(SELECT id FROM trabajo WHERE equipo_id=? LIMIT 1)'); $st->execute([$id]); $st=$pdo->prepare('SELECT id FROM trabajo WHERE equipo_id=? LIMIT 1'); $st->execute([$id]); $tidSrv=(int)$st->fetchColumn(); if($tidSrv){$ins=$pdo->prepare('INSERT INTO servicio(nombre,estado,precio,trabajo_id) VALUES(?,?,?,?)'); foreach((array)$d['reparaciones'] as $r)$ins->execute([$r['descripcion']??'',!empty($r['realizada'])?1:0,(isset($r['precio'])&&is_numeric($r['precio'])&&(float)$r['precio']>0)?$r['precio']:0,$tidSrv]);}} if($sets){$st=$pdo->prepare('SELECT id FROM trabajo WHERE equipo_id=? LIMIT 1');$st->execute([$id]);$tid=(int)$st->fetchColumn();$vals[]=$tid;$pdo->prepare('UPDATE trabajo SET '.implode(',',$sets).' WHERE id=?')->execute($vals);} out(['ok'=>true]); }
  }

  if ($resource==='mensajes' && $method==='POST') { $d=body(); $chat=(int)($d['chatId']??0); if(!$chat && !empty($d['equipoId'])){ $st=$pdo->prepare('SELECT c.id FROM chat c JOIN trabajo tr ON tr.id=c.trabajo_id WHERE tr.equipo_id=? LIMIT 1');$st->execute([(int)$d['equipoId']]);$chat=(int)$st->fetchColumn(); } if(!$chat && !empty($d['trabajoId'])){$st=$pdo->prepare('SELECT id FROM chat WHERE trabajo_id=? LIMIT 1');$st->execute([(int)$d['trabajoId']]);$chat=(int)$st->fetchColumn();} if(!$chat) out(['error'=>'chatId/trabajoId obligatorio'],422);$st=$pdo->prepare('INSERT INTO mensaje(mensaje,fecha,usuario_id,chat_id) VALUES(?,NOW(),?,?)');$st->execute([$d['texto']??$d['mensaje']??'',(int)($d['usuarioId']??0),$chat]);out(['id'=>(string)$pdo->lastInsertId(),'ok'=>true],201); }
  if ($resource==='mensajes' && $method==='GET') { $chat=(int)($_GET['chat_id']??0);$st=$pdo->prepare('SELECT m.*, CONCAT_WS(\' \',u.nombre,u.apellido) nombre,u.rol FROM mensaje m LEFT JOIN usuario u ON u.id=m.usuario_id WHERE m.chat_id=? ORDER BY m.fecha');$st->execute([$chat]);$roles=[0=>'cliente',1=>'tecnico',2=>'administrador'];$out=[];foreach($st as $r)$out[]=['id'=>(string)$r['id'],'idRemitente'=>(string)$r['usuario_id'],'nombreRemitente'=>$r['nombre']??'','rolRemitente'=>$roles[(int)$r['rol']]??'cliente','texto'=>$r['mensaje']??'','fechaHora'=>$r['fecha']??''];out($out);}

  // Envía por mail al cliente el PDF de la orden de reparación.
  // El destinatario sale SIEMPRE de la base de datos (mail con el que el cliente
  // inició sesión / generó el ticket); el navegador nunca lo elige.
  if ($resource==='enviar-pdf' && $method==='POST') {
    $d=body();
    $equipoId=(int)($d['equipoId']??0);
    $usuarioId=(int)($d['usuarioId']??0);
    $pdfBase64=(string)($d['pdf']??'');
    if (!$equipoId || !$usuarioId || $pdfBase64==='') out(['error'=>'Faltan datos para enviar el PDF'],422);

    // Solo técnicos (1) y administradores (2) pueden enviar órdenes por mail.
    $st=$pdo->prepare('SELECT rol FROM usuario WHERE id=? LIMIT 1');
    $st->execute([$usuarioId]);
    $rolEmisor=$st->fetchColumn();
    if ($rolEmisor===false || (int)$rolEmisor<1) out(['error'=>'No tenés permiso para enviar órdenes por mail'],403);

    // Mail y nombre del cliente dueño del ticket de este equipo.
    $st=$pdo->prepare('SELECT u.email, CONCAT_WS(\' \',u.nombre,u.apellido) nombre FROM equipo e JOIN ticket t ON t.id=e.ticket_id JOIN usuario u ON u.id=t.cliente_id WHERE e.id=? LIMIT 1');
    $st->execute([$equipoId]);
    $cliente=$st->fetch();
    if (!$cliente) out(['error'=>'No se encontró el cliente de esta orden'],404);
    $emailCliente=filter_var(trim((string)($cliente['email']??'')), FILTER_VALIDATE_EMAIL);
    if (!$emailCliente) out(['error'=>'El cliente no tiene un mail válido registrado'],422);
    $nombreCliente=trim((string)($cliente['nombre']??''));

    // Validar que lo recibido sea realmente un PDF y no sea gigante (máx. 5 MB).
    if (strlen($pdfBase64)>7000000) out(['error'=>'El PDF es demasiado grande'],413);
    $pdfBinario=base64_decode($pdfBase64, true);
    if ($pdfBinario===false || substr($pdfBinario,0,5)!=='%PDF-') out(['error'=>'El archivo recibido no es un PDF válido'],422);

    $nombreArchivo=preg_replace('/[^A-Za-z0-9._-]+/','_',(string)($d['archivo']??''));
    $nombreArchivo=trim((string)$nombreArchivo,'._-');
    if ($nombreArchivo==='') $nombreArchivo='Orden_'.$equipoId;
    if (strtolower(substr($nombreArchivo,-4))!=='.pdf') $nombreArchivo.='.pdf';

    // Freno simple contra envíos repetidos (doble clic): 30 segundos por orden.
    $marca=sys_get_temp_dir().DIRECTORY_SEPARATOR.'techaraujo_pdf_'.$equipoId.'.lock';
    if (is_file($marca) && (time()-(int)filemtime($marca))<30) out(['error'=>'Esta orden ya se envió hace instantes. Esperá unos segundos.'],429);

    $autoload=dirname(__DIR__).'/vendor/autoload.php';
    if (!is_file($autoload)) out(['error'=>'Falta la carpeta vendor. Ejecutá: composer require phpmailer/phpmailer'],503);
    require_once $autoload;
    if (!class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) out(['error'=>'Falta instalar PHPMailer. Ejecutá: composer require phpmailer/phpmailer'],503);

    $smtpUser=configValue('SMTP_USER');
    $smtpPass=configValue('SMTP_PASS');
    if ($smtpUser==='' || $smtpPass==='') out(['error'=>'Falta configurar SMTP_USER y SMTP_PASS en el archivo .env'],503);
    $smtpPuerto=(int)configValue('SMTP_PORT','587');

    try {
      $mail=new \PHPMailer\PHPMailer\PHPMailer(true);
      $mail->isSMTP();
      $mail->Host=configValue('SMTP_HOST','smtp.gmail.com');
      $mail->SMTPAuth=true;
      $mail->Username=$smtpUser;
      $mail->Password=$smtpPass;
      $mail->Port=$smtpPuerto;
      $mail->SMTPSecure=($smtpPuerto===465)?\PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS:\PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
      $mail->CharSet='UTF-8';
      $mail->setFrom(configValue('SMTP_FROM',$smtpUser), configValue('SMTP_FROM_NAME','TechRepair'));
      $mail->addAddress($emailCliente,$nombreCliente);
      $mail->Subject='Tu orden de reparación N° '.$equipoId;
      $saludo=$nombreCliente!==''?'Hola '.htmlspecialchars($nombreCliente,ENT_QUOTES,'UTF-8').',':'Hola,';
      $mail->isHTML(true);
      $mail->Body='<p>'.$saludo.'</p><p>Te enviamos adjunta la orden de reparación N° '.$equipoId.' en formato PDF.</p><p>Ante cualquier duda, respondé este mail o comunicate con nosotros.</p><p>Saludos,<br>TechRepair</p>';
      $mail->AltBody=($nombreCliente!==''?'Hola '.$nombreCliente.',':'Hola,')."\n\nTe enviamos adjunta la orden de reparación N° ".$equipoId." en formato PDF.\n\nSaludos,\nTechRepair";
      $mail->addStringAttachment($pdfBinario,$nombreArchivo,'base64','application/pdf');
      $mail->send();
    } catch (Throwable $e) {
      error_log('Error al enviar el PDF por mail: '.$e->getMessage());
      out(['error'=>'No se pudo enviar el mail. Revisá la configuración SMTP (usuario, contraseña de aplicación y puerto).'],502);
    }

    @touch($marca);
    out(['ok'=>true,'enviadoA'=>$emailCliente]);
  }

  // Comparador de precios: busca en Google Shopping a través de SerpApi.
  // La clave (SERPAPI_KEY) vive solo en el servidor; el navegador nunca la ve.
  if ($resource==='comparar-precios' && $method==='GET') {
    $usuarioId=(int)($_GET['usuarioId']??0);
    $consulta=trim((string)($_GET['q']??''));
    if ($consulta==='' || mb_strlen($consulta)>100) out(['error'=>'Escribí qué querés buscar (máximo 100 caracteres)'],422);

    // Cada búsqueda consume cupo del plan, así que solo técnicos y administradores.
    $st=$pdo->prepare('SELECT rol FROM usuario WHERE id=? LIMIT 1');
    $st->execute([$usuarioId]);
    $rolBusca=$st->fetchColumn();
    if ($rolBusca===false || (int)$rolBusca<1) out(['error'=>'No tenés permiso para usar el comparador'],403);

    $claveSerp=configValue('SERPAPI_KEY');
    if ($claveSerp==='') out(['error'=>'Falta configurar SERPAPI_KEY en el archivo .env'],503);

    // Caché de 1 hora por búsqueda: repetir la misma consulta no gasta cupo.
    $archivoCache=sys_get_temp_dir().DIRECTORY_SEPARATOR.'techaraujo_shop_'.md5(mb_strtolower($consulta)).'.json';
    if (is_file($archivoCache) && (time()-(int)filemtime($archivoCache))<3600) {
      $guardado=json_decode((string)file_get_contents($archivoCache), true);
      if (is_array($guardado)) out(['resultados'=>$guardado,'cache'=>true]);
    }

    if (!function_exists('curl_init')) out(['error'=>'Falta activar la extensión curl en php.ini (extension=curl)'],503);

    $urlSerp='https://serpapi.com/search.json?'.http_build_query([
      'engine'=>'google_shopping',
      'q'=>$consulta,
      'gl'=>configValue('SHOPPING_GL','ar'),
      'hl'=>'es',
      'api_key'=>$claveSerp,
    ]);

    $ch=curl_init($urlSerp);
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>30]);
    $cacert=configValue('CURL_CA_BUNDLE');
    if ($cacert!=='' && is_file($cacert)) curl_setopt($ch,CURLOPT_CAINFO,$cacert);
    $respuesta=curl_exec($ch);
    $codigoHttp=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);
    $errorCurl=curl_error($ch);
    curl_close($ch);

    if ($respuesta===false) {
      error_log('SerpApi: error de conexión: '.$errorCurl);
      $pista=stripos($errorCurl,'SSL certificate')!==false ? ' (problema de certificados SSL: definí CURL_CA_BUNDLE en el .env)' : '';
      out(['error'=>'No se pudo conectar con el servicio de precios'.$pista],502);
    }

    $datos=json_decode((string)$respuesta, true);
    if (!is_array($datos)) { error_log('SerpApi: respuesta inválida (HTTP '.$codigoHttp.')'); out(['error'=>'El servicio de precios respondió algo inesperado'],502); }

    $resultados=[];
    if (isset($datos['shopping_results']) && is_array($datos['shopping_results'])) {
      foreach (array_slice($datos['shopping_results'],0,24) as $p) {
        $enlace=(string)($p['product_link']??$p['link']??'');
        if (!preg_match('#^https?://#i',$enlace)) $enlace='';
        $imagen=(string)($p['thumbnail']??'');
        if (!preg_match('#^https://#i',$imagen)) $imagen='';
        $resultados[]=[
          'nombre'=>(string)($p['title']??''),
          'tienda'=>(string)($p['source']??''),
          'precio'=>isset($p['extracted_price']) ? (float)$p['extracted_price'] : null,
          'precioTexto'=>(string)($p['price']??''),
          'enlace'=>$enlace,
          'imagen'=>$imagen,
          'envio'=>(string)($p['delivery']??''),
        ];
      }
    } elseif (!empty($datos['error']) && stripos((string)$datos['error'],'any results')===false) {
      // Sin cupo, clave inválida, etc.: se registra el motivo real y al usuario se le da un mensaje claro.
      error_log('SerpApi: '.(string)$datos['error']);
      $mensaje=stripos((string)$datos['error'],'api_key')!==false ? 'La clave SERPAPI_KEY no es válida' : 'El servicio de precios devolvió un error (revisá el cupo mensual de tu plan)';
      out(['error'=>$mensaje],502);
    }

    // De más barato a más caro; los que no tienen precio van al final.
    usort($resultados, function($a,$b){
      if ($a['precio']===null && $b['precio']===null) return 0;
      if ($a['precio']===null) return 1;
      if ($b['precio']===null) return -1;
      return $a['precio'] <=> $b['precio'];
    });

    @file_put_contents($archivoCache, json_encode($resultados, JSON_UNESCAPED_UNICODE));
    out(['resultados'=>$resultados,'cache'=>false]);
  }

  out(['error'=>'Recurso no encontrado'],404);
} catch(Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); error_log('Error interno de API: '.$e->getMessage()); out(['error'=>'Error interno'],500); }
?>
