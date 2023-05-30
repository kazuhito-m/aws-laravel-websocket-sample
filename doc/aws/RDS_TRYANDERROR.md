# AWS CDKでRDSを作るための試行錯誤

## パスワードを自動生成し、その後ECS等で使いたい

RDSが「自動生成」したパスワード、「アプリケーションに伝播出来ないか」を調べる。

結局、「EC2/ECSコンテナにたどり着いた時に環境変数で伝える」みたいなの一般的なようだった。

いくつかの手段があるので、記事から「よさそうなの」をピックアップする。

- https://abillyz.com/mamezou/studies/418
- https://dev.classmethod.jp/articles/use-secrets-manager-to-set-environment-argument-for-lambda/
- https://dev.classmethod.jp/articles/automatically-generate-a-password-with-cdk/

## VPCにすでに定義されているサブネットをRDSで使う方法

ふっつーにGUIで出来る事が、全く出来ないので調べてみた。

- https://dev.classmethod.jp/articles/how-to-refer-subnet-from-aws-cdk
- https://kumagoro-95.hatenablog.com/entry/2022/07/24/182443

## VPCにすでに定義されているセキュリティグループをRDSで使う方法

これまたGUIでは簡単にできることが出来ないので、調べた。

- https://dev.classmethod.jp/articles/cdk-practice-16-security-group/

