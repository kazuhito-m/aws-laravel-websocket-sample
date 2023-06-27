import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { SecretValue, Tags } from 'aws-cdk-lib/core';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { PublicHostedZone, CnameRecord } from 'aws-cdk-lib/aws-route53';
import { GitHubSourceCredentials, Project, FilterGroup, Source, EventAction, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Duration } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Context } from '../context/context';
import { ParameterStore } from '../parameterstore/parameter-store';
import { Ses } from './ses/ses';

export interface AlwsStackProps extends StackProps {
    context: Context,
}

export class AlwsGlobalStack extends Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(settings);

        const repositories = this.buildContainerRepository(settings);

        this.buildCiCdParts(settings, repositories);

        // 一旦コメントアウト。ここは「手動操作」で作成する(ということを手順書ベースで書いておく)
        // this.buildDnsAndCertificate(settings);

        new Ses(this, 'CreateSes', { context: settings });

        this.setTag("Version", settings.packageVersion());
    }

    private buildDnsAndCertificate(settings: Context) {
        const domainName = settings.global.siteDomain;
        const hostedZone = new PublicHostedZone(this, `${settings.systemNameOfPascalCase()}HostedZone`, {
            zoneName: domainName,
            comment: `Site ${domainName} hosted Zone. Created from cdk.`
        });
        const certificate = new Certificate(this, `${settings.systemNameOfPascalCase()}Certificate`, {
            certificateName: `${settings.systemName()}-common-certificate`,
            domainName: `*.${domainName}`,
            validation: CertificateValidation.fromDns(hostedZone),
        });

        new CnameRecord(this, "DnsCommonCnameRecord", {
            zone: hostedZone,
            recordName: "*",
            domainName: ".",
            ttl: Duration.minutes(5),
            comment: 'All names that do not exist in the A record are treated as "."'
        });

        const parameterStore = new ParameterStore(settings, this);
    }

    private buildContainerRepository(settings: Context): Repository[] {
        const repositories: Repository[] = [];
        [settings.containerRegistryNameApp(), settings.containerRegistryNameLambda()].forEach(name => {
            const containerRepository = new Repository(this, 'ContainerRepsitory_' + name, {
                repositoryName: name,
                imageTagMutability: TagMutability.IMMUTABLE,
                imageScanOnPush: false, // 脆弱性検査は Amazon Inspector に移譲する
            });
            // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除せず、Stackから外れる。
            containerRepository.addLifecycleRule({
                maxImageCount: 500
            });
            repositories.push(containerRepository);
        });
        return repositories;
    }

    private buildCiCdParts(settings: Context, repositories: Repository[]): void {
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
    }

    private setTag(key: string, value: string): void {
        Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');
    }
}
