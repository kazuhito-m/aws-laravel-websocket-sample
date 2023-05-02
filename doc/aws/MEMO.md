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

### RDS作成

- 前提
  - テスト用なので最小
  - セキュリティは「接続できる」ならゆるくてよい


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

- https://qiita.com/keitakn/items/4b2db95eae81044a779c

もう、完全に上のトレースで行った。(ので、やり方の詳細は上記記事を参照)
