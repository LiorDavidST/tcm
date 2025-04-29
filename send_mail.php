<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'src/PHPMailer.php';
require 'src/SMTP.php';
require 'src/Exception.php';

// טעינת משתני סביבה
$smtpHost   = $_ENV['SMTP_HOST']   ?? '';
$smtpUser   = $_ENV['SMTP_USER']   ?? '';
$smtpPass   = $_ENV['SMTP_PASS']   ?? '';
$smtpPort   = $_ENV['SMTP_PORT']   ?? 465;
$smtpSecure = $_ENV['SMTP_SECURE'] ?? 'ssl';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name    = $_POST["name"]    ?? '';
    $email   = $_POST["email"]   ?? '';
    $phone   = $_POST["phone"]   ?? '';
    $message = $_POST["message"] ?? '';

    $mail = new PHPMailer(true);

    try {
        // הגדרות SMTP
        $mail->isSMTP();
        $mail->Host       = $smtpHost;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtpUser;
        $mail->Password   = $smtpPass;
        $mail->SMTPSecure = $smtpSecure;
        $mail->Port       = $smtpPort;

        // בדיקה ודיבוג על FROM
        error_log("📬 SMTP_USER from env: " . $smtpUser);
        if (!$smtpUser || !filter_var($smtpUser, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid FROM address: '$smtpUser'");
        }

        // הגדרת השולח
        $mail->setFrom($smtpUser, 'Website Contact Form');
        $mail->addAddress($smtpUser);
        if ($email) {
            $mail->addReplyTo($email, $name);
        }

        // תוכן המייל
        $mail->isHTML(true);
        $mail->Subject = 'New Contact Form Submission';
        $mail->Body    = "
            <h3>New message from your website</h3>
            <p><strong>Name:</strong> {$name}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Phone:</strong> {$phone}</p>
            <p><strong>Message:</strong><br>{$message}</p>
        ";

        $mail->send();
        echo "success";

    } catch (Exception $e) {
        error_log("❌ Mailer Error: " . $mail->ErrorInfo . ' | ' . $e->getMessage());
        echo "error";
    }

} else {
    http_response_code(405);
    echo "error";
}
