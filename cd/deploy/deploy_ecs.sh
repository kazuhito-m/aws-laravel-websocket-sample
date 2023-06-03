#!/bin/bash
#
# 引数に指定された `VERSION_TAG` から、それに対応する「コンテナリポジトリのイメージ」を探し、
# ECSへとデプロイするスクリプト。
#
# 指定された `VERSION_TAG` に対応するコンテナイメージが、ECR内にない場合、エラーとなる。
#
# 前提として必要な環境変数
#   STAGE_ID, ECS_CLUSTER, ECS_SERVICE, ECS_TASK_FAMILY
#

set -eux

VERSION_TAG=${1}

aws ecs describe-task-definition --task-definition ${ECS_TASK_FAMILY} | \
    jq '.taskDefinition | del (.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
    > ./taskdef.json

sed -Ei "s/\"image\": (.*):(.*)\",/\"image\": \1:${VERSION_TAG}\",/g" ./taskdef.json

# TDOO ECSにコンテナがあるかどうかをチェックして、なかったら殺す。

aws ecs register-task-definition --cli-input-json file://taskdef.json
aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --task-definition ${ECS_TASK_FAMILY}

exit 0
