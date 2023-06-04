#!/bin/bash
#
# 引数に指定された `VERSION_TAG` から、それに対応する「コンテナリポジトリのイメージ」を探し、
# AWS Lambdaへとデプロイするスクリプト。
#
# 指定された `VERSION_TAG` に対応するコンテナイメージが、ECR内にない場合、エラーとなる。
#
# 前提として必要な環境変数
#   LAMBDA_FUNCTION_NAMES, CONTAINER_REGISTRY_URI_LAMBDA, STAGE_ID, AWS_DEFAULT_REGION
#

set -eux

VERSION_TAG=${1}
CONTAINER_REGISTRY_TAG_URI=${CONTAINER_REGISTRY_URI_LAMBDA}:${VERSION_TAG}

for function_name in ${LAMBDA_FUNCTION_NAMES/,/ }; do
    aws lambda update-function-code --region ${AWS_DEFAULT_REGION} \
        --image-uri ${CONTAINER_REGISTRY_TAG_URI} \
        --function-name ${function_name} > "result_${function_name}.json"
done

exit 0
