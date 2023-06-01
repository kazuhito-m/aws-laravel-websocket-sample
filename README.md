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

## Instration

大きくは、インフラの構築作業が2つ、アプリケーションのデプロイ1つの、3つの作業を行う。

1. AWSにGlobal(全体)に掛かる構成を構築
0. AWSにStage(環境ごと)に掛かる構成を構築
0. アプリケーションをビルド・デプロイ

作業は以下を前提とする。

- Node.js/npm は最新がインストールされている
- 以下の作業はbashかつ開発リポジトリフォルダの直下から開始する
- 「このシステムのドメイン」をAWSのRoute53で購入している

## AWSにGlobal(全体)に掛かる構成を構築

1. `./aws-infra/global/cdk.json` の末尾、`grobal` , `stages` の情報を「自身が作りたいシステムの情報」に書き換える
0. 「WebHookを登録出来る権限を持ったGitHubのAccessToken」を、AWSのSystemManergerのパラメータストアに `alws-github-access-token` という名前で登録
0. コンソールから `cd ./aws-infra/global && npm run deploy` を実行
0. 作成されたAWSの構成から、AWSのSystemManergerのパラメータストアに、以下の値を登録
   1. `alws-certification-arn` : Certificate Managerから作成された証明書のARN
   0. `alws-hostedzone-id` : Route53から作成されたホストゾーンのゾーンID

## AWSにStage(環境ごと)に掛かる構成を構築

1. `./aws-infra/stage-of/cdk.json` の末尾、`grobal` , `stages` の情報を「自身が作りたいシステムの情報」に書き換え
0. コンソールから `cd ./aws-infra/stage-of && npm run deploy` を実行
0. 成功を確認した後、`./aws-infra/stage-of/cdk.json` の `context.stages.production.siteFqdn` にあるアドレスをブラウザで確認(テスト用にnginxの画面が出る)

## アプリケーションをビルド・デプロイ

1. `git tag 0.0.1 && git push --tag` を実行し、gitのtagを作成・GitHubに登録
0. AWSのElastic Container Registry(ECR)の `alws-app` にイメージが登録されていることを確認
0. `git tag -a 0.0.1 production -m 'first release.' && git push --tag` を実行し、gitのtagを作成・GitHubに登録
0. `./aws-infra/stage-of/cdk.json` の `context.stages.production.siteFqdn` にあるアドレスをブラウザで確認(このリポジトリのアプリのログイン画面が出る)

## Author

Kazuhito Miura ( [@kazuhito_m](https://twitter.com/kazuhito_m "kazuhito_m on Twitter") )
