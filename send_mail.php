<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mail = new PHPMailer(true);

    try {
        // הגדרות שרת SMTP
        $mail->isSMTP();
        $mail->Host = 'mail.privateemail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'info@tcm-solutions.com'; // כתובת המייל שלך
        $mail->Password = '***הסיסמה שלך***'; // סיסמת התיבה
        $mail->SMTPSecure = 'tls'; // או ssl אם תבחר פורט 465
        $mail->Port = 587; // פורט TLS

        // מאפייני המייל
        $mail->setFrom('info@tcm-solutions.com', 'Website Contact Form');
        $mail->addAddress('info@tcm-solutions.com'); // לעצמך

        $name = htmlspecialchars($_POST['name']);
        $email = htmlspecialchars($_POST['email']);
        $phone = htmlspecialchars($_POST['phone']);
        $message = htmlspecialchars($_POST['message']);

        $mail->Subject = 'New Contact Form Submission';
        $mail->Body = "Name: $name\nEmail: $email\nPhone: $phone\n\nMessage:\n$message\n";

        $mail->send();
        echo 'success';
    } catch (Exception $e) {
        // כאן מודפסים פרטי השגיאה המלאים
        echo 'Mailer Error: ' . $mail->ErrorInfo;
    }
}
?>
