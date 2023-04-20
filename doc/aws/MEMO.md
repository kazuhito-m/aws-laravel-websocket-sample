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

