import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { Duration } from 'aws-cdk-lib';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { VpcAndNetwork } from './construct/vpc-and-network';
import { ApplicationRds } from './construct/application-rds';
import { ApiGatewayAndLambda } from './construct/apigateway-and-lambda';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const context = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        const vpc = new VpcAndNetwork(this, 'VpcAndNetwork', { context: context });

        const rds = new ApplicationRds(this, 'ApplicationRds', vpc);

        const apiAndLambda = new ApiGatewayAndLambda(this, 'ApiGatewayAndLambda', { context: context });

        this.buildEcsCluster(context, vpc.vpc, rds.appRds, vpc.ecsSecurityGroup, rds.rdsSecret, apiAndLambda.innerApi);

        this.buildCodeBuildForCdDeploy(context);

        this.setTag("Stage", context.currentStageId);
        this.setTag("Version", context.packageVersion());
    }

    private buildEcsCluster(settings: Context,
        vpc: ec2.Vpc,
        rds: rds.DatabaseInstance,
        ecsSecurityGroup: ec2.SecurityGroup,
        rdsSecret: sm.Secret,
        innerApi: RestApi
    ) {
        const ecsCluster = new ecs.Cluster(this, settings.wpp("EcsCluster"), {
            clusterName: settings.wpk('ecs-cluster'),
            vpc: vpc,
        });

        const serviceTaskDefinition = new ecs.FargateTaskDefinition(this, `${settings.systemNameOfPascalCase()}AppTaskDefinition`, {
            family: settings.wpk('app-task-difinition-family'),
            cpu: 256,
            memoryLimitMiB: 512,
            runtimePlatform: {
                cpuArchitecture: ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
            },
            // TODO 実行時ロールの作り込み
            executionRole: new iam.Role(this, 'TaskExecutionRole', {
                assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
                inlinePolicies: {
                    "ApiGatewayManagementForWebSocketRequestPolicy": iam.PolicyDocument.fromJson({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": "execute-api:ManageConnections",
                                "Resource": "arn:aws:execute-api:*:*:*/*/*/*"
                            }
                        ]
                    })  // FIXME これはレンジ広すぎてひどい…
                }
            })
        });
        const containerName = `${settings.systemName()}-app`;
        serviceTaskDefinition.addContainer(`${settings.systemNameOfPascalCase()}AppContainer`, {
            containerName: containerName,
            image: ecs.ContainerImage.fromRegistry("nginx:mainline-alpine"),
            memoryReservationMiB: 256,
            logging: ecs.LogDriver.awsLogs({
                streamPrefix: 'ecs',
                logGroup: new logs.LogGroup(this, 'ContainerLogGroup', {
                    logGroupName: `/ecs/${settings.currentStageId}/${containerName}`,
                    retention: 30,
                }),
            }),
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                retries: 3
            },
            environment: {
                DB_HOST: rds.instanceEndpoint.hostname,
                DB_PORT: String(rds.instanceEndpoint.port),
                DB_DATABASE: settings.systemName(),
                DB_USERNAME: rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
                DB_PASSWORD: rdsSecret.secretValueFromJson('password').unsafeUnwrap(),
                CLIENT_SEND_API_URL: innerApi.url,
                WEBSOCKET_URL: settings.currentStage().apiFqdn,
                WEBSOCKET_API_URL: settings.websocketEndpointUrl(),
                WEBSOCKET_API_REGION: this.region,
                // TODO 以下は「何をどうやって仕込むか」を要検討
                // WSDDB_AWS_ACCESS_KEY_ID: '',
                // WSDDB_AWS_SECRET_ACCESS_KEY: ''
            }
        }).addPortMappings({
            name: `${settings.systemName()}-app-80-tcp`,
            containerPort: 80,
            hostPort: 80,
            protocol: ecs.Protocol.TCP,
            appProtocol: ecs.AppProtocol.http
        });

        const albFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AppService', {
            serviceName: settings.wpk('app-service'),
            taskDefinition: serviceTaskDefinition,
            securityGroups: [ecsSecurityGroup],
            healthCheckGracePeriod: Duration.seconds(240),
            loadBalancerName: settings.wpk('app-alb'),
            // redirectHTTP: true,  // TODO この設定だけでは80塞ぎが出来ないよう、後で
            cluster: ecsCluster,
        });
        albFargateService.targetGroup.configureHealthCheck({
            path: "/",
            healthyThresholdCount: 2,
            interval: Duration.seconds(15),
        });
        if (settings.isContainerAutoScaling()) {
            const config = settings.currentStage().container;
            const autoScaling = albFargateService.service.autoScaleTaskCount({
                minCapacity: config.minCapacity,
                maxCapacity: config.maxCapacity,
            });
            autoScaling.scaleOnCpuUtilization('CpuBurstControl', {
                targetUtilizationPercent: config.cpuUtilizationPercent
            })
        }

        const certificateArn = StringParameter.valueFromLookup(this, settings.certArnPraStoreName());
        const certificate = elb.ListenerCertificate.fromArn(certificateArn);

        albFargateService.loadBalancer.addListener('AlbListenerHTTPS', {
            protocol: elb.ApplicationProtocol.HTTPS,
            defaultAction: elb.ListenerAction.forward([albFargateService.targetGroup]),
            sslPolicy: elb.SslPolicy.RECOMMENDED_TLS,
            certificates: [certificate]
        });

        const hostedZoneId = StringParameter.valueFromLookup(this, settings.hostedZoneIdPraStoreName());
        const hostedZone = HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: settings.applicationDnsARecordName(),
            hostedZoneId: hostedZoneId,
        });
        new ARecord(this, "DnsAppAnameRecord", {
            zone: hostedZone,
            recordName: settings.applicationDnsARecordName(),
            target: RecordTarget.fromAlias(new LoadBalancerTarget(albFargateService.loadBalancer)),
            ttl: Duration.minutes(5),
            comment: 'Application LB Record.'
        });
        return ecsCluster;
    }

    private buildCodeBuildForCdDeploy(settings: Context): void {
        const tagDeployOfSourceCDProject = new codebuild.Project(this, 'DeployByGitTagCodeBuild', {
            projectName: settings.wpk('deploy-by-github-tag'),
            description: 'GitHubでStageTag(文字列始まりの"production"等)が切られた場合、アプリ・Lambda・環境のデプロイを行う。',
            source: codebuild.Source.gitHub({
                owner: 'kazuhito-m',
                repo: 'aws-laravel-websocket-sample',
                webhook: true,
                webhookFilters: [
                    codebuild.FilterGroup
                        .inEventOf(codebuild.EventAction.PUSH)
                        .andTagIs(settings.currentStageId)
                ],
            }),
            buildSpec: codebuild.BuildSpec.fromSourceFilename('cd/deploy/buildspec.yml'),
            badge: true,
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                environmentVariables: {
                    STAGE_ID: { value: settings.currentStageId },
                    ECS_CLUSTER: { value: settings.wpk('ecs-cluster') },
                    ECS_SERVICE: { value: settings.wpk('app-service') },
                    ECS_TASK_FAMILY: { value: settings.wpk('app-task-difinition-family') },
                    LAMBDA_FUNCTION_NAMES: { value: `${settings.wpk('websocket-lambda')},${settings.wpk('send-websocket-inner-route-lambda')}` },
                    CONTAINER_REGISTRY_URI_APP: { value: settings.containerRegistryUriApp(this) },
                    CONTAINER_REGISTRY_URI_LAMBDA: { value: settings.containerRegistryUriLambda(this) }
                }
            }
        });

        this.grantPolicyOfCodeBuildForCdDeploy(tagDeployOfSourceCDProject.grantPrincipal, settings);
    }

    private grantPolicyOfCodeBuildForCdDeploy(principal: any, settings: Context): void {
        principal.addToPrincipalPolicy(iam.PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:ListTaskDefinitions",
                "ecs:DescribeTaskDefinition"
            ],
            "Resource": [
                "*"
            ]
        }));
        const me = cdk.Stack.of(this).account;
        principal.addToPrincipalPolicy(iam.PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "application-autoscaling:Describe*",
                "application-autoscaling:PutScalingPolicy",
                "application-autoscaling:DeleteScalingPolicy",
                "application-autoscaling:RegisterScalableTarget",
                "cloudwatch:DescribeAlarms",
                "cloudwatch:PutMetricAlarm",
                "ecs:List*",
                "ecs:Describe*",
                "ecs:UpdateService",
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:GetPolicy",
                "iam:GetPolicyVersion",
                "iam:GetRole",
                "iam:ListAttachedRolePolicies",
                "iam:ListRoles",
                "iam:ListGroups",
                "iam:ListUsers"
            ],
            "Resource": [
                "*"
            ]
        }));
        principal.addToPrincipalPolicy(iam.PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionCode"
            ],
            "Resource": [
                `arn:aws:lambda:${this.region}:${me}:function:${settings.wpk('*')}`
            ]
        }));
        principal.addToPrincipalPolicy(iam.PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": [`arn:aws:iam::${me}:role/ecsTaskExecutionRole`]
        }));
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
