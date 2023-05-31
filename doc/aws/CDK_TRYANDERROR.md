# AWS CDKで本プログラムの構成を作るための試行錯誤

## 予め集めた材料

- https://dev.classmethod.jp/articles/aws-cdk-command-line-interface/

## 初手、手習いでやること

[これ](https://catalog.workshops.aws/typescript-and-cdk-for-beginner/ja-JP) をベースに「手を動かして」やってみる。

- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
  - 基本、これを使って「何がやれるか」「どう描くのか」を調べ持って勧める。

### 後で削除せなあ管理ソース

ゴミ掃除しないと「保持してるだけでお金かかる」系なので、使ってるリソース(あとで消さなきゃならないリソース)をメモっとく。

- CloudFormation
- SNS
- SQS
- EC2
- RDS

## DNS(Route53)を作る

材料。

- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53-readme.html
- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_route53.CnameRecord.html
- https://zenn.dev/rentio/articles/import-route53-resources-with-cdk
- https://mitchellgritts.com/snippets/aws-cdk-route53-cname-record
- https://gist.github.com/suz-lab/7d8774bf97a60057f09a
- https://dev.classmethod.jp/articles/cloudformation-resources-with-route-53/

## package.jsonを共有した、Stackを２つ以上作る

環境の種類(production,stagingなど)で別れるもの以外で、「AWSアカウントに対して一つ」のものがある。例:

- ECR
- Route53のZone(サービスのドメイン名のもののみ、PriveteDNSは環境毎)
- CodeBuild,CodePipeline

環境毎のものと、AWSに対して一つのものを、Stack的に分けたい。

しかし、ルートであるフォルダやpackage.jsonは共有したい。

そこで「TopからCDKコマンドで叩けるStackを２つ作る」「コマンドで呼び分けることが可能」という状態を作
りたい。

- https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/stack_how_to_create_multiple_stacks.html

## 環境種ごとにスタックを作る

- https://zenn.dev/chatii/articles/9486b3150849bb
- https://qiita.com/motchi0214/items/eb0f93131fdfb64e0378

## CDK自体をCD(CodeBuild)で実行する

`stage` (production,stageingなど)は「自動適用」であってもいいかな？と構想している。

- https://chariosan.com/2021/09/18/githubactions_codebuild_cdkdeploy/
- x


## Stackに環境変数を設定し、その下のすべてのリソースに伝播する

- https://dev.classmethod.jp/articles/aws_cdk_add_common_tag/

## ネットワーク周り(VPC,subnet,securitygroup等)を定義する

- https://dev.classmethod.jp/articles/aws-cdk-vpc-subnet-ec2/

前提として「手動(もしくはオプション少なめでCDK実行)した場合のデフォルト」を知っておく

- https://qiita.com/tkj06/items/3ee317b548fad49c6e6d#:~:text=%E5%90%84%E3%82%A2%E3%83%99%E3%82%A4%E3%83%A9%E3%83%93%E3%83%AA%E3%83%86%E3%82%A3%E3%82%BE%E3%83%BC%E3%83%B3%E3%81%AE%E3%82%B5%E3%83%96%E3%83%8D%E3%83%83%E3%83%88,%E3%81%AF%E3%83%91%E3%83%96%E3%83%AA%E3%83%83%E3%82%AF%E3%82%B5%E3%83%96%E3%83%8D%E3%83%83%E3%83%88%E3%81%AB%E3%81%AA%E3%82%8B%E3%80%82

## テストを書く

- https://techblog.styleedge.co.jp/entry/2022/07/19/163825


## CDKでLogGroup周りを追加する

- https://zenn.dev/krabben16/articles/send-fargate-container-metrics-to-dd-with-cdk-ts
- https://dev.classmethod.jp/articles/ecs-deploy-using-cdk/

## リソースに付いたIAMPolicy(その場下書き)を仕込む

- https://zenn.dev/hkdord/articles/process-of-writing-cdk
