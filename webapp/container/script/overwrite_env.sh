#!/bin/bash

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
