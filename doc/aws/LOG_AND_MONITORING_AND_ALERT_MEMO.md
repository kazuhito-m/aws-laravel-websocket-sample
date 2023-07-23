#　Log & 監視 & 警告 に関する試行錯誤メモ

## CloudWatchLogsで「StackTrace等が改行ごとにイベントが分かれてしまう」解決

- LaravelのStackTraceやその他「複数行に渡るログ」が、すべて「別のイベント」として細切れに記録されてしまう、のを問題としていた
  - https://qiita.com/YujiHamada3/items/ea7e73582c1ebf309d94
- ２つの解決法があった
  - ECS自体に仕込む
  - アプリのログ出力ごと変えて「CloudWatchLogsに直接送る」
- 「ECS自体に仕込む」をしたかったが「どこに仕込むか」が解らなかった
  - `TaskDifinition` に仕込む、という記事が出てきた
  - https://kotamat.com/post/laravel-on-ecs/
- 場所はわかったが「CDKでどう仕込むか」が解らなかった
  - https://repost.aws/questions/QU6snA2AxkQBm2OzExQq77ag/taskdefinition-cdk-and-logconfiguration
- 仕込むところはわかったが「どう設定を書くか」が解らなかった
  - https://matsuand.github.io/docs.docker.jp.onthefly/config/containers/logging/awslogs/
- 「日付をひっかける」ができるが、やりたいことが出来なかった
  - https://matsuand.github.io/docs.docker.jp.onthefly/config/containers/logging/awslogs/
- 「正規表現が使える方」が原初かつ本家かつ有用と聞いたので、そっちで書いた
  - https://twitter.com/iso2022jp/status/1682998710232571905
  - お試しに使った: https://regex101.com/
