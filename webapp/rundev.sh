#!/bin/bash

set -eu

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

./migration.sh

php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
php artisan clear-compiled

php artisan serve
