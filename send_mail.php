<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->SMTPDebug = 2; // ✅ מוסיף הדפסת דיבאג
        $mail->Debugoutput = 'html'; // ✅ שההדפסות יהיו יפות
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
