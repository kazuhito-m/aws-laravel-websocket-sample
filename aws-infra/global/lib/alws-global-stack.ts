import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { Duration } from 'aws-cdk-lib';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(settings);

        // this.buildContainerRepository(settings);

        this.buildDnsAndCertificate(settings);

        this.setTag("Version", settings.packageVersion());
    }

    private buildDnsAndCertificate(settings: Context) {
        const domainName = settings.global.siteDomain;
        const hostedZone = new route53.PublicHostedZone(this, `${settings.systemNameOfPascalCase()}HostedZone`, {
            zoneName: domainName,
            comment: `Site ${domainName} hosted Zone. Created from cdk.`
        });
        new cm.Certificate(this, `${settings.systemNameOfPascalCase()}Certificate`, {
            domainName: `*.${domainName}`,
            validation: cm.CertificateValidation.fromDns(hostedZone),
        });

        new route53.CnameRecord(this, "DnsCommonCnameRecord", {
            zone: hostedZone,
            recordName: "*",
            domainName: ".",
            ttl: Duration.minutes(5),
            comment: 'All names that do not exist in the A record are treated as "."'
        });
    }

    private buildContainerRepository(settings: Context) {
        const containerRepository = new ecr.Repository(this, 'ContainerRepsitory', {
            repositoryName: settings?.containerImageId(),
            imageTagMutability: ecr.TagMutability.IMMUTABLE,
            imageScanOnPush: false, // 脆弱性検査は Amazon Inspector に移譲する
        });
        // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除せず、Stackから外れる。
        containerRepository.addLifecycleRule({
            maxImageCount: 500
        });

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
                        .andTagIs('[0-9]+\.[0-9]+\.[0-9].*')
                ],
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('cd/build/buildspec.yml'),
            badge: true,
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                environmentVariables: {
                    REPOSITORY_NAME: {
                        value: containerRepository.repositoryName,
                    }
                }
            }
        });
        containerRepository.grantPullPush(tagBuildOfSourceCIProject.grantPrincipal);
    }

    private setTag(key: string, value: string): void {
        cdk.Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');
    }
}
