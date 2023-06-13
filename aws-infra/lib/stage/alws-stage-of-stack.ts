import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Context } from '../context/context';
import { Tags } from 'aws-cdk-lib/core';
import { VpcAndNetwork } from './construct/vpc-and-network';
import { ApplicationRds } from './construct/application-rds';
import { ApiGatewayAndLambda } from './construct/apigateway-and-lambda';
import { CodeBuildForCdDeploy } from './construct/code-build-for-cd-deploy';
import { EcsCluster } from './construct/ecs-cluster';

export interface AlwsStackProps extends StackProps {
    context: Context,
}

export class AlwsStageOfStack extends Stack {
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

        new CodeBuildForCdDeploy(this, 'CodeBuildForCdDeploy', { context: context, ecsTaskDefinition: ecs.taskDefinition })

        this.setTag("Stage", context.currentStageId);
        this.setTag("Version", context.packageVersion());
    }

    private setTag(key: string, value: string): void {
        Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        if (settings.invalidCurrentStageId())
            throw new Error(`stageIdが正しく指定されていません。(${settings.currentStageId}) 有効なstageIdは ${settings.stageIdsText()} のいずれかです。`);
    }
}
