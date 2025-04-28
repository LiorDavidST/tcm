# השתמש בגרסת PHP עם Apache
FROM php:8.2-apache

# העתיק את כל הקבצים מהפרויקט
COPY . /var/www/html/

# התקנת ספריית PHPMailer אם יש צורך
RUN docker-php-ext-install mysqli

# פתיחת פורט
EXPOSE 80
