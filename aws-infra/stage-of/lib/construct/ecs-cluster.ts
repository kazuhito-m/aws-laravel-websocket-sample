import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';
import { Context } from '../context/context';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { AppProtocol, Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver, OperatingSystemFamily, Protocol } from 'aws-cdk-lib/aws-ecs';
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Duration, Stack } from 'aws-cdk-lib';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerAction, ListenerCertificate, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';

export interface EcsClusterProps {
    readonly context: Context;
    readonly vpc: Vpc;
    readonly ecsSecurityGroup: SecurityGroup;
    readonly rds: DatabaseInstance;
    readonly rdsSecret: Secret;
    readonly innerApi: RestApi;
}

export class EcsCluster extends Construct {
    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;

        const ecsCluster = new Cluster(this, context.wpp("EcsCluster"), {
            clusterName: context.wpk('ecs-cluster'),
            vpc: props.vpc,
        });

        const taskDefinition = this.buildTaskDefinition(props, stack);

        const albFargateService = this.buildAlbFargeteService(taskDefinition, ecsCluster, props);

        this.buildDnsRecord(albFargateService.loadBalancer, context);
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
            executionRole: this.buildTaskRole()
        });
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

    private buildContainerEnvironmentVariables(props: EcsClusterProps, stack: Stack): { [key: string]: string; } {
        const context = props.context;
        return {
            DB_HOST: props.rds.instanceEndpoint.hostname,
            DB_PORT: String(props.rds.instanceEndpoint.port),
            DB_DATABASE: context.systemName(),
            DB_USERNAME: props.rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
            DB_PASSWORD: props.rdsSecret.secretValueFromJson('password').unsafeUnwrap(),
            CLIENT_SEND_API_URL: props.innerApi.url,
            WEBSOCKET_URL: context.currentStage().apiFqdn,
            WEBSOCKET_API_URL: context.websocketEndpointUrl(),
            WEBSOCKET_API_REGION: stack.region,
            // TODO 以下は「何をどうやって仕込むか」を要検討
            // WSDDB_AWS_ACCESS_KEY_ID: '',
            // WSDDB_AWS_SECRET_ACCESS_KEY: ''
        }
    }

    private buildTaskRole(): Role {
        // TODO 実行時ロールの作り込み
        return new Role(this, 'TaskExecutionRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            inlinePolicies: {
                "ApiGatewayManagementForWebSocketRequestPolicy": PolicyDocument.fromJson({
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
        });
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
            path: "/",
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

        const certificateArn = StringParameter.valueFromLookup(this, context.certArnPraStoreName());
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
        const hostedZoneId = StringParameter.valueFromLookup(this, context.hostedZoneIdPraStoreName());
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
