# Backend PHP (API) para Render. El frontend se publica aparte como Static Site.
FROM php:8.3-apache

# Extensiones que usa la API: MySQL (PDO) y zip (lo necesita Composer)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libzip-dev unzip git \
 && docker-php-ext-install pdo_mysql zip \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Librerías PHP (Google, PHPMailer...)
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --optimize-autoloader

# La API queda en /backend/api.php
COPY backend ./backend

# Render indica el puerto en la variable PORT
ENV PORT=10000
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
 && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-available/000-default.conf

EXPOSE 10000
