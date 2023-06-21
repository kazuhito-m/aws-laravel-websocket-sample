#!/bin/bash
#
# 設定ファイル(./aws-infra/cdk.josn)に従い、StageIDにしたがってCDKを適用するスクリプト。
#
# 前提として必要なコマンド
#   echo, jq, npm, node
#
# 前提として必要な環境変数
#   STAGE_ID
#

set -eux

VERSION_TAG=${1}

cd ./aws-infra

STAGE_ID_PASCAL="$(echo ${STAGE_ID} | sed -r 's/(^|_)([a-z])/\U\2/g')"

echo ${STAGE_ID_PASCAL}

migration_cdk=$(jq ".context.stages.${STAGE_ID}.migrateInfrastructure" ./cdk.json)

echo ${migration_cdk}

if [[ "${migration_cdk}" != 'true' ]]; then
    echo "migrateInfrastructure が ${migration_cdk} であるため、${STAGE_ID} へのCDKの適用はスキップします。"
    exit 0
fi

echo "migrateInfrastructure:${migration_cdk} ${STAGE_ID} へのCDKを適用。"

./rewrite_version.sh ${VERSION_TAG}

npm install
npm run cdk deploy -- AlwsStageOf${STAGE_ID_PASCAL}Stack --context stageId=${STAGE_ID} --require-approval never

exit 0
