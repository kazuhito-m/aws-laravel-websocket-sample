# AWS関連のメモ

## 「AWSでコンテナを扱うこと」の事前知識

- https://xn--o9j8h1c9hb5756dt0ua226amc1a.com/?p=2025
- https://www.skyarch.net/blog/aws-fargate%E3%82%92%E5%88%A9%E7%94%A8%E3%81%97%E3%81%9F%E3%82%A4%E3%83%B3%E3%83%95%E3%83%A9%E6%A7%8B%E7%AF%89%E9%81%8B%E7%94%A8%E3%83%91%E3%82%BF%E3%83%BC%E3%83%B3/
- https://dev.icare.jpn.com/dev_cat/fargate/
- https://qiita.com/hirai-11/items/241df305a90af3ccf973

### その他「AWS一般」での事前知識

- https://tech.kurojica.com/archives/40122/
  - 今回のインフラの要件で「RDSのマルチAZ」なんて要るのだろうか？

## 上記を読んで「大まかに決めた」こと

- ECS + Fagete で行く

### 構成の検討

以下の構成をお手本に、削るなり、足すなりしていきたい。

![模範的構成とされていたもの](https://www.skyarch.net/blog/wp-content/uploads/2019/04/fargate.png)

---

## 調べるTodo

以下、「調べて明確になった」ら、チェック付け、上のパートに記事化すること。

- [ ] FageteとALBはどういう関係なのか
- [ ] 同ドメインにALBとAPIGatewayは存在しうるのか
- [ ] テスト用に「LaravelをDockerfile一個に乗せる」をやってるが、Farget用の最適な設計はソレなのか
- [ ] オートスケーリングの検証(ちゃんと働くか、条件はなにか)
- [ ] オートスケーリングの最適性の設計(キャパプラからナンボがええのか)

---

## 実際にやってみるトライアル

以下のチュートリアル記事を参考に、一回デプロイ・起動してみる。

- https://prograshi.com/platform/aws/how-to-set-task-definition/
- https://chigusa-web.com/blog/amazon-ecs%E3%81%A7fargate/
- https://zenn.dev/knaka0209/articles/5bca67ea65ba20
- https://dev.classmethod.jp/articles/add-alb-to-existing-ecs-fargate/

### ECS+Fagateでコンテナ動かしてみる

1. 昔作ったTerraformのファイルを元にVPCを作る
0. Amazon Elastic Container Service画面から「クラスター作成」を行う
  - VPCを上で作ったものを使う、以外はほぼデフォ
  - デフォなので、無論Fagete指定
0. ECRを作成
0. ECRへローカルからイメージをプッシュ 
  - aws-cli が必要だったので `sudo apt  install awscli` という雑いことする
0. ECSの左メニューから「タスク定義」をクリック、作成
0. ECSクラスタに「サービス」を作成 
  - 最低タスク数を2にしてみる
0. デプロイする

## ECS周りのトラブルシュート

### ECSのコンテナを外から接続出来ない

ALBまで組みきって「接続できない」ってなった。

せめて「LBかまさなくても、外からアクセスできる」テストはしたい。

- https://qiita.com/NaokiIshimura/items/cc478096630a60c1e1b9
- https://qiita.com/oiz-y/items/532fe4c22bfc790a134c
- https://dev.classmethod.jp/articles/ecs-fargate-entry/

#### 試行したメモ

- ALB&AutoScalingの組み合わせでServiceを作ると到達できず
- なんとなくSecurityGroupが怪しそうなので、かってに　作ってくれるものではなく、自力のものを指定する
- 上記SecurityGroup+ALBのみ、でService作ると、ALBのみ追加であればそのURLでアプリがみれた！
- その後、SecurityGroup+ALB+AutoScalingでService作っても、ALBのURLでアプリがみれた！

---

- https://qiita.com/suzuki0430/items/6e4e7f513f982dadbf09


### AWS-SDK for PHPを使ったPHPアプリからWebSocket用APIGatewayに接続するとStatus:410 Goneのエラー

HTTPStatus410:Goneは [そのリソースが移動等で永久に見れなくなった](https://blog.halpas.com/archives/12440) 場合のステータス。

とは言え、AWS的には「そんな意味ででる」のではなく、かつこのトラブル「複合要因がカラム」ため、大変難しかった。

#### 今まで「WebSocketAPIGatewayと接続してきた実績」と違う言語のAWS-SDKでやろうとしている

基本的に、`AWS-SDK` は…

- 各言語ごとに用意されているが、インターフェイスは「ほぼ同じ」となるようにしてある
- SDKはCLI & AWS操作用WebAPIのカタチと「ほぼ同じ」となるようにしてある

という原則で作られているようなので、基本「LambdaniteJSで書いたものを、PHPでかきなおしゃ良かろう」と思ていた。

の、だが…

1. 疎通通して「成功している」と認識しているのは、JavaScript用のSDKな上、SDK Ver.2である
0. Laravelアプリに組み込もうとしているのは、PHP用のSDK上かつSDK Ver.3である
0. JavaScript用とPHP用のVer.2のSDKの仕様がだいぶ違う(ないクラスがある)

という状況であった。

具体的には

1. JavaScriptのVer.2はWebSocketを `ApiGatewayManagementApi` というクラスで扱う
    - 生成にはEndPointとApiVersionがあれば良い
    - EndPointは「プロトコル部分を取ったURL」を指定する(少なくとも世のサンプルと成功例は)
0. PHPのVer.2はWebSocketを `ApiGatewayManagementApiClient` というクラスで扱う
    - 生成にはEndPointとApiVersion(vedrsionという名前)とRegionが必要
    - EndPointは「HTTPS始まりのプロトコルを持ったURL」を指定する

という差異があり、それに気付くまでにめちゃくちゃ掛かった

- x

#### aws-sdk Ver.3 のWebSocketAPIGatawayの扱いに関してはつい最近までバグがあったらしい

2021年中盤あたりまで「正しく書いてもエンドポイントのステージ部分がおかしくなってつながらない」というバグがあったらしい。

- https://github.com/aws/aws-sdk-js-v3/issues/2124
- https://github.com/aws/aws-sdk-js-v3/issues/1830

これにより「Ver.3はWebSocketをサポートしてないから、使いたかったらVer.2使おうね」な風潮になっていたみたい。

また、治った今は

- EndPointはhttps等プロトコル付き"でなけれいけない"

という仕様となったようで、2の時の知識を持ってたらハマる感じに。

(JavaScriptのサンプルがそればっかりなのも頷ける)

#### 基本的にVCP内のEC2/ECSコンテナ等からAPIGatewayの「Publicなエンドポイント」は参照出来ない

これがつながらなかった一番の理由、と思われる。

- x

上記記事は「かなりピンポイント」かつ「あるある」のようなのだが、翻訳と抽象度が噛み合わないのが、いまいちよくわからない。

結果的には

- カスタムドメイン名をAPIGatewayにはっつける

ことで、解決したのだが…IAMや諸事情、また上記のVerから来る「HTTPS要る要らない問題」も相まって

- HTTPSありなし
- 通常EndPointかカスタムドメイン名か

の2x2=4通りの組み合わせを常時試し続けるというものすごくしんどいトラブルシュートと成った。

### Lambda -> API Gateway(WebSocket用)に接続しようと思うとStatus:500エラー

CloudFormationを使って、APIGateway(WebSocket用)もLambadもすべて作り直した際、今まで接続出来ていたLambdaが接続できなくなった。

`Containar -> (POSTでふつーのREST)APIGateway -> Lambda -> (WebSocket用の)APIAGateway -> HTML等Client`

の、真ん中のLambdaからWebSocket用のAPIGatewayにつながらない。

APIGatewayにはカスタムドメイン名を付けていたし、張替え直しても行ける…と思っていたが、そうもかず…。

1時間くらいこれにハマっていた。

#### 解決

- https://qiita.com/hiroga/items/71a7c03035ae53036861#the-client-is-not-authorized-to-perform-this-operation
- https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/security_iam_troubleshoot.html#security_iam_troubleshoot-no-permissions

ここに書いてあるとおりなのだが…「ドンピシャ"個々直せば良い"ではない」ので、どこのことを指しているのかわからない。

```
PI Gateway自体のリソースポリシーで、指定したオペレーション（＝特定のエンドポイントへのリクエスト）が
制限されています。
API Gatewayのリソースポリシー（sam拡張のCFnテンプレートの場合はx-amazon-apigateway-policy）を確認し、
目的のResource（＝エンドポイント）への　execute-api:Invoke がAllow担っていることを確認しましょう。
```

そう「Lambdaの権限に特定のリソース(=特定のAPIGateway)のアクセス権をつけよ」ということ。

そんな「リソース一つを指定した権限緩和」をした記憶はなかったんだが…一つのポリシーに

```yml
{
    "Statement": [
        {
            "Action": "execute-api:ManageConnections",
            "Resource": "arn:aws:execute-api:ap-northeast-1:[固有番号]:[Gatewayの識別子っぽいの]/*",
            "Effect": "Allow"
        }
    ]
}
```

という記述があった。

Resourceの値を `"*"` に変えるとあっさりとアクセスできた。

### LambdaをJavaScriptを使う場合package.jsonのライブラリを持ってってくれない

他人様のCloudFormationを借りてLambdaを作成した時にはライブラリを持ってってくれるのに、

- 自力でpackage.jsonをAWSのUI上で作成・記載した場合
- CloudFormationで作ったものも、自力でpackage.jsonに依存を増やした場合

に、 `node_modules` の内容を持っていってくれない件について。

`node_modules` ごとJSファイル群をZIPで固めてアップすれば行けるのだが「大きいZIPの場合AWSのUIエディターで編集できなくなる」ので、動いてるものが見れなくなって辛い。

別の話、「ライブラリを上げておける」という「Lambdaレイヤー」というものがある。

`node_modules` のフォルダをZIPであげ、それをLambda側で設定したのだが、状況が変わらない。

できればこの「Lambdaレイヤー」で解決したいのだが…。

#### 解決

- https://zenn.dev/mn87/articles/c421ebaea55f8b
- https://qiita.com/hirorin/items/dba5ef8fcf570ac3a9e4

JavaScriptの場合「 `nodejs/` というフォルダをZipのトップにカマス」必要があるようである。

その形でZipに固めると、正しくライブラリを認識していた。


### RDS作成

- 前提
  - テスト用なので最小
  - セキュリティは「接続できる」ならゆるくてよい

### 接続まわり

- https://qiita.com/kuromame1020611/items/8a19ae734f2925b42b20

### ECSのコンテナ内にコンソールで入る

DBへの接続テストが非常にやりやすそうなので、「コンテナに入れるようにして」おく。

ほぼ [このとおり](https://blog.serverworks.co.jp/ecs-exec) にする。ので、ざっくりと書く。

- Session Manager plugin for the AWS CLIのインストール
  - https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
  - `curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"`
- コマンドで「現在のServiceの状態」を確認
  - `aws ecs describe-services --cluster EcscCurrent --services LaravelWebAppService17 | grep enableExecuteCommand`
  - 最初、aws-cliのリージョンが正しくなかったので `Could not connect to the endpoint` だったが、ARNの中のリージョン名へ修正した
- 既存サービスへのenableExecuteCommandの有効化
  - `aws ecs update-service --cluster x --service y --enable-execute-command`
- 実際に接続してコマンドうってみる
  - `aws ecs execute-command --cluster ecs-exec-test --task タスクARN --container コンテナ名 --interactive --command "/bin/sh"`
- 入った先がAlpineなのでmysqlのクライアントを入れてつないで見る
  - `apk add --no-cache mysql-client`
  - `mysql --host=xxxx.rds.amazonaws.com --user=root --password`
  - 上記でつながればよし、稼働後はマイグレーションが効いてるかも確認出来る

### AWSでドメインを取得し、ALBでHTTPS接続出来るようにする

- https://swiswiswift.com/2022-03-01/

もう、完全に上のトレースで行った。(ので、やり方の詳細は上記記事を参照)

### LambdaからMySQLのRDSにアクセスする

- https://www.geekfeed.co.jp/geekblog/lambda_vpct status
- https://qiita.com/tatsuya1970/items/261c7e9cf3e87b8db55f

#### その他の参照

- https://swiswiswift.com/2022-03-01/

