<?php
// ✅ מוודא שהשגיאות יוצגו על המסך
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ✅ הדפסה לבדיקה אם בכלל נכנסו לקובץ
file_put_contents('log.txt', date('Y-m-d H:i:s') . " - Got POST\n", FILE_APPEND);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->SMTPDebug = 2; // ✅ הדפסת דיבאג SMTP
        $mail->Debugoutput = 'html';
        $mail->Host = getenv('MAIL_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = getenv('MAIL_USERNAME');
        $mail->Password = getenv('MAIL_PASSWORD');
        $mail->SMTPSecure = getenv('MAIL_ENCRYPTION');
        $mail->Port = getenv('MAIL_PORT');

        $mail->setFrom(getenv('MAIL_FROM'), 'Website Contact Form');
        $mail->addAddress(getenv('MAIL_FROM'));

        $name = htmlspecialchars($_POST['name']);
        $email = htmlspecialchars($_POST['email']);
        $phone = htmlspecialchars($_POST['phone']);
        $message = htmlspecialchars($_POST['message']);

        $mail->Subject = 'New Contact Form Submission';
        $mail->Body = "Name: $name\nEmail: $email\nPhone: $phone\n\nMessage:\n$message\n";

        $mail->send();
        echo '✅ Message sent successfully!';
    } catch (Exception $e) {
        echo '❌ Mailer Error: ' . $mail->ErrorInfo;
    }
}
?>
