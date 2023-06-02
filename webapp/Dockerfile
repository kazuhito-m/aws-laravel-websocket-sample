FROM webdevops/php-nginx:8.2-alpine

ENV WEB_DOCUMENT_ROOT=/app/public
ENV PHP_DISMOD=bz2,calendar,exiif,ffi,intl,gettext,ldap,mysqli,imap,pdo_pgsql,pgsql,soap,sockets,sysvmsg,sysvsm,sysvshm,shmop,xsl,zip,gd,apcu,vips,yaml,imagick,mongodb,amqp

RUN apk add autoconf build-base imagemagick-dev \
  && pecl install imagick \
  && docker-php-ext-enable imagick \
  && rm -rf /tmp/* /var/cache/apk/*

COPY ./ /app
WORKDIR /app

RUN rm -rf ./container/

RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN php artisan optimize

# Ensure all of our files are owned by the same user and group.
RUN chown -R application:application .

COPY container/script/bootup.sh /usr/bin/
RUN chmod +x /usr/bin/bootup.sh
CMD ["/usr/bin/bootup.sh"]