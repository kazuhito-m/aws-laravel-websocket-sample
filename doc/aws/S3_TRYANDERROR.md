# AWS S3で「アップロード用のBucket」を作る、またそれをLaravelから使うことの試行錯誤

## 手動での「バケット」の作成

- https://it-web-life.com/aws_s3_how_to_bucket_all_public/


## CDKでの「バケット」の作成

- https://zenn.dev/zgw426/articles/0afa4156e92391


## S3で「ダウンはPublic公開」したい時の権限について

- https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/reference_policies_examples_s3_rw-bucket.html
- https://it-web-life.com/aws_s3_how_to_bucket_all_public/
- https://dev.classmethod.jp/articles/s3-block-public-access/

作ることはできるのだが…「AWSのコンソール上で警告でまくる」ので、最適な設定があるのか探りたい。

- CDKで上記の記事のようなPlicyを追加すると「同じようなのが二個」ある状態に
  - 他のフラグ設定によって「全公開」となったら、勝手にデフォルトのPolicyがそれになる…のかな？

### 「S3はクローズド、CloudFrontで公開する」という定石

Tiwtter等で聞いた話では、そんな感じだった。

- https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/WebsiteAccessPermissionsReqd.html
- https://blog.ch3cooh.jp/entry/2022/06/03/145050#:~:text=S3%E3%81%A8CloudFront%E3%81%AE%E3%83%87%E3%83%BC%E3%82%BF%E8%BB%A2%E9%80%81%E6%96%99%E9%87%91&text=%E9%A0%AD%E3%81%AE%E4%B8%AD%E3%81%A7%E3%81%AF%E3%81%BC%E3%82%93%E3%82%84%E3%82%8A,%E5%90%8C%E3%81%98%E4%BE%A1%E6%A0%BC%E3%81%A7%E3%81%82%E3%81%A3%E3%81%9F%E3%80%82
- https://tech.nri-net.com/entry/aws_cdk_cross_region_stack_deployment_acm


### CDKにCloudFrontで「カスタムドメイン」を貼り付ける設定

- https://dev.classmethod.jp/articles/i-tried-building-cloudfronts3-static-site-hosting-with-aws-cdk-v2/
- https://tech.nri-net.com/entry/aws_cdk_cross_region_stack_deployment_acm

## 番外:ローカルで使える「S3互換サーバ」であるMinIOの情報

- https://min.io/docs/minio/linux/reference/minio-server/minio-server.html#minio-server-environment-variables
- https://qiita.com/reflet/items/44faf217efd66d83c4a7
- https://go-tech.blog/aws/s3-minio/

### Docker化して使う場合の勘所

- https://dev.classmethod.jp/articles/minio-docker-compose/
- https://www.ritolab.com/posts/232
- https://qiita.com/reflet/items/3e0f07bc9d64314515c1
- https://hub.docker.com/r/bitnami/minio/
- https://hub.docker.com/r/minio/minio/

ハマり点がいくつかあったので、メモっとく。

- 記事には割と古い情報が多い
  - なので、DockerhubとかGitHubとか「本家」を確認するのが固い
- DockerHubにはbitnamiとminioという2つのイメージが有名
  - が「BitNamiのが多く使われてる」ので主流？
  - なんとなく、minioは本家なのに「イメージめんてさがされてない」気が…
    - 本家がminioじゃなくなんか別の(名前失念)へと移管されたのかな？
- bitnamiの方は、データのフォルダをローカルにマウントすると起動がコケる
  - どうも「権限周り」でなんかコケるみたい
  - 指定しなければ動き、かつ「アップロードファイルはGUIの管理コンソールで観れる」と解ったので、マウントにこだわらず指定をヤメた
- 環境変数は「Dockerのもの」ではなく「MinIO本体」で定義されているもの
- 昔の「Accessキー」「Secretキー」の環境変数は、現在非推奨
  - 最新のものでは、管理画面のパスワードである `MINIO_ROOT_USER` , `MINIO_ROOT_PASSWORD` が、それぞれAccessキー、Secretキーと対応しており、それで外側からはアクセス出来る

### Laravelとの絡み

- https://zenn.dev/nicopin/articles/e92eb4bc99cc4a
