import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib/core';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { GitHubSourceCredentials, Project, FilterGroup, Source, EventAction, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Context } from '../../context/context';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export interface CodeBuildForTagBuildProps {
    readonly context: Context;
    readonly repositories: Repository[];
}

export class CodeBuildForTagBuild extends Construct {
    constructor(scope: Construct, id: string, props: CodeBuildForTagBuildProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;
        const repositories = props.repositories;
        const githubAccessToken = StringParameter.valueFromLookup(this, `${context.systemName()}-github-access-token`);

        new GitHubSourceCredentials(this, 'CodebuildGithubCredentials', {
            accessToken: SecretValue.unsafePlainText(githubAccessToken),
        });
        const tagBuildOfSourceCIProject = new Project(this, 'BuildCImageByGitTagCodeBuild', {
            projectName: `${context.systemName()}-app-container-image-build-by-github-tag`,
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
                `arn:aws:ssm:${stack.region}:${me}:parameter/${context.systemName()}-*`,
            ]
        }));
    }
}
