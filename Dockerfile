# משתמש ב-image של PHP עם Apache
FROM php:8.2-apache

# מעתיק את כל הקבצים לתוך תקיית ברירת המחדל בשרת (htdocs)
COPY . /var/www/html/

# מאפשר שימוש בשליחת מיילים (אם צריך הגדרות נוספות, תוסיף כאן בעתיד)
RUN docker-php-ext-install mysqli

# נותן הרשאות לקבצים
RUN chown -R www-data:www-data /var/www/html

# פותח את הפורט שבו אפאצ'י יאזין
EXPOSE 80
