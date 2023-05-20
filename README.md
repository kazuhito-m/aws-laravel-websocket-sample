AWS Laravel WebSocket Sample
=====

## What's this ?

タイトルにある組み合わせでアプリケーションを作るサンプル。

## Deploid Service

XXX

## Prerequisite

- PHP
- Laravel
- WebSocket
- AWS API Gateway
- AWS Lambda
- AWS DynamoDB

## How to use (for Application Users)

1. ログインする前に http:/[server]/register でユーザを作成する
0. すぐログアウトし、再び  http://[server]/register で二人目のユーザを作成する
0. 1つ目のブラウザで http://[server]/dashboard から、「メッセージ通知画面(receive)」を開く
0. 2つ目のブラウザ(あるいはプライベートモード、あるいはスマホ等)で、別ユーザでログインし、「メッセージ送信画面(send)」を開く
0. 「Send」画面から、1つ目のブラウザでログインしてるユーザにメッセージを送信する
0. 1つ目のブラウザで「飛んでくる」のを確認する

## Author

Kazuhito Miura ( [@kazuhito_m](https://twitter.com/kazuhito_m "kazuhito_m on Twitter") )
