#!/bin/bash
#
# 引数に指定された `VERSION_TAG` から、それに対応する「コンテナリポジトリのイメージ」を探し、
# AWS Lambdaへとデプロイするスクリプト。
#
# 指定された `VERSION_TAG` に対応するコンテナイメージが、ECR内にない場合、エラーとなる。
#
# 前提として必要な環境変数
#   LAMBDA_FUNCTION_NAMES, STAGE_ID, AWS_DEFAULT_REGION
#

set -eux

VERSION_TAG=${1}

lambda_function_name_01=${LAMBDA_FUNCTION_NAMES/,*/}

# aws ecs describe-task-definition --task-definition ${ECS_TASK_FAMILY} | \
#     jq '.taskDefinition | del (.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
#     > ./taskdef.json

# sed -Ei "s/\"image\": (.*):(.*)\",/\"image\": \1:${VERSION_TAG}\",/g" ./taskdef.json

# TDOO ECSにコンテナがあるかどうかをチェックして、なかったら殺す。

# aws ecs register-task-definition --cli-input-json file://taskdef.json > ./register-result.json
# aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --task-definition ${ECS_TASK_FAMILY}

ecr_url='https://contaner_name'

for function_name in ${LAMBDA_FUNCTION_NAMES/,/ }; do
    echo aws lambda update-function-code --region ${AWS_DEFAULT_REGION} \
        --image-uri ${ecr_url} \
        --function-name ${function_name}
done

exit 0
