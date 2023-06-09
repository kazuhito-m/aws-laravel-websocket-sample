#!/bin/bash

./container/rewrite_version.sh '0.0.9999'

echo '-------- docker build --------'
# docker build -t laravel-test:latest . \
docker build --no-cache -t laravel-test:latest .

git checkout ./version.php

echo '-------- docker run --------'
docker run -p 80:80 --name la-test \
    --env DB_CONNECTION='mysql' \
    --env DB_HOST='192.168.1.133' \
    --env DB_PORT='3306' \
    --env DB_DATABASE='laravel' \
    --env DB_USERNAME='root' \
    --env DB_PASSWORD='local-password' \
    --env TEST_VERBOSE='docker_runの環境変数に書くだけで上書き出来た。' \
    laravel-test:latest

#     --env TEST_VERBOSE='docker_runの環境変数に書くだけで上書き出来た。' \

docker rm -f la-test
docker rmi laravel-test:latest
