import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';
import { VpcAndNetwork } from './construct/vpc-and-network';
import { ApplicationRds } from './construct/application-rds';
import { ApiGatewayAndLambda } from './construct/apigateway-and-lambda';
import { CodeBuildForCdDeploy } from './construct/code-build-for-cd-deploy';
import { EcsCluster } from './construct/ecs-cluster';
import { IRole } from 'aws-cdk-lib/aws-iam';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const context = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        const vpc = new VpcAndNetwork(this, 'VpcAndNetwork', { context: context });

        const rds = new ApplicationRds(this, 'ApplicationRds', vpc);

        const apiAndLambda = new ApiGatewayAndLambda(this, 'ApiGatewayAndLambda', { context: context });

        const ecs = new EcsCluster(this, 'EcsCluster', {
            context: context,
            vpc: vpc.vpc,
            rds: rds.appRds,
            rdsSecret: rds.rdsSecret,
            ecsSecurityGroup: vpc.ecsSecurityGroup,
            webSocketApiStage: apiAndLambda.webSocketApiStage,
            innerApi: apiAndLambda.innerApi
        });

        // apiAndLambda.dynamoDbTable.grantFullAccess(ecs.taskDefinition.executionRole as IRole);
        apiAndLambda.dynamoDbTable.grantReadData(ecs.taskDefinition.taskRole);

        new CodeBuildForCdDeploy(this, 'CodeBuildForCdDeploy', { context: context, ecsTaskDefinition: ecs.taskDefinition })

        this.setTag("Stage", context.currentStageId);
        this.setTag("Version", context.packageVersion());
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
