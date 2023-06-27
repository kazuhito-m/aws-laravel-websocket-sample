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

- [x] FageteとALBはどういう関係なのか
  - Fageteは「コンテナ実行バックエンド」なので、あまり関係ない
- [x] 同ドメインにALBとAPIGatewayは存在しうるのか
  - ALBとApiGatewayに別々のサブドメイン張ったら行ける
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

- https://repost.aws/ja/knowledge-center/api-gateway-vpc-connections
- https://rurukblog.com/post/aws-ecs-apigateway-403/
- https://qiita.com/GoogIeSensei/items/6227cb8213ffc5d78347
- https://bftnagoya.hateblo.jp/entry/2021/10/19/101744
- https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/http-api-private-integration.html

上記記事は「かなりピンポイント」かつ「あるある」のようなのだが、翻訳と抽象度が噛み合わないのが、いまいちよくわからない。

ここは「深い理解が必要になる」と思しきとこであるため、テキトーではだめなのだが…。

今回の取り組みでは、結論的に

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

### ECS内のコンテナから、PHPを使ってAPIGatewayを叩いた時、403 Forbiddenになる

前述の「PublicなEndPointが参照出来ない」の課題はすべて解決している前提。

ECS/Fargate内のPHPから

```php
$client = new ApiGatewayManagementApiClient(...);
$client->postToConnection([...]);
```

を実行した場合、PHP側のスタックトレースとして、

```
Error executing "PostToConnection" on "https://api.APIGATEWAY/@connections/FFFFFFFFFFFFFFFFFF";
AWS HTTP error:
  Client error: `POST https://api.APIGATEWAY/@connections/FFFFFFFFFFFFFFFFFF` resulted in a `403 Forbidden`
response: {
    "Message":
      "User: arn:aws:sts::000000000000:assumed-role/ecsTaskExecutionRole/00000000000000000000000000000000 is not au (truncated...)
  AccessDeniedException (client):
    User: arn:aws:sts::000000000000:assumed-role/ecsTaskExecutionRole/00000000000000000000000000000000
    is not authorized to perform:
    execute-api:ManageConnections on
      resource: arn:aws:execute-api:ap-northeast-1:********2314:999999999/Prod/POST/@connections/{connectionId}
        - {"Message":"User: arn:aws:sts::000000000000:assumed-role/ecsTaskExecutionRole/00000000000000000000000000000000 is not authorized
          to perform: execute-api:ManageConnections on resource:
            arn:aws:execute-api:ap-northeast-1:********2314:999999999/Prod/POST/@connections/{connectionId}"}
```

というエラーになる。

#### 解決

上記スタックトレースにも `ecsTaskExecutionRole` としてあるが、「ECSのコンテナのIAMに権限がなかった」のが原因。

更に言えば、一度APIGatewayを作り直したので「APIGatewayの固有の一つのリソースだけを許していた」設定では、新しいGatewayに追いついていなかった。

```yaml
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "execute-api:ManageConnections",
            "Resource": "arn:aws:execute-api:*:[Accountの固有ID]:*/*/*/*"
        }
    ]
}
```

と `*` で緩和した。(全部アスターでも良かったのかもしれないが…)

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

なお、

```bash
CLUSTER=[クラスタ名]
SERVICE=[サービス名]
TASK_ARN=[タスクARN]
CONTAINER_NAME=[コンテナ名]
```

しておくと、以下がスムーズになる。

- Session Manager plugin for the AWS CLIのインストール
  - https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
  - `curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"`
- コマンドで「現在のServiceの状態」を確認
  - `aws ecs describe-services --cluster ${CLUSTER} --services ${SERVICE} | grep enableExecuteCommand`
  - 最初、aws-cliのリージョンが正しくなかったので `Could not connect to the endpoint` だったが、ARNの中のリージョン名へ修正した
- 既存サービスへのenableExecuteCommandの有効化
  - `aws ecs update-service --cluster ${CLUSTER} --service ${SERVICE} --enable-execute-command`
- 実際に接続してコマンドうってみる
  - `aws ecs execute-command --cluster ${CLUSTER} --task ${TASK_ARN} --container ${CONTAINER_NAME} --interactive --command "/bin/sh"`
  - つながらないなー、と思ったら、以下も確認
    - `aws ecs list-tasks --cluster ${CLUSTER} --query "taskArns[]" --output text`
    - `aws ecs describe-tasks --cluster ${CLUSTER} --tasks ${TASK_ARN} --query "tasks[].containers[].name" --output text`
    - 権限を疑う: https://repost.aws/ja/knowledge-center/ecs-error-execute-command
- 入った先がAlpineなのでmysqlのクライアントを入れてつないで見る
  - `apk add --no-cache mysql-client`
  - `mysql --host=xxxx.rds.amazonaws.com --user=root --password`
  - 上記でつながればよし、稼働後はマイグレーションが効いてるかも確認出来る

### AWSでドメインを取得し、ALBでHTTPS接続出来るようにする

- https://swiswiswift.com/2022-03-01/

もう、完全に上のトレースで行った。(ので、やり方の詳細は上記記事を参照)

### Lambda(JavaScript指定)からMySQLのRDSにアクセスする

ものすごく「んなものん出来るやろ」くらいに考えてたが、AWSerの人らに言わせると「アンチパターン」と呼ばれるほどやっちゃいけないことらしかった。

シンプルには、

1. RDSをVPC外に出してLambdaと組む
0. VPC Lambdaを配置してRDSに接続する
0. RDS Proxyを使って外Lambdaから接続する

くらいしか無いらしいし、未だにハードルが高いようだ。

RDS Proxyは高いし、VPC Lambdaは「どうやって外からVPC内Lambdaにアクセスするのか」が、広大なインターネット上でも情報がなかった。
(VPCLambdaからInternetにでていく話は食傷気味なくらい溢れていた)

- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-vpc.html
- https://repost.aws/ja/knowledge-center/connect-lambda-to-an-rds-instance
- https://qiita.com/miyuki_samitani/items/6130f8716b4fb57d0c95
- https://qiita.com/sugimount-a/items/7dc388c83bcbc3f6ffbd#lambda-function-%E3%82%92%E4%BD%9C%E6%88%90
- https://tech.ilovex.co.jp/tech-blog/article-1
- https://zenn.dev/shimi7o/articles/79fb5cb2175a6c
- https://zenn.dev/nekoniki/articles/2318df67b6a02f

以下は「VPCLambdaから外へ出るには」祭り

- https://repost.aws/ja/knowledge-center/internet-access-lambda-function


#### 単純な「JavaScriptからMySQLにアクセスする」方法

- https://qiita.com/tatsuya1970/items/261c7e9cf3e87b8db55f
- https://qiita.com/na0AaooQ/items/ff9ab6ce9831236b3ea6
- https://stackoverflow.com/questions/39298778/mysql-inserts-with-aws-lambda-node-js

### Lambdaを途中からVPCに参加させる

「RDSにつながる前にタイムアウトしているが、アクセスできてないんじゃないか？」疑惑があったので、途中からVPCに参加させることにした。

- https://dev.classmethod.jp/articles/tsnote-lambda-the-provided-execution-role-does-not-have-permissions-to-call-createnetworkinterface-on-ec2/
- https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-vpc.html

#### その他の参照

- https://swiswiswift.com/2022-03-01/


## ローカルでLambdaやS3などを動かす(テスト時のMock)

- https://qiita.com/bilzard/items/22d2457f3d6386d21796

### AWSにおけるタグ、ID、環境変数等の命名則

- https://dev.classmethod.jp/articles/aws-tagging-basic/

### Route53でゾーンを作り直すとDNS応答も証明書もぐちゃくちゃなる

- https://dev.classmethod.jp/articles/cname_rrset_error/

いつまでも、

1. DNSが名前解決をするようにならない(浸透(って言ったらだめなんだな)しない)
2. 名前解決できないので、証明書がいつまでも「ステータス: 保留中の検証」のまま

おそらくは、SOAレコードのTTLが「172800=48時間」なので、「前に消したやつ」が居座ってるんだろうなーと。

そのせいで、それを使おうとしているCDKもコケる。

- https://qiita.com/mziyut/items/b48933b9114a0250bfab
