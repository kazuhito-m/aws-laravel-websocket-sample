# AWS S3で「アップロード用のBucket」を作る、またそれをLaravelから使うことの試行錯誤

## 手動での「バケット」の作成

- https://it-web-life.com/aws_s3_how_to_bucket_all_public/


## CDKでの「バケット」の作成

- https://zenn.dev/zgw426/articles/0afa4156e92391


## S3で「ダウンはPublic公開」したい時の権限について

- https://docs.aws.amazon.com/ja_jp/IAM/latest/UserGuide/reference_policies_examples_s3_rw-bucket.html

作ることはできるのだが…「AWSのコンソール上で警告でまくる」ので、最適な設定があるのか探りたい。

- CDKで上記の記事のようなPlicyを追加すると「同じようなのが二個」ある状態に
  - 他のフラグ設定によって「全公開」となったら、勝手にデフォルトのPolicyがそれになる…のかな？


## 番外:ローカルで使える「S3互換サーバ」であるMinIOの情報

- https://min.io/docs/minio/linux/reference/minio-server/minio-server.html#minio-server-environment-variables

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