#!/bin/bash

# 「Tagを切ったことによるDockerImageのビルド結果」をSlackへ投稿するスクリプト。
#
# Premise
#   以下の環境変数は呼び出し元(CodeBuild or 以前の処理)で設定され、渡ってくる前提
#     SLACK_WEBHOOK_URL, IMAGE_TAG, AWS_DEFAULT_REGION, CODEBUILD_WEBHOOK_ACTOR_ACCOUNT_ID, CODEBUILD_SOURCE_REPO_URL
#
# Usage
#   notification_build.sh "true"|"false"

SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

RESULT=${1}

echo $RESULT

color='danger'
result_text='失敗'
if [ $RESULT = true ]; then
    color='good'
    result_text='完了'
fi

ecr_console="https://${AWS_DEFAULT_REGION}.console.aws.amazon.com/ecr/repositories/private/${CODEBUILD_WEBHOOK_ACTOR_ACCOUNT_ID}/alws-app"
repo_hash_url="${CODEBUILD_SOURCE_REPO_URL/%.git/}/tree/${CODEBUILD_SOURCE_VERSION}"

data=`cat <<_EOT_
{
     "attachments": [
        {
	        "mrkdwn_in": ["text"],
            "color": "${color}",
            "pretext": "maho.cityのコンテナイメージのビルドと登録が${result_text}しました。",
            "title": "CodeBuild : ${CODEBUILD_BUILD_ID}",
            "title_link": "${CODEBUILD_BUILD_URL}",
            "fields": [
                {
                    "title": "Version/Git Tag/Container Image Tag",
                    "value": "${IMAGE_TAG}",
                    "short": false
                },
                {
                    "title": "ECR(AWS Console):alws-app",
                    "value": "${ecr_console}",
                    "short": false
                },
                {
                    "title": "Source(eligible git hash)",
                    "value": "${repo_hash_url}",
                    "short": false
                }
            ]
        }
    ]
}
_EOT_`

./slack_send.sh "${data}" ${SLACK_WEBHOOK_URL}
