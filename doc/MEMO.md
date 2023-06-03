# ノンジャンルの技術メモ

## gitでtag<->hash<->tagをLookUpする方法

今回の設計では

- 特定のgit tagの名前で作成された時をきっかけとして制御する
- gitで複数tagを付けている場合、もう片方のtagを調べる

予定であるため、それらが出来る手法を使いたい。

(gitコマンドでは出来るのだが…AWSのプロダクトで出来るのだろうか)

- https://blog.eiel.info/blog/2014/05/28/cotains-commit-in-tags/

