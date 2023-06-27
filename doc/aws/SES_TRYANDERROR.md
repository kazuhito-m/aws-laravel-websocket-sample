# AWS CDKでAmazon SESを仕込む際の試行錯誤

## LaravelでSESでメールを送信する

厳密にはAWSの話題ではないが、仕込方を調べたので、ここに書く。

- https://readouble.com/laravel/9.x/ja/mail.html
- https://qiita.com/Sub_Tanabe/items/de2c4a29fa6ae5503814
- https://qiita.com/hiroaki-u/items/986b523998d5e415fc4d
- https://nyan.blog/2020/10/28/laravel-7-x%E3%83%A1%E3%83%BC%E3%83%AB%E3%81%AE%E9%80%81%E4%BF%A1%E3%81%ABamazon-ses%E3%82%92%E4%BD%BF%E3%81%86/#toc9

パット見(未検証)では、やり方が揺れていて、

1. `.env` に `MAIL_DRIVER=ses`
2. `.env` に `MAIL_MAILER=ses`

となっている。

記事にも書いてあるが、 `config/mail.php` を確認し、意図を探る必要がありそう。

### その後調べたこと

現在は、元の `.env` も `MAIL_MAILER` に統一されている。

また、動くことも確認出来たのでOK。

### ハマり点を確認

ハマりまくって、やっとたどり着いたので、記録していく。

- 「ID」は同一ドメインに2つ以上つくれるけれど、Zone名と同じものは一つしか作れない
  - ので、 `mail.domain.com` と `mail2.domain.com` みたいな2つは作れない
  - 必ず `mail.domain.com` と `mail.other.domain.com` のように「サブドメインに下がらない」と出来ない
  - だから「Stagingとか環境違っても、一個(トップドメイン)だけで良いかぁ」ってなってる
- ID作ったすぐの最初は「”MAIL FROM ドメイン”のアドレス」にしか送れない
  - そして、それを取り出すクライアントとかはないので、ただの疎通テストにしかならない
  - アカウント全体での「SESでのproduction化(サンドボックスからの移動)要求」を出さないと、実質外に送れない
  - 送信数なんかよりこっちの制限のほうが遥かにしんどい
- 「”MAIL FROM ドメイン”に設定したものを、アプリ上でもFROMに設定する」しなければ、送れない
  - 本番用の.envファイルが違う設定だったので、最初環境差異かと思ったが、それ以前の問題でハマってた
- Laravelの設定値「AWS_ACCESS_KEY_ID、AWS_SECRET_ACCESS_KEY」は空文字にしてはいけない
  - Laravel独自の話なので、厳密にはSES/CDKの問題ではないが…
    - aws-sdkが隠蔽されてしまっているので、特殊なノウハウなので書いておきたい
  - パラメータが「ある」時点で「その値を使おうとする」挙動のようだ
    - たとえ空(あるいは"")としてたとしても「空文字がCecret」としてそれで認証しようとする模様
  - 設定ファイルにあれば消す必要がある
