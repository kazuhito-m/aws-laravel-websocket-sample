# Lambda & APIGatway扱う試行錯誤

## Lambdaのデプロイ形態

「ソース」「Zip」とまた別に、「Contaner」がある。

- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/typescript-image.html
- https://qiita.com/sasaco/items/b65ce36c05c50a74ac3e
- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/gettingstarted-images.html#configuration-images-update

## AWS SAM(Serverless Application Model)を使ってLambdaを管理する

LambdaとAPIGatewayを「生成からデプロイからテストからCIまで」すべて一式で賄うFW。

CloudFromationも内側で持ち「生成から管理してしまおう」というコンセプトである。

そのため、今回の「CDKで作った構成に、関数部分だけ入れ替える」という設計とは相容れなく、採用を見送った。

個人的には「やりたいことに対して、重たすぎるよなー」という印象。

- 手動等「別の手段」で作ったLambdaに後からSAM管理にする
- 複数LambdaをSAMで扱う
- LambdaのみをSAMで管理する(APIGatewayを外す)

は、「出来ないことは無いが、茨の道」のよう。

- https://sumito.jp/2020/01/05/%E6%89%8B%E5%8B%95%E3%81%A7%E4%BD%9C%E3%81%A3%E3%81%9F-lambda-%E3%82%92-code-%E3%81%A8%E3%81%97%E3%81%A6%E7%AE%A1%E7%90%86%E3%81%99%E3%82%8B/
- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html
- https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/what-is-sam.html

### 一つのSAMで複数のLambda関数を管理する

- https://qiita.com/charon/items/050942e54bbc5c9d44f1
- https://circleci.com/ja/blog/serverless-dynamic-config/

読んだけれど…ちょっと仕組みを解ってないし、実際にやろうとして出来なかった。

### SAMでLambda”のみ”を管理する

SAMは「LambdaとAPIGatewayを一括管理する」仕組み。

便利だからと「Lambdaだけを管理しようとする」と、かなりの細工が必要なよう。

- https://dev.classmethod.jp/articles/sam-deploy-lambda-alone/


## Lambdaをコンテナビルドしてデプロイする

- バイナリにVersionを付けてトレーサビリティを計りたい
- SAM等「ゴテゴテしたもの」でなく、シンプルな「TypeScriptのnpm管理プログラム」でありたい
- 「LambdaのCode管理版」の際に `node_modules` やライブラリ周りで、レイヤー使ったりとか頑張った考慮したくない

ということから、自分のニーズには「コンテナでデプロイ」がぴったりで、今回はコレを採用することとした。

- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/gettingstarted-images.html#configuration-images-update
- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/typescript-image.html

ひょっとしたら「初動が遅い」「一回のリクエストのオーバーヘッド」などのトレードオフがあるかもしれないが…。

## CDKで最初にLambdaを作る時「Dockerイメージをその場ビルドしよう」としても出来ない

CDKで「”その場Dockerfileビルド”でLambda関数作成」する場合、コンテナリポジトリが定まらないため、「CDK備え付けのデフォルトECR」にPushし、その後Lambdaに適用される。

CDKのLambda作成を実行した場合、時折以下のようなエラーメッセージが出て、えラーと成る。

```
Resource handler returned message: "Source image 000000000000.dkr.ecr.ap-northeast-1.amazonaws.com/cdk-hnb659fds-container-assets-000000000000-ap-northeast-1:xxxxxx does not exist. 
Provide a valid source image. ..."
```

原因を特定できないが、おそらくは…

- CDKが作る備え付けの「ユーザ一一人に対応するECR」を削除してしまっている
- 最初に `cdk bootstrap` した時と権限が変わってしまっている(のでECRに接続できない)

かと思われる。

対処としては、

- CloudFormationから `CDKToolkit` というスタックを削除する
  - その際、コケ場合はs3やECRに「関連するモノ」があるかを確認し削除する
- 再度 `cdk bootstrap` を行う

をした後、対象のCDKを実行すれば行ける…場合がある。

- https://qiita.com/wagasa2/items/882183e0360b76d79b5e

コケてるところが `DockerImageCode.fromImageAsset()` で、そこが目立つため「何かDockerfile等の設定がおかしいのではないか？」と思ってしまいガチだが、メッセージをちゃんと読みたい。

- https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-lambda.DockerImageCode.html
- https://dev.classmethod.jp/articles/cdk-bootstrap-modern-template/


## CDKでAPIGatawayにドメイン名を貼り付ける

- https://zenn.dev/tatsurom/articles/api-gateway-domain-mapping

上記のオペレーションをCDKで行う。

- https://nekoniki.com/20220517_aws-cdk-apigateway-custom-domain


## ApiGatewayと裏のLambdaから、WebSocketのApiGatewayを叩く

`ApiGatewayManagementApiClinet` クラスを使う

- https://github.com/aws/aws-sdk-js-v3/issues/999
- https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-apigatewaymanagementapi/#getting-started

## LambdaからDynamoDBを検索/更新する(v3)

- https://dev.classmethod.jp/articles/node-js-aws-sdk-v3/
- https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/GettingStarted.DeleteItem.html
- https://dev.classmethod.jp/articles/node-js-aws-sdk-v3/
- 