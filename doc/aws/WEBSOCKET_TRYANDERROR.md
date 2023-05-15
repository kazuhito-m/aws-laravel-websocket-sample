# WebSocketをAWSで作るための試行錯誤

## 予め集めた材料

- https://qiita.com/oiz-y/items/c773edb7fbbdb8660d96
- https://zenn.dev/mryhryki/articles/2020-12-01-aws-api-gateway-websocket
- https://www.ragate.co.jp/blog/articles/17797
- https://mihono-bourbon.com/aws-websocket/

## 初手、手習いでやること

[これ](https://qiita.com/G-awa/items/472bc1a9d46178f3d7a4) をベースに「手を動かして」やってみる。

### 後で削除せなあ管理ソース

ゴミ掃除しないと「保持してるだけでお金かかる」系なので、使ってるリソース(あとで消さなきゃならないリソース)をメモっとく。

- S3
- CloudFormation
- ApiGateway
- Lambdad
- DynamoDB

