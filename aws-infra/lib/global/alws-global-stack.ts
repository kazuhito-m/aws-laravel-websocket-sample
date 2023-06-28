import { Stack, StackProps } from 'aws-cdk-lib';
import { SecretValue, Tags } from 'aws-cdk-lib/core';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { GitHubSourceCredentials, Project, FilterGroup, Source, EventAction, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Context } from '../context/context';
import { Ses } from './ses/ses';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Ecr } from './ecr/ecr';
import { DnsAndCertificate } from './dns/dns-and-certificate';

export interface AlwsStackProps extends StackProps {
    context: Context,
}

export class AlwsGlobalStack extends Stack {
    constructor(stack: Stack, id: string, props?: AlwsStackProps) {
        super(stack, id, props);

        const context = props?.context as Context;
        this.confimationOfPreconditions(context);

        const ecr = new Ecr(stack, 'CreateEcr', { context: context });

        this.buildCiCdParts(context, ecr.repositories, stack);

        // 一旦コメントアウト。ここは「手動操作」で作成する(ということを手順書ベースで書いておく)
        // new DnsAndCertificate(stack, 'CreateDnsAndCertificate', { context: context });

        new Ses(this, 'CreateSes', { context: context });

        this.setTag("Version", context.packageVersion());
    }

    private buildCiCdParts(settings: Context, repositories: Repository[], stack: Stack): void {
        const githubAccessToken = StringParameter.valueFromLookup(this, `${settings.systemName()}-github-access-token`);
        new GitHubSourceCredentials(this, 'CodebuildGithubCredentials', {
            accessToken: SecretValue.unsafePlainText(githubAccessToken),
        });
        const tagBuildOfSourceCIProject = new Project(this, 'BuildCImageByGitTagCodeBuild', {
            projectName: `${settings.systemName()}-app-container-image-build-by-github-tag`,
            description: 'GitHubでTag(数値始まり)が切られた場合、アプリケーションのコンテナイメージをビルド、レジストリに登録する。',
            source: Source.gitHub({
                owner: 'kazuhito-m',
                repo: 'aws-laravel-websocket-sample',
                webhook: true,
                webhookFilters: [
                    FilterGroup
                        .inEventOf(EventAction.PUSH)
                        .andTagIs('[0-9]+\\.[0-9]+\\.[0-9]+.*')
                ],
            }),
            buildSpec: BuildSpec.fromSourceFilename('cd/build/buildspec.yml'),
            badge: true,
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                environmentVariables: {
                    APP_REPOSITORY_NAME: { value: repositories[0].repositoryName },
                    LAMBDA_REPOSITORY_NAME: { value: repositories[1].repositoryName },
                }
            }
        });
        repositories.forEach(r => r.grantPullPush(tagBuildOfSourceCIProject.grantPrincipal));

        const me = Stack.of(stack).account;
        tagBuildOfSourceCIProject.addToRolePolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "ssm:GetParameter",
            "Resource": [
                `arn:aws:ssm:${stack.region}:${me}:parameter/${settings.systemName()}-*`,
            ]
        }));
    }

    private setTag(key: string, value: string): void {
        Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');
    }
}
