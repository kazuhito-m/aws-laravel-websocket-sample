#!/bin/bash

set -e

./container/rewrite_version.sh '0.0.9999'

exit 0

# docker build -t laravel-test:latest . \
docker build --no-cache -t laravel-test:latest .
docker run -p 80:80 --name la-test laravel-test:latest
 
docker rm -f la-test
docker rmi laravel-test:latest

