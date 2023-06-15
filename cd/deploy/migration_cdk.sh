#!/bin/bash
#
#
# 前提として必要なコマンド
#   jq,
#
# 前提として必要な環境変数
#   STAGE_ID
#

set -eux

VERSION_TAG=${1}

CONTEXT_JSON_FILE_PATH='./aws-infra/cdk.json'

migration_cdk=$(jq ".context.stages.${STAGE_ID}.migrateInfrastructure" ${CONTEXT_JSON_FILE_PATH})

echo ${migration_cdk}

if [[ "${migration_cdk}" != 'true' ]] ; then
    echo "migrateInfrastructure が ${migration_cdk} であるため、${STAGE_ID} へのCDKの適用はスキップします。"
    exit 0
fi

echo "migrateInfrastructure:${migration_cdk} ${STAGE_ID} へのCDKを適用。"



exit 0
