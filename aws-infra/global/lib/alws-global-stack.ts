import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

import { Construct } from 'constructs';
import { AlwsGlobalStackProps } from './alws-global-stack-props';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsGlobalStackProps) {
        super(scope, id, props);

        const settings = props?.context;
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        const containerRepository = new ecr.Repository(this, 'ContainerRepsitory', {
            repositoryName: settings?.containerImageId(),
            imageTagMutability: ecr.TagMutability.IMMUTABLE,
            imageScanOnPush: false, // 脆弱性検査は Amazon Inspector に移譲する
        });
        // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除せず、Stackから外れる。
        containerRepository.addLifecycleRule({
            maxImageCount: 500
        })

        new codebuild.GitHubSourceCredentials(this, 'CodebuildGithubCredentials', {
            accessToken: cdk.SecretValue.unsafePlainText(settings.global.githubAccessToken),
        });
        const tagBuildOfSourceCIProject = new codebuild.Project(this, 'BuildCImageByGitTagCodeBuild', {
            projectName: `${settings.systemName()}-app-container-image-build-by-github-tag`,
            description: 'GitHubでTag(数値始まり)が切られた場合、アプリケーションのコンテナイメージをビルド、レジストリに登録する。',
            source: codebuild.Source.gitHub({
                owner: 'kazuhito-m',
                repo: 'aws-laravel-websocket-sample',
                webhook: true,
                webhookFilters: [
                    codebuild.FilterGroup
                        .inEventOf(codebuild.EventAction.PUSH)
                        .andTagIs('^[0-9]+\.[0-9]+\.[0-9].*$')
                ],
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('cd/build/buildspec.yml'),
            badge: true
        });

        this.setTag("Version", settings.packageVersion());
    }

    private setTag(key: string, value: string): void {
        cdk.Tags.of(this).add(key, value);
    }
}
