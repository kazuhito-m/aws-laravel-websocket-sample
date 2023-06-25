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
