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

## x

