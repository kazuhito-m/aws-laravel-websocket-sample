import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { Duration } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(settings);

        const repositories = this.buildContainerRepository(settings);

        this.buildCiCdParts(settings, repositories);

        this.buildDnsAndCertificate(settings);

        this.setTag("Version", settings.packageVersion());
    }

    private buildDnsAndCertificate(settings: Context) {
        const domainName = settings.global.siteDomain;
        const hostedZone = new route53.PublicHostedZone(this, `${settings.systemNameOfPascalCase()}HostedZone`, {
            zoneName: domainName,
            comment: `Site ${domainName} hosted Zone. Created from cdk.`
        });
        const certificate = new cm.Certificate(this, `${settings.systemNameOfPascalCase()}Certificate`, {
            certificateName: `${settings.systemName()}-common-certificate`,
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

        this.savePrameterStore(`${settings.systemName()}-hostedzone-id`, hostedZone.hostedZoneId);
        this.savePrameterStore(`${settings.systemName()}-certification-arn`, certificate.certificateArn);
    }

    private buildContainerRepository(settings: Context): ecr.Repository[] {
        const repositories: ecr.Repository[] = [];
        [settings.containerRegistryNameApp(), settings.containerRegistryNameLambda()].forEach(name => {
            const containerRepository = new ecr.Repository(this, 'ContainerRepsitory_' + name, {
                repositoryName: name,
                imageTagMutability: ecr.TagMutability.IMMUTABLE,
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

    private buildCiCdParts(settings: Context, repositories: ecr.Repository[]): void {
        const githubAccessToken = StringParameter.valueFromLookup(this, `${settings.systemName()}-github-access-token`);
        new codebuild.GitHubSourceCredentials(this, 'CodebuildGithubCredentials', {
            accessToken: cdk.SecretValue.unsafePlainText(githubAccessToken),
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
                        .andTagIs('[0-9]+\\.[0-9]+\\.[0-9]+.*')
                ],
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('cd/build/buildspec.yml'),
            badge: true,
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                environmentVariables: {
                    APP_REPOSITORY_NAME: { value: repositories[0].repositoryName },
                    LAMBDA_REPOSITORY_NAME: { value: repositories[1].repositoryName },
                }
            }
        });
        repositories.forEach(r => r.grantPullPush(tagBuildOfSourceCIProject.grantPrincipal));
    }

    private savePrameterStore(key: string, value: string): StringParameter {
        return new StringParameter(this, key, { stringValue: value });
    }

    private setTag(key: string, value: string): void {
        cdk.Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');
    }
}
