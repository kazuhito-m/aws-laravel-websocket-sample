import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct, DependencyGroup } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { Duration, SecretValue } from 'aws-cdk-lib';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { DockerImageCode } from 'aws-cdk-lib/aws-lambda';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration, MethodLoggingLevel } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        // const { vpc, rdsSecurityGroup, ecsSecurityGroup } = this.buildVpcAndNetwork(settings);

        // const { appRds, rdsSecret } = this.buildRds(settings, vpc, rdsSecurityGroup);

        const innerApi = this.buildApiGatewayAndLambda(settings);

        // this.buildEcsCluster(settings, vpc, appRds, ecsSecurityGroup, rdsSecret, innerApi);

        this.buildCodeBuildForCdDeploy(settings);

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

    private buildRds(settings: Context, vpc: ec2.Vpc, rdsSecurityGroup: ec2.SecurityGroup) {
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

        const appRds = new rds.DatabaseInstance(this, settings.wpp("AppRds"), {
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

        return { appRds, rdsSecret };
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

    private buildApiGatewayAndLambda(settings: Context): RestApi {
        const dynamoDbTable = this.buildDynamoDbTableOfWebSocketConnection(settings);
        this.buildWebSocektApiGatewayAndLambda(settings, dynamoDbTable);
        return this.buildWebSocektApiKickApiGatewayAndLambda(settings);
    }

    private buildWebSocektApiGatewayAndLambda(settings: Context, dynamoDbTable: Table): void {
        const webSocketApi = new apigatewayv2.CfnApi(this, settings.wpp('WebSocketApi'), {
            name: settings.wpk('websocket-api'),
            protocolType: 'WEBSOCKET',
            routeSelectionExpression: '$request.body.action',
            description: `WebSocketのサーバ(API)の本体。(${settings.currentStageId}用)`,
        })

        const websocketLambda = new DockerImageFunction(this, settings.wpp('WebSocketLambda'), {
            functionName: settings.wpk('websocket-lambda'),
            timeout: Duration.seconds(25),
            logRetention: 30,
            code: DockerImageCode.fromImageAsset('./dummy/lambda', {}),
            environment: {
                TABLE_NAME: dynamoDbTable.tableName,
                TABLE_KEY: 'connectionId',
            }
        });

        dynamoDbTable.grantWriteData(websocketLambda)
        const policy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [websocketLambda.functionArn],
            actions: ['lambda:InvokeFunction'],
        })
        const role = new iam.Role(this, 'WebSocketApiGatewayIntegrationRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        })
        role.addToPolicy(policy)

        const integration = new apigatewayv2.CfnIntegration(this, `connect-lambda-integration`, {
            apiId: webSocketApi.ref,
            integrationType: 'AWS_PROXY',
            integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${websocketLambda.functionArn}/invocations`,
            credentialsArn: role.roleArn,
        });

        const dependencyGroup = new DependencyGroup();
        ['connect', 'disconnect'].forEach(routeType => {
            const route = new apigatewayv2.CfnRoute(this, `${routeType}-route`, {
                apiId: webSocketApi.ref,
                routeKey: `$${routeType}`,
                authorizationType: 'NONE',
                target: 'integrations/' + integration.ref,
            });
            dependencyGroup.add(route);
        });

        const deployment = new apigatewayv2.CfnDeployment(this, 'WebSocketApiGatewayDeployment', {
            apiId: webSocketApi.ref,
        })
        deployment.node.addDependency(dependencyGroup);

        const stage = new apigatewayv2.CfnStage(this, 'WebSocketApiGatewayStage', {
            apiId: webSocketApi.ref,
            autoDeploy: true,
            deploymentId: deployment.ref,
            stageName: 'v1',
        })
    }

    private buildWebSocektApiKickApiGatewayAndLambda(settings: Context): RestApi {
        const roleName = 'KickWebSocketApiGatewayRole';
        const lambdaRole = new iam.Role(this, roleName,
            {
                roleName: roleName,
                assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
                inlinePolicies: {
                    "ApiGatewayAndLambdaKickPolicy": iam.PolicyDocument.fromJson({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": ["apigateway:*", "lambda:*"],
                                "Resource": "*"
                            }
                        ]
                    }),
                    "WebSocketApiKickPolicy": iam.PolicyDocument.fromJson({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": "execute-api:ManageConnections",
                                "Resource": "*"
                            }
                        ]
                    }), // FIXME これも、少々過剰な権限である。   
                },
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName(
                        'service-role/AWSLambdaBasicExecutionRole'
                    )
                ]
            }
        );
        const lambdaFunc = new DockerImageFunction(this, settings.wpp('SendWebSocketInnerRouteLambda'), {
            functionName: settings.wpk('send-websocket-inner-route-lambda'),
            timeout: Duration.seconds(25),
            logRetention: 30,
            role: lambdaRole,
            code: DockerImageCode.fromImageAsset('./dummy/lambda', {}),
            environment: {
                "DYNAMODB_WEBSOCKET_TABLE": settings.dynamoDbTableName(),
                "WEBSOCKET_ENDPOINT": settings.websocketEndpointUrl(),
            }
        });

        const innerApi = new RestApi(this, settings.wpp('SendWebSocketInnerRouteApi'), {
            restApiName: settings.wpk('send-websocket-inner-route-api'),
            deployOptions: {
                stageName: 'v1',
                loggingLevel: MethodLoggingLevel.ERROR,
            },
            description: `AWSの内側の通信経路を通ってWebSocketのAPIをたたき、Webクライアント(ブラウザ)に通信する。(${settings.currentStageId}用)`,
        });
        innerApi.root.addMethod('POST', new LambdaIntegration(lambdaFunc));
        return innerApi;
    }

    private buildDynamoDbTableOfWebSocketConnection(settings: Context): dynamodb.Table {
        return new dynamodb.Table(this, 'WebSocketConnectionDynamoDBTable', {
            partitionKey: {
                name: 'connectionId',
                type: dynamodb.AttributeType.STRING,
            },
            tableName: settings.dynamoDbTableName(),
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
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
        const me = cdk.Stack.of(this).account;
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
