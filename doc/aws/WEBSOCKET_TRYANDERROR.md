# WebSocketをAWSで作るための試行錯誤

## 予め集めた材料

- https://qiita.com/oiz-y/items/c773edb7fbbdb8660d96
- https://zenn.dev/mryhryki/articles/2020-12-01-aws-api-gateway-websocket
- https://www.ragate.co.jp/blog/articles/17797
- https://mihono-bourbon.com/aws-websocket/
- https://qiita.com/miyuki_samitani/items/f01f1bd49334f97fe84c

## 初手、手習いでやること

[これ](https://qiita.com/G-awa/items/472bc1a9d46178f3d7a4) をベースに「手を動かして」やってみる。

### 後で削除せなあ管理ソース

ゴミ掃除しないと「保持してるだけでお金かかる」系なので、使ってるリソース(あとで消さなきゃならないリソース)をメモっとく。

- S3
- CloudFormation
- ApiGateway
- Lambdad
- DynamoDB

## クライアント側からの接続状態管理・リトライについて

色々読んでみたが「ちゃんと動かない」らしい。

Node.jsのライブラリを使えばマシみたいなのだが…クライアントはバニラで実装したいし、迷う。

- https://developer.mozilla.org/ja/docs/Web/API/WebSocket/readyState
- https://qiita.com/bagooon/items/d59b36eae1d938fb3549
- https://www.npmjs.com/package/reconnecting-websocket
- https://www.1ft-seabass.jp/memo/2021/02/22/nodejs-websocket-client-reconnect/
- https://www.sophia-it.com/javascript-api/reference/%E3%82%AF%E3%83%A9%E3%82%A4%E3%82%A2%E3%83%B3%E3%83%88%E5%81%B4%E3%81%A7%E6%8E%A5%E7%B6%9A%E3%81%AE%E5%88%87%E6%96%AD%E3%82%92%E5%87%A6%E7%90%86%E3%81%99%E3%82%8B%E3%81%AB%E3%81%AF%EF%BC%9F
