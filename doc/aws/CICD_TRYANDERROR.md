# CDKでCI/CDをAWSで作るための試行錯誤

主に「Code三兄弟」と呼ばれるプロダクトをメインに…したかったけど `CodeBuild` だけかなぁ。


## Code三兄弟を使って「特定TagがPushされたら動く」ものを作りたい

- https://dev.classmethod.jp/articles/codepipeline-private-downloadsource/
- https://dev.classmethod.jp/articles/delivery-by-codepipeline-codecommit-codebuild-codedeploy/
- https://note.com/build_service/n/n21b2dfe49bd4
- https://qiita.com/leomaro7/items/41cbe8aa7c32298ec665

結論的には「CodePipelineを使って”特定タグ起動”は出来ない」。

ので、`CodePipeline` も `CodeDeploy` も見送り、「 `CodeBuild` で自力スクリプティング」と言う判断に。


#### では「世の中はどうやっている」のか？

- https://qiita.com/ipppppei/items/42cd6459cf383b9bc140
- https://dev.classmethod.jp/articles/codepipeline-triggered-by-github-releases/


自分的には「絡め手」に思えるのだが…

- 特定の `ブランチ` のcommit/pushをエントリポイントに割り当ててる
- GitHubからの特定のイベント(Releaseへの追加とか)からWebHookで飛ばして起動
- CodeBuildからCodePipelineを蹴っている

などしていて…どうも統一感・親和性に欠ける…かなぁと。

## CDKでCodeBuildを作る前に「GitHubのAccessTokenを指定」しようとするとエラー


`CloudBuild` に「Githubのソースを登録する」ためには「GitHubのアクセス手段(`GitHubSourceCredentials`)」が必要である。
　
```typescript
const githubAccessToken = StringParameter.valueFromLookup(this, `${settings.systemName()}-github-access-token`);
new codebuild.GitHubSourceCredentials(this, 'CodebuildGithubCredentials', {
    accessToken: cdk.SecretValue.unsafePlainText(githubAccessToken),
});

const tagBuildOfSourceCIProject = new codebuild.Project(this, 
```

が、「他CloudBuildProjectですでに同じことをしている」場合、のエラーとなることがある。

```
AWS::CodeBuild::SourceCredential | 
CodebuildGithubCredentials29C68758
Failed to call ImportSourceCredentials, reason: Access token with server type GITHUB already exists. Delete its source c 
redential and try again.
```

総体で「絶対に他のStackで行われてる」前提があるのであれば、ただ「消せば良いだけ」となる。(合うrかな無いか確認して…というやり方は解らなかった)

## CodeBuildで使う「Linuxイメージ」のShellを指定する(bashにする)

https://blog.serverworks.co.jp/tech/2020/06/29/codebuild-shell/

最初「何のシェルだ？」というくらい不便なので、前提としてのbashはほしい。

## CloudBuildで「シェルスクリプトからECSのコンテナ入れ替え(デプロイ)」する

- https://qiita.com/ipppppei/items/42cd6459cf383b9bc140
- https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/developerguide/security_iam_id-based-policy-examples.html#IAM_task_definition_policies
