import { Construct } from 'constructs';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Stack } from 'aws-cdk-lib';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { CfnStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { Context } from '../../context/context';
import { EcsTaskDefinition } from './ecs-task-definition';
import { EcsAlb } from './ecs-alb';

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
    public readonly alb: ApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;

        const ecsCluster = new Cluster(this, context.wpp("EcsCluster"), {
            clusterName: context.wpk('ecs-cluster'),
            vpc: props.vpc,
        });

        const ecsTaskDef = new EcsTaskDefinition(stack, 'EcsTaskDefinition', props);

        const ecsAlb = new EcsAlb(this, 'EcsAlb', {
            context: props.context,
            ecsSecurityGroup: props.ecsSecurityGroup,
            ecsCluster: ecsCluster,
            taskDifinition: ecsTaskDef.taskDefinition,
        });

        this.taskDefinition = ecsTaskDef.taskDefinition;
        this.alb = ecsAlb.alb;
    }
}
