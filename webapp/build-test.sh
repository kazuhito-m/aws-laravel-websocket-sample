#!/bin/bash

set -e

./container/rewrite_version.sh '0.0.9999'

# docker build -t laravel-test:latest . \
docker build --no-cache -t laravel-test:latest .
docker run -p 80:80 --name la-test --env TEST_VERBOSE='docker runの環境変数に書くだけで上書き出来た。' laravel-test:latest

git checkout ./version.php

docker rm -f la-test
docker rmi laravel-test:latest

