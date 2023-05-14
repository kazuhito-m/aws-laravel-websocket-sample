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

