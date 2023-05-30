import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { SecretValue } from 'aws-cdk-lib';
import { setegid } from 'process';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        // VPC & networks
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


        // RDS
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
        )

        const rdsSettings = settings.currentStage().rds;

        const appDb = new rds.DatabaseInstance(this, settings.wpp("App"), {
            instanceIdentifier: settings.wpk('app'),
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


        // TODO 下を参考に、情報をコンテナ側へ環境変数で渡す
        // const container = taskDefinition.addContainer('Container', {
        //     // image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        //     image: ecs.ContainerImage.fromEcrRepository(repository),
        //     memoryLimitMiB: 256,
        //     cpu: 256,
        //     environment: {
        //         DB_HOST: postgresql.instanceEndpoint.hostname,
        //         DB_PORT: String(postgresql.instanceEndpoint.port),
        //         DB_NAME: 'testdatabase',
        //         DB_USER: databaseCredentialSecret.secretValueFromJson('username').toString(),
        //         APP_DATABASE_PASSWORD: databaseCredentialSecret.secretValueFromJson('password').toString(),
        //     },
        // })

        this.setTag("Stage", settings.currentStageId);
        this.setTag("Version", settings.packageVersion());
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
