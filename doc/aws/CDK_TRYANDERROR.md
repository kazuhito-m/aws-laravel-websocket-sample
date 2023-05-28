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
