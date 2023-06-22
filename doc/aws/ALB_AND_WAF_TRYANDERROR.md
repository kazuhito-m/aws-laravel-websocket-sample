# AWS CDKでALB & WAFを仕込む際の試行錯誤

## ALBにWAFを仕込む

- https://www.for-engineer.life/entry/aws-alb-waf/


## WAFにBasic認証を仕込む

- https://dev.classmethod.jp/articles/aws-waf-basic-auth/

実証中に極端なハマりで時間を浪費した。

- LocalのLinuxの `base64` コマンドで作ったエンコード文字列がおかしい
  - 原因はわかっていないが…
  - https://www.en-pc.jp/tech/base64.php 等のWebサイトで作ったものだと通る
  - 疑っていなかったので「認証が無限ループする！」と数時間溶かした
  - 最終的には「Node.jsのコード内でエンコードする」という実装にしたので間違いないだろう

## CDKでWAF＆Basic認証を実装する

- https://dev.classmethod.jp/articles/aws-cdk-create-wafv2-2022-9/
- https://dev.classmethod.jp/articles/aws-cdk-create-wafv2/
- https://dev.classmethod.jp/articles/applying-aws-managed-rules-for-waf-v2-to-cloudfront-in-aws-cdk/
  - こちらはS3&CloudFrontの例だが、ヒントにはした

実証中に極端なハマりで時間を浪費した。

- `CfnWebACLAssociation` というクラスがCDK中「2つ」あり、片方を使うとALBを登録できない
  - 上記クラスが `aws-wafregional` と `aws-wafv2` という両方のモジュールにあり、前者を使うとエラーとなる
  - これまた解らず、数時間溶かした
