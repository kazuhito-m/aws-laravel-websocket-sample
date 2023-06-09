# Laravel/PHPメモ

仕込みのHowToやはまったとこメモ。

## phpenv

https://github.com/phpenv/phpenv-installer に従って…

```bash
curl -L https://raw.githubusercontent.com/phpenv/phpenv-installer/master/bin/phpenv-installer \

echo '
export PHPENV_ROOT="/home/kazuhito/.phpenv"
if [ -d "${PHPENV_ROOT}" ]; then
    export PATH="${PHPENV_ROOT}/bin:${PATH}"
      eval "$(phpenv init -)"
fi
' >> ~/.bashrc

phpenv versions
phpenv install 8.2.6
phpenv local 8.2.6
```

とかで済むと思ってたんだけど…。

思ったより「依存を多く求める」ので、トラブルシュート。

```bash
sudo apt install -y libonig-dev libxml2-dev sqlite3 libsqlite3-dev libbz2-dev libcurl4-openssl-dev libpng-dev libjpeg-dev libreadline-dev libtidy-dev libxslt1-dev libzip-dev
```

こんなに多いと、env系の利点が無い気がするんだけど。

### 参考

- https://github.com/phpenv/phpenv-installer
- https://virment.com/steps-for-installing-php-on-ubuntu-using-phpenv/
- https://readouble.com/laravel/9.x/ja/releases.html
  - Laravel内のPHPの対応状況

## composerがない問題

phpenvでPHPインストールすれば上手くいけるか…と思ったら入ってない。

ので、入れる。

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php ./composer.phar install
rm ./composer-setup.php
```

### 参考

- https://qiita.com/4roro4/items/f4f7911ee1ec7abe0733


## lalavelプログラム作成

```bash
composer create-project --prefer-dist laravel/laravel webapp
cd webapp
php artisan serve
```
## 簡単なコントローラとCRUD処理を実装

以下のチュートリアルを参考に、元から在るUserのメンテ画面を作成。

https://www.itsolutionstuff.com/post/laravel-10-crud-application-example-tutorialexample.html

## laravel10の標準的な仕込み

以下の記事を参考に、標準的な設定を。

https://zenn.dev/imah/articles/5d761f8f8c26fe

## 認証の導入

[ここ](https://readouble.com/laravel/10.x/ja/starter-kits.html) を参考に、組み込みログイン画面を導入する。

```bash
composer require laravel/breeze --dev
php artisan breeze:install
# テンプレートは Blade を選択。

php artisan migrate
npm install
npm run dev
```

### 参考

- https://reffect.co.jp/laravel/laravel-authentification-by-code-base

## Laravel単体でのDockerコンテナ化

[ここ](https://madewithlove.com/blog/the-easiest-production-ready-image-to-run-your-laravel-application/) を参考に、「一つのコンテナでLaravelを立ち上げるDockerfileを作成する。

ただし、Fargeteを使う上で「このビルド方法が適切か」はわからないため、これは「仮のやり方」とし、再度設計しなおす。

### その他、参考

- https://github.com/webdevops/Dockerfile/blob/master/docker/php-official/8.2-alpine/Dockerfile
  - 元になってるイメージの、また元になっているDockerfile

## .envまわり「設定を書き換える手段」のバリエーション

- https://kaki-engine.com/laravel-env-file-referenced/
- https://readouble.com/laravel/8.x/ja/configuration.html
- https://tektektech.com/laravel-environment-variable/


[こうした。](https://github.com/kazuhito-m/aws-laravel-websocket-sample/pull/19)

## LaravelアプリケーションをDockerizeするベストプラクティス

- https://blog.potproject.net/2018/09/17/php-web-docker-production
- https://zenn.dev/ppputtyo/articles/laravel9-render

今使っているコンテナは `webdevops/php-nginx` なのだが、上記のリンクの記事のほうが良いのかもしれない。

TODO 書き換えテスト

## トラブルシュート:APサーバの冗長化構成でページを遷移するたび「419:PAGE EXPIRED」になる問題

デフォルトが「サーバのファイルをセッションファイルにしている」になっているから、当然ちゃぁ当然なんだが…。

- https://programing-school.work/laravel-419-csrf-error/
- https://qiita.com/gone0021/items/e22d20414b0635d648c5

ということでDBでSESSION管理するようにする。

1. session.php を書き換える
0. .env のSESSION_DRIVE の値を書き換える
0. 専用コマンドでマイグレーション作る
0. マイグレーションする

## トラブルシュート: ALB+HTTPSにしたのに、CSS/ScriptはHTTPになる

最終的には `TrustProxies.php` に * をしているするのは前提として、プラス `AppServiceProvide.php` に書くことにより解決した。

```php
public function boot()
{
  if (request()->isSecure()) {
    URL::forceScheme('https');
  }
}
```

- https://qiita.com/e_tyubo/items/c25df0c545b1af8494c7
- https://rapicro.com/laravel%E3%81%AEroute%E3%81%8Chttp%E3%81%AB%E3%81%AA%E3%82%8B%E3%80%90https%E5%8C%96%E3%80%91/
- https://liginc.co.jp/490895
- https://o-84.com/article/laravel-url-generator-cloudfront-alb-https/
- https://egatech.net/laravel-https/

## トラブルシュート: .env変えたのに反映されない問題

- https://zenn.dev/ikeo/articles/627b042ffb6796b0a507

`php artisan config:clear` する必要が在る。

それがわからない場合、わけわからない時間を溶かすことになる。

## その他、トラブルシュートに使った周辺知識

- https://polidog.jp/2018/05/08/php-docker-imagick/
- https://wiki.alpinelinux.org/wiki/GCC
- https://www.engilaboo.com/docker-build-no-cache/
- https://qiita.com/yyy752/items/4f6029835add675aebbc#:~:text=%E3%82%A8%E3%83%A9%E3%83%BC%EF%BC%9ACould%20not%20open%20input%20file%3A%20artisan&text=%E3%81%A8%E3%81%84%E3%81%86%E3%82%A8%E3%83%A9%E3%83%BC%E3%81%8C%E7%99%BA%E7%94%9F%E3%81%97%E3%81%BE%E3%81%99%E3%80%82&text=%E3%82%A8%E3%83%A9%E3%83%BC%E3%81%8C%E7%99%BA%E7%94%9F%E3%81%99%E3%82%8B%E3%81%A8%E3%81%84%E3%81%86,%E3%81%A6%E3%81%84%E3%82%8B%E3%81%8B%E7%A2%BA%E8%AA%8D%E3%81%97%E3%81%BE%E3%81%97%E3%82%87%E3%81%86%E3%80%82
- https://note.com/secure_inc/n/ne86be57adcfb
- https://qiita.com/tkek321/items/5d7714d7170bbf379c11
- https://progtext.net/programming/laravel-user-data/
- https://heppoko-room.net/archives/1648
- https://qiita.com/mitashun/items/96caaf1c1f36eada20f2
- https://codelikes.com/laravel-logging/
- https://stackoverflow.com/questions/32061775/where-to-specify-an-app-version-on-a-laravel-app

#### PHP自体

- https://medium-company.com/php-static/#static-5
- https://www.php.net/manual/ja/functions.arguments.php
- 日付関連
  - https://qiita.com/shuntaro_tamura/items/b7908e6db527e1543837
  - https://qiita.com/hogesuke_1/items/6d887c5669adeb1d1b08
- https://www.w3schools.com/php/php_oop_classes_objects.asp
- JSON関連
  - https://www.php.net/manual/ja/function.json-encode.php
  - https://hydrocul.github.io/wiki/programming_languages_diff/json/encode.html
- 通信(外部WebAPI呼ぶ)まわり
  - https://laraweb.net/surrounding/9720/

#### HTML/JS関連

- https://iwb.jp/javascript-canvas-confetti-animation/
  - 紙吹雪を簡単に降らせることが出来た
- https://developer.mozilla.org/ja/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
  - 本家(mdm)によるWebSocketの標準的な使い方の説明
