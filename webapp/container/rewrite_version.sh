#!/bin/bash
#
# LaraelアプリケーションのVersionを引数で書き換えるスクリプト。 
#

set -e
# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}
cd ..

APP_VERSION_FILE=./version.php

if [ "${1}" = "" ] ; then
  echo "引数には、コンテナにつけるタグを指定してください。"
  exit 1
fi
VERSION=${1}


sed -i "s/VERSION.*/VERSION='${VERSION}';/g" ${APP_VERSION_FILE}
