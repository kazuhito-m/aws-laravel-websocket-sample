#!/bin/bash
# 
# 自身が今居るGitHashについてるStageTag("production"等)から、
# VersionTag("0.0.1"等)へと変換するスクリプト。
# 発見できなければ、異常ステータスを返す。
#

STAGE_TAG=${1}

version_tag=$(git tag -l --contains ${STAGE_TAG} | grep -E '^[0-9]+\.[0-9]+\..*$')
result=${?}

if [ $result != 0 ]; then
  echo "${tag} に対応するVersionTagが見つかりません。"
  exit 1
fi

echo ${tag}

exit 0
