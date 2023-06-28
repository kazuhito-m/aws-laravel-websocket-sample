#!/bin/bash

set -e

REPO_DIR=aws-codebuild-docker-images
CODEBUILD_EXEC_CONTAINER_IMAGE_TAG=aws/ubuntu-standard:6.0

# 「このスクリプトがある場所」まで移動
SCRIPT_DIR=$(cd $(dirname $(readlink -f $0 || echo $0));pwd -P)
cd ${SCRIPT_DIR}

# initialize
rm -rf ./${REPO_DIR}

# main

git clone https://github.com/aws/${REPO_DIR}.git

pushd ./${REPO_DIR}/ubuntu/standard/6.0

sed -ie 's/^ENTRYPOINT/#ENTRYPOINT/g' Dockerfile
docker build -t ${CODEBUILD_EXEC_CONTAINER_IMAGE_TAG} .

popd

docker pull amazon/aws-codebuild-local:latest --disable-content-trust=false

echo '----------------------------------------------------------'
echo '---- CloudBuild実行(最期はCtrl+Cで自力で止めるように) ----'
echo '----------------------------------------------------------'

docker run \
  -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/output:/output \
  -e "IMAGE_NAME=${CODEBUILD_EXEC_CONTAINER_IMAGE_TAG}" \
  -e "ARTIFACTS=/output" \
  -e "SOURCE=$(pwd)" \
  amazon/aws-codebuild-local
