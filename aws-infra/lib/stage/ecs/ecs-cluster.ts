import { Construct } from 'constructs';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { AppProtocol, Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver, OperatingSystemFamily, Protocol } from 'aws-cdk-lib/aws-ecs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Duration, Stack } from 'aws-cdk-lib';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationLoadBalancer, ApplicationProtocol, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { Context } from '../../context/context';
import { ParameterStore } from '../../parameterstore/parameter-store';
import { ApiGatewayEndpoint } from '../websocket-apis/apigateway-endpoint';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as path from 'path';
import { EcsGrantPolicy, EcsGrantPolicyProps } from './ecs-grant-policy';

export interface EcsClusterProps {
    readonly context: Context;
    readonly vpc: Vpc;
    readonly ecsSecurityGroup: SecurityGroup;
    readonly rds: DatabaseInstance;
    readonly rdsSecret: Secret;
    // readonly webSocketApiStage: CfnStage
    // readonly innerApi: RestApi;
}

export class EcsCluster extends Construct {
    public readonly taskDefinition: FargateTaskDefinition;
    public readonly alb: ApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;
        const hostedZone = this.lookUpHostedZone(context);

        const ecsCluster = new Cluster(this, context.wpp("EcsCluster"), {
            clusterName: context.wpk('ecs-cluster'),
            vpc: props.vpc,
        });

        const taskDef = this.buildTaskDefinition(props, stack);

        const albService = this.buildAlbFargeteService(taskDef, ecsCluster, hostedZone, props);

        this.taskDefinition = taskDef;
        this.alb = albService.loadBalancer;
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
        const policyProps = props as EcsGrantPolicyProps;
        policyProps.taskDefinition = taskDefinition;

        new EcsGrantPolicy(stack, 'EcsGrantPolicy', policyProps);

        const containerName = `${context.systemName()}-app`;
        taskDefinition.addContainer(`${context.systemNameOfPascalCase()}AppContainer`, {
            containerName: containerName,
            image: ContainerImage.fromAsset(path.join(__dirname, 'dummy/app')),
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
        // const apiEp = new ApiGatewayEndpoint(props.webSocketApiStage);

        const context = props.context;
        return {
            DB_HOST: props.rds.instanceEndpoint.hostname,
            DB_PORT: String(props.rds.instanceEndpoint.port),
            DB_DATABASE: context.systemName(),
            DB_USERNAME: props.rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
            DB_PASSWORD: props.rdsSecret.secretValueFromJson('password').unsafeUnwrap(),
            // CLIENT_SEND_API_URL: props.innerApi.url,
            // WEBSOCKET_URL: context.currentStage().apiFqdn,
            // WEBSOCKET_API_URL: context.websocketEndpointUrl(),
            // FIXME 上記の通り…でありたいのだが、今「カスタムドメインとCredentialを仕込めない」という問題があるので、生のAPIエンドポイントを仕込む
            // WEBSOCKET_URL: apiEp.path(),
            // WEBSOCKET_API_URL: apiEp.httpUrl(),
            WEBSOCKET_API_REGION: stack.region,
            WSDDB_TABLE_NAME: context.dynamoDbTableName(),

            AWS_DEFAULT_REGION: stack.region,
            AWS_BUCKET: context.s3BucketName(),
            IMAGE_SITE_URL: `https://${context.currentStage().imageServerFqdn}`
        }
    }

    private buildAlbFargeteService(
        taskDifinition: FargateTaskDefinition,
        ecsCluster: Cluster,
        hostedZone: IHostedZone,
        props: EcsClusterProps
    ): ApplicationLoadBalancedFargateService {
        const context = props.context;

        const certificateArn = new ParameterStore(props.context, this).cerificationArn();
        const certificate = Certificate.fromCertificateArn(this, 'SearchCertificationByArn', certificateArn);

        const albFargateService = new ApplicationLoadBalancedFargateService(this, 'AppService', {
            serviceName: context.wpk('app-service'),
            taskDefinition: taskDifinition,
            securityGroups: [props.ecsSecurityGroup],
            healthCheckGracePeriod: Duration.seconds(240),
            loadBalancerName: context.wpk('app-alb'),
            cluster: ecsCluster,
            domainName: context.applicationDnsARecordName(),
            domainZone: hostedZone,
            protocol: ApplicationProtocol.HTTPS,
            listenerPort: 443,
            certificate: certificate,
            sslPolicy: SslPolicy.RECOMMENDED_TLS,
            redirectHTTP: true,
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

        return albFargateService;
    }

    private lookUpHostedZone(context: Context): IHostedZone {
        const hostedZoneId = new ParameterStore(context, this).hostedZoneId();
        return HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: context.applicationDnsARecordName(),
            hostedZoneId: hostedZoneId,
        });
    }
}
