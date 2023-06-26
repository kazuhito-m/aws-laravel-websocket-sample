import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { EcsClusterProps } from './ecs-cluster';

export interface EcsGrantPolicyProps extends EcsClusterProps {
    taskDefinition: FargateTaskDefinition
}

export class EcsGrantPolicy extends Construct {
    constructor(stack: Stack, id: string, props: EcsGrantPolicyProps) {
        super(stack, id);

        this.addPolicyOf(props, stack);
    }

    private addPolicyOf(props: EcsGrantPolicyProps, stack: Stack) {
        const me = Stack.of(stack).account;
        const context = props.context;
        const taskDefinition = props.taskDefinition;

        taskDefinition.addToExecutionRolePolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": ["ecr:GetAuthorizationToken", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
            "Resource": "*",
        }));

        const taskRole = taskDefinition.taskRole;
        taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')); // XXX 必要無いかも？
        taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:DeleteItem"
            ],
            "Resource": `arn:aws:dynamodb:${stack.region}:${me}:table/${context.dynamoDbTableName()}`,
        }));
        // taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
        //     "Effect": "Allow",
        //     "Action": "execute-api:ManageConnections",
        //     "Resource": `arn:aws:execute-api:${stack.region}:${me}:${props.webSocketApiStage.apiId}/*/POST/@connections/*`,
        // }));
        taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": `arn:aws:s3:::${context.s3BucketName()}/*`
        }));
        taskRole.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": `arn:aws:ses:${stack.region}:${me}:identity/*`
        }));
    }
}
