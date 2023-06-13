import { Construct, DependencyGroup } from 'constructs';
import { Context } from '../../context/context';
import { LambdaIntegration, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CfnApi, CfnIntegration, CfnDeployment, CfnStage, CfnRoute } from 'aws-cdk-lib/aws-apigatewayv2';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApiGatewayEndpoint } from './apigateway-endpoint';
import * as path from 'path';

export interface ApiGatewayAndLambdaProps {
    readonly context: Context;
}

export class ApiGatewayAndLambda extends Construct {
    public readonly webSocketApiStage: CfnStage;
    public readonly innerApi: RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayAndLambdaProps) {
        super(scope, id);

        const dynamoDbTable = this.buildDynamoDbTableOfWebSocketConnection(props.context);
        this.webSocketApiStage = this.buildWebSocektApiGatewayAndLambda(props.context, dynamoDbTable, scope as Stack);
        this.innerApi = this.buildWebSocektApiKickApiGatewayAndLambda(props.context, scope as Stack);
    }

    private buildDynamoDbTableOfWebSocketConnection(context: Context): Table {
        return new Table(this, 'WebSocketConnectionDynamoDBTable', {
            partitionKey: {
                name: 'connectionId',
                type: AttributeType.STRING,
            },
            tableName: context.dynamoDbTableName(),
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }

    private buildWebSocektApiGatewayAndLambda(settings: Context, dynamoDbTable: Table, stack: Stack): CfnStage {
        const webSocketApi = new CfnApi(this, settings.wpp('WebSocketApi'), {
            name: settings.wpk('websocket-api'),
            protocolType: 'WEBSOCKET',
            routeSelectionExpression: '$request.body.action',
            description: `WebSocketのサーバ(API)の本体。(${settings.currentStageId}用)`,
        })

        const websocketLambda = new DockerImageFunction(this, settings.wpp('WebSocketLambda'), {
            functionName: settings.wpk('websocket-lambda'),
            timeout: Duration.seconds(25),
            logRetention: 30,
            code: DockerImageCode.fromImageAsset(this.dummyDockerfilePath(), {}),
            environment: {
                TABLE_NAME: dynamoDbTable.tableName,
                TABLE_KEY: 'connectionId',
            }
        });

        dynamoDbTable.grantWriteData(websocketLambda)
        const policy = new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [websocketLambda.functionArn],
            actions: ['lambda:InvokeFunction'],
        })
        const role = new Role(this, 'WebSocketApiGatewayIntegrationRole', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        })
        role.addToPolicy(policy)

        const integration = new CfnIntegration(this, `connect-lambda-integration`, {
            apiId: webSocketApi.ref,
            integrationType: 'AWS_PROXY',
            integrationUri: `arn:aws:apigateway:${stack.region}:lambda:path/2015-03-31/functions/${websocketLambda.functionArn}/invocations`,
            credentialsArn: role.roleArn,
        });

        const dependencyGroup = new DependencyGroup();
        ['connect', 'disconnect'].forEach(routeType => {
            const route = new CfnRoute(this, `${routeType}-route`, {
                apiId: webSocketApi.ref,
                routeKey: `$${routeType}`,
                authorizationType: 'NONE',
                target: 'integrations/' + integration.ref,
            });
            dependencyGroup.add(route);
        });

        const deployment = new CfnDeployment(this, 'WebSocketApiGatewayDeployment', {
            apiId: webSocketApi.ref,
        })
        deployment.node.addDependency(dependencyGroup);

        const stage = new CfnStage(this, 'WebSocketApiGatewayStage', {
            apiId: webSocketApi.ref,
            autoDeploy: true,
            deploymentId: deployment.ref,
            stageName: ApiGatewayEndpoint.STAGE_NAME,
        });

        return stage;
    }

    private buildWebSocektApiKickApiGatewayAndLambda(settings: Context, stack: Stack): RestApi {
        const roleName = 'KickWebSocketApiGatewayRole';
        const lambdaRole = new Role(this, roleName,
            {
                roleName: roleName,
                assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
                inlinePolicies: {
                    "ApiGatewayAndLambdaKickPolicy": PolicyDocument.fromJson({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": ["apigateway:*", "lambda:*"],
                                "Resource": "*"
                            }
                        ]
                    }),
                    "WebSocketApiKickPolicy": PolicyDocument.fromJson({
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
                    ManagedPolicy.fromAwsManagedPolicyName(
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
            code: DockerImageCode.fromImageAsset(this.dummyDockerfilePath(), {}),
            environment: {
                "DYNAMODB_WEBSOCKET_TABLE": settings.dynamoDbTableName(),
                // "WEBSOCKET_ENDPOINT": settings.websocketEndpointUrl(),
                // FIXME 上記の通り…でありたいのだが、今「カスタムドメインとCredentialを仕込めない」という問題があるので、生のAPIエンドポイントを仕込む
                "WEBSOCKET_ENDPOINT": new ApiGatewayEndpoint(this.webSocketApiStage).httpUrl()
            },
        });
        const me = Stack.of(this).account;
        lambdaFunc.addToRolePolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "dynamodb:Query",
                "dynamodb:Scan"],
            "Resource": [
                `arn:aws:dynamodb:${stack.region}:${me}:table/${settings.dynamoDbTableName()}`
            ]
        }));

        const innerApi = new RestApi(this, settings.wpp('SendWebSocketInnerRouteApi'), {
            restApiName: settings.wpk('send-websocket-inner-route-api'),
            deployOptions: {
                stageName: ApiGatewayEndpoint.STAGE_NAME,
                loggingLevel: MethodLoggingLevel.ERROR,
            },
            description: `AWSの内側の通信経路を通ってWebSocketのAPIをたたき、Webクライアント(ブラウザ)に通信する。(${settings.currentStageId}用)`,
        });
        innerApi.root.addMethod('POST', new LambdaIntegration(lambdaFunc));
        return innerApi;
    }

    private dummyDockerfilePath(): string {
        return path.join(__dirname, 'dummy/lambda');
    }
}
