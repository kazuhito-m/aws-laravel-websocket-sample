# AWS ECSでデプロイ等自動化するための試行錯誤

## 予め集めた材料

- https://blog.serverworks.co.jp/cicd-ecs-build-deploy-flow
- https://qiita.com/14kw/items/886848541fdf206e0d50

## コンテナイメージを「git tagを切ったらECRに乗る」にしたい

- https://blog.serverworks.co.jp/cicd-ecs-build-deploy-files
- https://poota.net/archives/541

ここらへんをやって「ｼｭｯと」やろうと思ったのだが…。

### CodeBuildとGitHubをつなぐ(TagPush等を取る)をしようとしてドハマり

複数の問題&トライアンドエラーを強いられたので、泣きそうになってる。

#### シンプルに「GitHub側のAccessTokenでAWS側からCodeBuildでアクセスさせる」がめちゃくちゃわかりにくい

- GUIのオペレーションを「そのままやる」ことを、CDKで出来ない…
- 結局「ソースの部分にCredenTialをはめる」とかでなく、 `new codebuild.GitHubSourceCredentials()` を「Stackの中で一度だけする」と、勝手に権限が得られる、ということ
  - ルートユーザに対し、CloudBuild中「一つCredentialが在ればよい」で、かつ唯一でなければならない、みたいな感じ
- その情報も集めにくかったが…
  - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.GitHubSourceCredentialsProps.html
  - https://stackoverflow.com/questions/51404727/getting-git-repository-url-with-nodegit


#### どうやら「git-tagに正規表現をかけて…」というのは「WebHookでしか出来ない」みたいだ

- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.FilterGroup.html
  - andTagIs() の引数に正規表現を使う
  - が「前に文字列がある」らしく、`^` や `$` は使わないほうが無難なよう

#### GitHubのトークンに「GitHubのWebHookを作り出す権限」がなくてCDK自体がエラー

- https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#personal-access-token%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6

結局「最大権限のトークン」を作って疎通を通す。 (未解決)


#### ECRにログイン出来ない

- https://zenn.dev/mn87/articles/9d87931fc1a24b
  - aws-cliが新しくなると、使えるコマンドが変わるみたいだ
- つまり「参照した記事が古くてミス」ということ

#### ECRにPushのする時に「権限が足りない」

- https://exanubes.com/blog/ci-cd-pipeline-for-ecs-application
  - CodeBuildの「作成したProject」のPolicyに権限が無いようだ
  - 直後に与えることによって出来た

## CDKでECS/Fargeteを作成する

- https://zenn.dev/akira_abe/articles/20220220-aws-cdk-fargate
- https://dev.classmethod.jp/articles/ecs-deploy-using-cdk/

### CDKでオートスケーリングを設定する

- https://dev.classmethod.jp/articles/fargate-with-autoscaling-using-cdk/

### CDKかつECSかつロードバランサーを仕込む

- https://tech.excite.co.jp/entry/2022/10/21/105138
  - TargetGroupについては、ちょっと「どこから取って良いか」が解らなかった
  - 試行錯誤の結果は、本ソースから参照されたし
- https://dev.classmethod.jp/articles/alb-vpc-lambda-sample-cdk/
  - これはLambdaの例だが、ALB周りの知識として

## デプロイ方法が「JSON取って書き換えて投げ込む」で良いのか？

あるところから持ってきたやり方が「たまたま上手く行った」ので、探求していなかった。

このやりかたは本当に「正しい」くて「一般的」なのか…わからないので情報を集める。

- https://nulab.com/ja/blog/nulab/git-team-ecs-deploy/


## ECSのクラスタ内で、コンテナを使ったスケジュールタスクを動かす

「EventBridge&ECSTask vs ECS Scheduled Task vs Step Functions」という記事が散見されるくらい「いくつかの手段がある」よう。

自分は、今回は

- https://dev.classmethod.jp/articles/amazon-eventbridge-scheduler-ecs-stop-start/
- https://qiita.com/ynstkt/items/73946f467a6d234122d9#ecs
- https://qiita.com/wrshige/items/9abc7170e8c1607f181f
- https://developers.bookwalker.jp/entry/2022/07/29/110000
- https://www.ritolab.com/posts/222#ecs-%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%AE%E3%82%B9%E3%82%B1%E3%82%B8%E3%83%A5%E3%83%BC%E3%83%AA%E3%83%B3%E3%82%B0
- https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/userguide/scheduled_tasks.html

### ふつーにサンプルを漁っていると、UIで操作できる「コマンドの上書き」が出来ない

UIだとECSのClusterから「スケジュールされたタスク」というところから「作成」で出来る「ECS Scheduled Task」。

名前が「そのままそれ用」のクラスであるところの `ScheduledFargateTask` を使うと「UIで出来る”コマンドの上書き”が出来るインターフェイスが無い」ので「コンテナを使いまわしてバッチに…」みたいなことができなくなる。

`Rule` クラスを使って、自力で全部組み立てると「UIでやることと一緒のことが出来る」ので、注意されたし。

- https://qiita.com/akihiko_sugiyama/items/bc1628230e7ac58e09d1
- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ScheduledFargateTask.html
- https://zenn.dev/ishiki/articles/4fa83676169b14914e17

## トラブルシュート:ECSからDynamoDBにアクセスするのに、IAMだけでよく、SecretKeyは要らない

ローカルでテストするために、php+AWS-SDK+DynamoDBClientを使い「AccessKey/SecretKey」でアクセスしていた。

が「Credentialsを指定しなくても、

- ローカル: AWS-CLIの資格情報を使ってアクセスする
- ECS: コンテナのIAM-Roleを使ってアクセスする

ので、双方ともに必要ない、ということが解った。

(なお、実装は「AccessKey/SecretKeyを指定しなければ、Credentialsをくっつけない」という実装にしておいた。)

- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/using-identity-based-policies.html
- https://repost.aws/ja/knowledge-center/dynamodb-access-denied-exception
- https://stackoverflow.com/questions/65115003/aws-cdk-grant-lambda-dynamodb-fullaccess

## トラブルシュート:ECS中のコンテナの”実行時の”ロールはTaskRoleである

- ExecutionRole:コンテナ 起動のためのロール
- TaskRole: コンテナ実行中のロール

だが、逆だと勘違いしていた。

- https://qiita.com/tmiki/items/25473b8975f8a1095c0a
