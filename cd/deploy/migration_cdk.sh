#!/bin/bash
#
#
# 前提として必要なコマンド
#   echo, jq, npm, node
#
# 前提として必要な環境変数
#   STAGE_ID
#

set -eux

cd ./aws-infra

CONTEXT_JSON_FILE_PATH='./cdk.json'
STAGE_ID_PASCAL="$(echo ${STAGE_ID} | sed -r 's/(^|_)([a-z])/\U\2/g')"

echo ${STAGE_ID_PASCAL}

migration_cdk=$(jq ".context.stages.${STAGE_ID}.migrateInfrastructure" ${CONTEXT_JSON_FILE_PATH})

echo ${migration_cdk}

if [[ "${migration_cdk}" != 'true' ]] ; then
    echo "migrateInfrastructure が ${migration_cdk} であるため、${STAGE_ID} へのCDKの適用はスキップします。"
    exit 0
fi

echo "migrateInfrastructure:${migration_cdk} ${STAGE_ID} へのCDKを適用。"

npm install
npm run cdk deploy -- AlwsStageOf${STAGE_ID_PASCAL}Stack --context stageId=${STAGE_ID} --require-approval never

exit 0
