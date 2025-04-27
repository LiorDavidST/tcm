<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// קריאת קובץ env
function parseEnv($path) {
    $vars = [];
    if (!file_exists($path)) return $vars;
    foreach (file($path) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (!strpos($line, '=')) continue;
        list($name, $value) = explode('=', trim($line), 2);
        $vars[$name] = $value;
    }
    return $vars;
}

// טען את משתני הסביבה
$env = parseEnv(__DIR__ . '/.env');

require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mail = new PHPMailer(true);

    try {
        // הגדרות שרת SMTP
        $mail->isSMTP();
        $mail->Host = $env['MAIL_HOST'];
        $mail->SMTPAuth = true;
        $mail->Username = $env['MAIL_USERNAME'];
        $mail->Password = $env['MAIL_PASSWORD'];
        $mail->SMTPSecure = $env['MAIL_ENCRYPTION'];
        $mail->Port = $env['MAIL_PORT'];

        // מאפייני המייל
        $mail->setFrom($env['MAIL_FROM'], 'Website Contact Form');
        $mail->addAddress($env['MAIL_FROM']); // לעצמך

        $name = htmlspecialchars($_POST['name']);
        $email = htmlspecialchars($_POST['email']);
        $phone = htmlspecialchars($_POST['phone']);
        $message = htmlspecialchars($_POST['message']);

        $mail->Subject = 'New Contact Form Submission';
        $mail->Body = "Name: $name\nEmail: $email\nPhone: $phone\n\nMessage:\n$message\n";

        $mail->send();
        echo 'success';
    } catch (Exception $e) {
        echo 'error';
    }
}
?>
