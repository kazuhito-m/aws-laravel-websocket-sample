import { Construct } from 'constructs';
import { AppProtocol, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDriver, OperatingSystemFamily, Protocol } from 'aws-cdk-lib/aws-ecs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Duration, Stack } from 'aws-cdk-lib';
import * as path from 'path';
import { EcsGrantPolicy, EcsGrantPolicyProps } from './ecs-grant-policy';
import { EcsClusterProps } from './ecs-cluster';
import { ApiGatewayEndpoint } from '../websocket-apis/apigateway-endpoint';

export class EcsTaskDefinition extends Construct {
    public readonly taskDefinition: FargateTaskDefinition;

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        const stack = scope as Stack;
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

        this.taskDefinition = taskDefinition;
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

            AWS_DEFAULT_REGION: stack.region,
            AWS_BUCKET: context.s3BucketName(),
            IMAGE_SITE_URL: `https://${context.currentStage().imageServerFqdn}`,

            MAIL_FROM_ADDRESS: context.mailFromAddress(),
        }
    }
}
