import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { Duration, SecretValue } from 'aws-cdk-lib';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        const { vpc, rdsSecurityGroup, ecsSecurityGroup } = this.buildVpcAndNetwork(settings);

        const rds = this.buildRds(settings, vpc, rdsSecurityGroup);

        const ecsCluster = new ecs.Cluster(this, settings.wpp("EcsCluster"), {
            clusterName: settings.wpk('ecs-cluster'),
            vpc: vpc,
        });

        const serviceTaskDefinition = new ecs.FargateTaskDefinition(this, `${settings.systemNameOfPascalCase()}AppTaskDefinition`, {
            family: `${settings.systemName()}-app-task-difinition-family`,
            cpu: 256,
            memoryLimitMiB: 512,
            runtimePlatform: {
                cpuArchitecture: ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
            },
            // executionRole: {} // TODO 実行時ロールの作り込み
        });
        serviceTaskDefinition.addContainer(`${settings.systemNameOfPascalCase()}AppContainer`, {
            containerName: `${settings.systemName()}-app`,
            image: ecs.ContainerImage.fromRegistry("nginx:mainline-alpine"), // for first test.
            memoryReservationMiB: 256,
            // logging: xxx // TODO ログ設定
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                retries: 3
            },
            environment: {
                DB_HOST: rds.instanceEndpoint.hostname,
                DB_PORT: String(rds.instanceEndpoint.port),
                DB_NAME: settings.systemName(),
                DB_USER: rds.secret?.secretValueFromJson('username').unsafeUnwrap() as string,
                APP_DATABASE_PASSWORD: rds.secret?.secretValueFromJson('password').unsafeUnwrap() as string,
            }
        }).addPortMappings({
            name: `${settings.systemName()}-app-80-tcp`,
            containerPort: 80,
            hostPort: 80,
            protocol: ecs.Protocol.TCP,
            appProtocol: ecs.AppProtocol.http
        });

        const albFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AppService', {
            serviceName: `${settings.systemName()}-app-service`,
            taskDefinition: serviceTaskDefinition,
            securityGroups: [ecsSecurityGroup],
            healthCheckGracePeriod: Duration.seconds(240),
            loadBalancerName: settings.wpk('app-alb'),
            // redirectHTTP: true,
            cluster: ecsCluster,
        });
        albFargateService.targetGroup.configureHealthCheck({
            path: "/",
            healthyThresholdCount: 2,
            interval: Duration.seconds(15),
        });

        albFargateService.loadBalancer.addListener('id-one-test', {
            protocol: elb.ApplicationProtocol.HTTPS,
            defaultAction: elb.ListenerAction.forward([albFargateService.targetGroup]),
            sslPolicy: elb.SslPolicy.RECOMMENDED,
            // TODO CetificateManagerから検索して取る…とか？
            certificates: [elb.ListenerCertificate.fromArn('arn:aws:acm:ap-northeast-1:077931172314:certificate/fe97f4e9-4329-48d0-bf1c-5deb5b710241')]
        });

        this.setTag("Stage", settings.currentStageId);
        this.setTag("Version", settings.packageVersion());
    }

    private buildVpcAndNetwork(settings: Context) {
        const vpc = new ec2.Vpc(this, settings.wpp('Vpc'), {
            vpcName: settings.wpk('vpc'),
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'Public',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    name: 'PrivateEcs',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    name: 'PrivateRds',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                }
            ]
        });
        const ecsSecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroupEcs', {
            vpc: vpc,
            securityGroupName: settings.wpk('ecs-sg')
        });
        const rdsSecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroupRds', {
            vpc: vpc,
            securityGroupName: settings.wpk('rds-sg'),
        });
        rdsSecurityGroup.addIngressRule(
            ec2.Peer.securityGroupId(ecsSecurityGroup.securityGroupId),
            ec2.Port.tcp(3306),
            'from ECS(container) to RDS access.'
        );
        return { vpc, rdsSecurityGroup, ecsSecurityGroup };
    }

    private buildRds(settings: Context, vpc: ec2.Vpc, rdsSecurityGroup: ec2.SecurityGroup): rds.DatabaseInstance {
        const rdsSecret = new sm.Secret(this, settings.wpp("RdsAppSecret"), {
            secretName: settings.wpk("rds-app-secret"),
            generateSecretString: {
                excludePunctuation: true,
                includeSpace: false,
                secretStringTemplate: JSON.stringify({ username: 'user' }),
                generateStringKey: 'password',
            },
        });
        const rdsCredential = rds.Credentials.fromPassword(
            rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
            SecretValue.unsafePlainText(
                rdsSecret.secretValueFromJson('password').unsafeUnwrap()
            )
        );

        const rdsSettings = settings.currentStage().rds;

        const appDb = new rds.DatabaseInstance(this, settings.wpp("AppRds"), {
            instanceIdentifier: settings.wpk('app-rds'),
            engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_32 }),
            instanceType: ec2.InstanceType.of(
                rdsSettings.class,
                rdsSettings.size
            ),
            multiAz: rdsSettings.multiAz,
            databaseName: settings.systemName(),
            credentials: rdsCredential,
            vpc,
            vpcSubnets: vpc.selectSubnets(),
            securityGroups: [rdsSecurityGroup],
            subnetGroup: new rds.SubnetGroup(this, settings.wpp("AppRdsSubnetGroup"), {
                subnetGroupName: settings.wpk('app-rds-sg'),
                description: 'for App RDS Subnets(only Private and Isolated)',
                vpc: vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: SubnetType.PRIVATE_ISOLATED
                }),
            })
        });

        return appDb;
    }


    private setTag(key: string, value: string): void {
        cdk.Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        if (settings.invalidCurrentStageId())
            throw new Error(`stageIdが正しく指定されていません。(${settings.currentStageId}) 有効なstageIdは ${settings.stageIdsText()} のいずれかです。`);
    }
}
