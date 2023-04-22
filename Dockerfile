FROM webdevops/php-nginx:8.2-alpine

RUN apk add autoconf build-base imagemagick-dev
RUN pecl install imagick
RUN docker-php-ext-enable imagick

ENV WEB_DOCUMENT_ROOT=/app/public
ENV PHP_DISMOD=bz2,calendar,exiif,ffi,intl,gettext,ldap,mysqli,imap,pdo_pgsql,pgsql,soap,sockets,sysvmsg,sysvsm,sysvshm,shmop,xsl,zip,gd,apcu,vips,yaml,imagick,mongodb,amqp

COPY webapp /app
# COPY webapp/composer.json webapp/composer.lock webapp/artisan /app/
WORKDIR /app

RUN pwd && ls -l
RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN ls -l

RUN php artisan optimize
# Ensure all of our files are owned by the same user and group.
RUN chown -R application:application .

