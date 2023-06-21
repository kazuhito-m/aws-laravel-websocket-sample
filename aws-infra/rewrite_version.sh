#!/bin/bash
#
# LaraelアプリケーションのVersionを引数で書き換えるスクリプト。 
#

set -e

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

if [ "${1}" = "" ] ; then
  echo "第一引数には、AWS-TAGに仕込むVersionを指定してください。"
  exit 1
fi
VERSION=${1}

sed -i "s/\"version\":.*/\"version\": \"${VERSION}\",/g" ./package.json
