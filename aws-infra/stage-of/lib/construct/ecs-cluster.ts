import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';
import { Context } from '../context/context';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { AppProtocol, Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver, OperatingSystemFamily, Protocol } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Duration, Stack } from 'aws-cdk-lib';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerAction, ListenerCertificate, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { ApiGatewayEndpoint } from './apigateway-endpoint';
import { ParameterStore } from '../parameterstore/parameter-store';

export interface EcsClusterProps {
    readonly context: Context;
    readonly vpc: Vpc;
    readonly ecsSecurityGroup: SecurityGroup;
    readonly rds: DatabaseInstance;
    readonly rdsSecret: Secret;
    readonly webSocketApiStage: CfnStage
    readonly innerApi: RestApi;
}

export class EcsCluster extends Construct {
    public readonly taskDefinition: FargateTaskDefinition;

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;

        const ecsCluster = new Cluster(this, context.wpp("EcsCluster"), {
            clusterName: context.wpk('ecs-cluster'),
            vpc: props.vpc,
        });

        const taskDef = this.buildTaskDefinition(props, stack);

        const albService = this.buildAlbFargeteService(taskDef, ecsCluster, props);

        this.buildDnsRecord(albService.loadBalancer, context);

        this.taskDefinition = taskDef;
    }

    private buildTaskDefinition(props: EcsClusterProps, stack: Stack): FargateTaskDefinition {
        const context = props.context;

        const taskDefinition = new FargateTaskDefinition(this, `${context.systemNameOfPascalCase()}AppTaskDefinition`, {
            family: context.wpk('app-task-difinition-family'),
            cpu: 256,
            memoryLimitMiB: 512,
            runtimePlatform: {
                cpuArchitecture: CpuArchitecture.X86_64,
                operatingSystemFamily: OperatingSystemFamily.LINUX
            },
        });
        this.addPolicyOf(taskDefinition, props, stack);

        const containerName = `${context.systemName()}-app`;
        taskDefinition.addContainer(`${context.systemNameOfPascalCase()}AppContainer`, {
            containerName: containerName,
            image: ContainerImage.fromRegistry("nginx:mainline-alpine"),
            memoryReservationMiB: 256,
            logging: LogDriver.awsLogs({
                streamPrefix: 'ecs',
                logGroup: new LogGroup(this, 'ContainerLogGroup', {
                    logGroupName: `/ecs/${context.currentStageId}/${containerName}`,
                    retention: 30,
                }),
            }),
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                retries: 3
            },
            environment: this.buildContainerEnvironmentVariables(props, stack)
        }).addPortMappings({
            name: `${context.systemName()}-app-80-tcp`,
            containerPort: 80,
            hostPort: 80,
            protocol: Protocol.TCP,
            appProtocol: AppProtocol.http
        });
        return taskDefinition;
    }

    private addPolicyOf(taskDefinition: FargateTaskDefinition, props: EcsClusterProps, stack: Stack) {
        const me = Stack.of(stack).account;
        const context = props.context;

        taskDefinition.addToExecutionRolePolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": ["ecr:GetAuthorizationToken", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
            "Resource": "*",
        }));

        const taskRole = taskDefinition.taskRole;
        taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')); // XXX 必要無いかも？
        taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "dynamodb:Scan",
            "Resource": `arn:aws:dynamodb:${stack.region}:${me}:table/${context.dynamoDbTableName()}`,
        }));
        taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "execute-api:ManageConnections",
            "Resource": `arn:aws:execute-api:${stack.region}:${me}:${props.webSocketApiStage.apiId}/*/POST/@connections/*`,
        }));
    }

    private buildContainerEnvironmentVariables(props: EcsClusterProps, stack: Stack): { [key: string]: string; } {
        const apiEp = new ApiGatewayEndpoint(props.webSocketApiStage);

        const context = props.context;
        return {
            DB_HOST: props.rds.instanceEndpoint.hostname,
            DB_PORT: String(props.rds.instanceEndpoint.port),
            DB_DATABASE: context.systemName(),
            DB_USERNAME: props.rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
            DB_PASSWORD: props.rdsSecret.secretValueFromJson('password').unsafeUnwrap(),
            CLIENT_SEND_API_URL: props.innerApi.url,
            // WEBSOCKET_URL: context.currentStage().apiFqdn,
            // WEBSOCKET_API_URL: context.websocketEndpointUrl(),
            // FIXME 上記の通り…でありたいのだが、今「カスタムドメインとCredentialを仕込めない」という問題があるので、生のAPIエンドポイントを仕込む
            WEBSOCKET_URL: apiEp.path(),
            WEBSOCKET_API_URL: apiEp.httpUrl(),
            WEBSOCKET_API_REGION: stack.region,
            WSDDB_TABLE_NAME: context.dynamoDbTableName(),
        }
    }

    private buildAlbFargeteService(
        taskDifinition: FargateTaskDefinition,
        ecsCluster: Cluster,
        props: EcsClusterProps
    ): ApplicationLoadBalancedFargateService {
        const context = props.context;

        const albFargateService = new ApplicationLoadBalancedFargateService(this, 'AppService', {
            serviceName: context.wpk('app-service'),
            taskDefinition: taskDifinition,
            securityGroups: [props.ecsSecurityGroup],
            healthCheckGracePeriod: Duration.seconds(240),
            loadBalancerName: context.wpk('app-alb'),
            // redirectHTTP: true,  // TODO この設定だけでは80塞ぎが出来ないよう、後で
            cluster: ecsCluster,
        });
        albFargateService.targetGroup.configureHealthCheck({
            path: "/login",
            healthyThresholdCount: 2,
            interval: Duration.seconds(15),
        });
        if (context.isContainerAutoScaling()) {
            const config = context.currentStage().container;
            const autoScaling = albFargateService.service.autoScaleTaskCount({
                minCapacity: config.minCapacity,
                maxCapacity: config.maxCapacity,
            });
            autoScaling.scaleOnCpuUtilization('CpuBurstControl', {
                targetUtilizationPercent: config.cpuUtilizationPercent
            })
        }

        const certificateArn = new ParameterStore(props.context, this).cerificationArn();
        const certificate = ListenerCertificate.fromArn(certificateArn);

        albFargateService.loadBalancer.addListener('AlbListenerHTTPS', {
            protocol: ApplicationProtocol.HTTPS,
            defaultAction: ListenerAction.forward([albFargateService.targetGroup]),
            sslPolicy: SslPolicy.RECOMMENDED_TLS,
            certificates: [certificate]
        });

        return albFargateService;
    }

    private buildDnsRecord(alb: ApplicationLoadBalancer, context: Context): void {
        const hostedZoneId = new ParameterStore(context, this).hostedZoneId();
        const hostedZone = HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: context.applicationDnsARecordName(),
            hostedZoneId: hostedZoneId,
        });
        new ARecord(this, "DnsAppAnameRecord", {
            zone: hostedZone,
            recordName: context.applicationDnsARecordName(),
            target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
            ttl: Duration.minutes(5),
            comment: 'Application LB Record.'
        });
    }
}
