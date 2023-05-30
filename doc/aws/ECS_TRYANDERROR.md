# AWS ECSでデプロイ等自動化するための試行錯誤

## 予め集めた材料

- https://blog.serverworks.co.jp/cicd-ecs-build-deploy-flow

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

## コンテナデプロイの仕組みを考える

- x

## CDKでECS/Fargeteを作成する

- https://zenn.dev/akira_abe/articles/20220220-aws-cdk-fargate

