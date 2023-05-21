#!/bin/bash

set -e

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

if [ "${1}" = "" ] ; then
    echo "引数には、S3名を指定してください。"
    exit 1
fi
s3_buget_name=${1}

# SAMテンプレートをpackageコマンドを使用してLambdaのソースコードと共にS3に格納
sam package --template-file template.yaml \
  --output-template-file output.yaml \
  --s3-bucket ${s3_buget_name}

# デプロイ
aws cloudformation deploy --template-file output.yaml \
  --stack-name WebSocketApiStack \
  --capabilities CAPABILITY_IAM

