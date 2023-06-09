#!/bin/bash
# container起動時に実行するスクリプト。

set -eu

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

overwrite_env.sh '/app/.env'

echo '---- Laravelのマイグレーションを起動時に必ず行う。 ----'
/app/migration.sh

echo '---- nginx, php-fpm, 各種サービス立ち上げ。 ----'
supervisord

