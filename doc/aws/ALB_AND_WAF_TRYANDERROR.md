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

## ALBでhttp->httpsとリダイレクトするようにCDKで仕込む

- https://repost.aws/ja/knowledge-center/elb-redirect-http-to-https-using-alb

手動でやるのなら、上記のようにやるのだが、自力でやるとしたら、既存のやりかたから、

```typescript
 albFargateService.loadBalancer.addListener('AlbListenerHttps', {
      protocol: ApplicationProtocol.HTTPS,
      defaultAction: ListenerAction.forward([albFargateService.targetGroup]),
      sslPolicy: SslPolicy.RECOMMENDED_TLS,
      certificates: [certificate]
});
albFargateService.loadBalancer.addListener('AlbListenerHttpRedirectHttps', {
    protocol: ApplicationProtocol.HTTP,
    defaultAction: ListenerAction.redirect({
        protocol: ApplicationProtocol.HTTPS,
        port: '443',
    }),
});
```

とやる…のだろうとは思うのだけど、実際に設定すると「既存のListnerで80Portのリスナーが居ます」となって、CDKがコケてしまう。

おそらくなんか頑張ればこのやり方で出来るのだろうとは思うのだけれど…

`ECS` と `ApplicationLoadBalancedFargateService` を使ってやる場合、Service側のパラメータに「全部もりもりで指定」すると…

```typescript
const albFargateService = new ApplicationLoadBalancedFargateService(this, 'AppService', {
    serviceName: 'app-service',
    taskDefinition: taskDifinition,
    securityGroups: [props.ecsSecurityGroup],
    healthCheckGracePeriod: Duration.seconds(240),
    loadBalancerName: 'app-alb',
    cluster: ecsCluster,
    // ここ以下、ALBとDNSとListnerの設定が並んでいる。
    domainName: context.applicationDnsARecordName(),
    domainZone: hostedZone,
    protocol: ApplicationProtocol.HTTPS,
    listenerPort: 443,
    certificate: certificate,
    sslPolicy: SslPolicy.RECOMMENDED_TLS,
    redirectHTTP: true,
});

```

という指定をすると、

- ECSとつないだALBを作る
- Port:443 でListnerを作り、ECSにつなぐ
- Port:80 が Port:443 に対してリダイレクトするLisnterを作る
- Route53のZoneにALBとつないだAレコードを作る

と「外側から接続するのに過不足無い一式」を作ってくれる。
