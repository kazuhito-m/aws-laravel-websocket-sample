import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Context } from '../context/context';
import { Tags } from 'aws-cdk-lib/core';
import { VpcAndNetwork } from './vpc/vpc-and-network';
import { ApplicationRds } from './rds/application-rds';
import { ApiGatewayAndLambda } from './websocket-apis/apigateway-and-lambda';
import { CodeBuildForCdDeploy } from './code-build/code-build-for-cd-deploy';
import { EcsCluster } from './ecs/ecs-cluster';
import { S3BucketForUpload } from './s3/s3-bucket-for-upload';
import { Waf } from './waf/waf';

export interface AlwsStackProps extends StackProps {
    context: Context,
}

export class AlwsStageOfStack extends Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const context = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        const vpc = new VpcAndNetwork(this, 'VpcAndNetwork', { context: context });

        const s3 = new S3BucketForUpload(this, 'S3BucketForUpload', { context: context });

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

        new Waf(this, 'Waf', { context: context, alb: ecs.alb });

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
