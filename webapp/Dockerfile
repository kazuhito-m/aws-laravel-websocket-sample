# ---- pre build (node/npm) ----

FROM node:18-alpine as builder
COPY ./ /app
WORKDIR /app
RUN npm install
RUN npm run build
RUN rm -rf ./node_modules/
RUN rm -rf ./container/ ./tests/
RUN mv .env.production .env

# ---- main ----

FROM webdevops/php-nginx:8.2-alpine

ENV WEB_DOCUMENT_ROOT=/app/public
ENV PHP_DISMOD=bz2,calendar,exiif,ffi,intl,gettext,ldap,mysqli,imap,pdo_pgsql,pgsql,soap,sockets,sysvmsg,sysvsm,sysvshm,shmop,xsl,zip,gd,apcu,vips,yaml,imagick,mongodb,amqp

RUN apk add autoconf build-base imagemagick-dev \
  && pecl install imagick \
  && docker-php-ext-enable imagick \
  && rm -rf /tmp/* /var/cache/apk/*

COPY --from=builder /app /app
WORKDIR /app

RUN composer install --no-interaction --optimize-autoloader --no-dev \
  && php artisan optimize

# Ensure all of our files are owned by the same user and group.
RUN chown -R application:application .

COPY container/script/*.sh /usr/bin/
RUN chmod +x /usr/bin/*.sh
CMD ["/usr/bin/bootup.sh"]
