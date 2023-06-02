#!/bin/bash
# container起動時に実行するスクリプト。

set -eu

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

# Laravelのマイグレーションを起動時に必ず行う。
/app/migration.sh

# nginx始め、各種サービス立ち上げ。
supervisord

