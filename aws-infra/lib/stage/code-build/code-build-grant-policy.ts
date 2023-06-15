import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { Project } from 'aws-cdk-lib/aws-codebuild';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Context } from '../../context/context';

export interface CodeBuildGrantPolicyProps {
    readonly context: Context;
    readonly codeBuildProject: Project;
    readonly ecsTaskDefinition: FargateTaskDefinition;
}

export class CodeBuildGrantPolicy extends Construct {
    constructor(stack: Stack, id: string, props: CodeBuildGrantPolicyProps) {
        super(stack, id);

        this.grantPolicyOfCodeBuildForCdDeploy(props.codeBuildProject.grantPrincipal, props, stack);
    }

    private grantPolicyOfCodeBuildForCdDeploy(
        principal: IPrincipal,
        props: CodeBuildGrantPolicyProps,
        stack: Stack
    ): void {
        const context = props.context;

        principal.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:ListTaskDefinitions",
                "ecs:DescribeTaskDefinition"
            ],
            "Resource": [
                "*"
            ]
        }));
        const me = Stack.of(this).account;
        principal.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "application-autoscaling:Describe*",
                "application-autoscaling:PutScalingPolicy",
                "application-autoscaling:DeleteScalingPolicy",
                "application-autoscaling:RegisterScalableTarget",
                "cloudwatch:DescribeAlarms",
                "cloudwatch:PutMetricAlarm",
                "ecs:List*",
                "ecs:Describe*",
                "ecs:UpdateService",
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:GetPolicy",
                "iam:GetPolicyVersion",
                "iam:GetRole",
                "iam:ListAttachedRolePolicies",
                "iam:ListRoles",
                "iam:ListGroups",
                "iam:ListUsers"
            ],
            "Resource": [
                "*"
            ]
        }));
        principal.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionCode"
            ],
            "Resource": [
                `arn:aws:lambda:${stack.region}:${me}:function:${context.wpk('*')}`
            ]
        }));
        const taskDef = props.ecsTaskDefinition;
        principal.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": [
                `arn:aws:iam::${me}:role/ecsTaskExecutionRole`,
                taskDef.taskRole.roleArn,
                taskDef.executionRole?.roleArn
            ]
        }));
    }
}
