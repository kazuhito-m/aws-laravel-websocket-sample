#!/bin/bash

# docker build --no-cache -t laravel-test:latest . \
docker build -t laravel-test:latest . \
&& docker run -p 80:80 --name la-test laravel-test:latest
 
docker rm -f la-test
docker rmi laravel-test:latest

