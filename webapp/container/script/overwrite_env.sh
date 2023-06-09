#!/bin/bash
#
# 引数に指定されたLaravelの設定ファイル(デフォルトなら.env)を、
# Linux:bashの環境変数(envコマンド)の値で「同一値なら書き換える」スクリプト。
#
# おそらく、Laravelの本来は
# - ”APP_ENV"という環境変数の値で設定ファイルが切り替わる
# - 勝手に環境変数が上書き/優先される
# が仕様だと思われるが、
# 使っているコンテナのせいか「そうならない」ので、自力で書き換える。
#

if [ "${1}" = "" ]; then
  echo "引数には、envファイルを指定して下さい。"
  exit 1
fi
target_env_file=${1}

echo "-------- Laravel設定ファイル(${target_env_file})を、同一の名前の環境変数で上書きする。 --------"
for i in $(env); do
  key="${i%%=*}\="

  grep "^${key}.*" ${target_env_file}
  if [ ${?} = 0 ]; then
    echo "-> ${i}"
    sed -i "s/^${key}.*/${i}/g" ${target_env_file}
  fi
done

exit 0
