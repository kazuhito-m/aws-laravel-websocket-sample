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

## トラブルシュート:APサーバの冗長化構成でページを遷移するたび「419:PAGE EXPIRED」になる問題

デフォルトが「サーバのファイルをセッションファイルにしている」になっているから、当然ちゃぁ当然なんだが…。

- https://programing-school.work/laravel-419-csrf-error/
- https://qiita.com/gone0021/items/e22d20414b0635d648c5

ということでDBでSESSION管理するようにする。

1. session.php を書き換える
0. .env のSESSION_DRIVE の値を書き換える
0. 専用コマンドでマイグレーション作る
0. マイグレーションする


### その他、トラブルシュートに使った周辺知識

- https://polidog.jp/2018/05/08/php-docker-imagick/
- https://wiki.alpinelinux.org/wiki/GCC
- https://www.engilaboo.com/docker-build-no-cache/
- https://qiita.com/yyy752/items/4f6029835add675aebbc#:~:text=%E3%82%A8%E3%83%A9%E3%83%BC%EF%BC%9ACould%20not%20open%20input%20file%3A%20artisan&text=%E3%81%A8%E3%81%84%E3%81%86%E3%82%A8%E3%83%A9%E3%83%BC%E3%81%8C%E7%99%BA%E7%94%9F%E3%81%97%E3%81%BE%E3%81%99%E3%80%82&text=%E3%82%A8%E3%83%A9%E3%83%BC%E3%81%8C%E7%99%BA%E7%94%9F%E3%81%99%E3%82%8B%E3%81%A8%E3%81%84%E3%81%86,%E3%81%A6%E3%81%84%E3%82%8B%E3%81%8B%E7%A2%BA%E8%AA%8D%E3%81%97%E3%81%BE%E3%81%97%E3%82%87%E3%81%86%E3%80%82
- https://note.com/secure_inc/n/ne86be57adcfb
- https://qiita.com/tkek321/items/5d7714d7170bbf379c11


