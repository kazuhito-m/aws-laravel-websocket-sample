#!/bin/bash
#
# 引数に指定された `VERSION_TAG` から、それに対応する「コンテナリポジトリのイメージ」を探し、
# ECSへとデプロイするスクリプト。
#
# 指定された `VERSION_TAG` に対応するコンテナイメージが、ECR内にない場合、エラーとなる。
#
# 前提として必要な環境変数
#   STAGE_ID, CONTAINER_REGISTRY_URI_APP, ECS_CLUSTER, ECS_SERVICE, ECS_TASK_FAMILY
#

set -eux

VERSION_TAG=${1}
ESCAPED_URI=$(echo ${CONTAINER_REGISTRY_URI_APP} | sed 's/\//\\\//g')
CONTAINER_REGISTRY_TAG_URI=${ESCAPED_URI}:${VERSION_TAG}

aws ecs describe-task-definition --task-definition ${ECS_TASK_FAMILY} | \
    jq '.taskDefinition | del (.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
    > ./taskdef.json

jq ".containerDefinitions[0].image=\"${CONTAINER_REGISTRY_TAG_URI}\"" ./taskdef.json > ./overwrited.json

echo '-------- 変更後 taskdef.json begin --------'
cat ./overwrited.json
echo '-------- 変更後 taskdef.json end   --------'

# TDOO ECSにコンテナがあるかどうかをチェックして、なかったら殺す。

aws ecs register-task-definition --cli-input-json file://overwrited.json > ./register-result.json
aws ecs update-service --cluster ${ECS_CLUSTER} \
    --service ${ECS_SERVICE} \
    --task-definition ${ECS_TASK_FAMILY}

exit 0
