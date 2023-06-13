import { Construct } from 'constructs';
import { Project, Source, FilterGroup, EventAction, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Stack } from 'aws-cdk-lib';
import { IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Context } from '../../context/context';

export interface CodeBuildForCdDeployProps {
    readonly context: Context;
    readonly ecsTaskDefinition: FargateTaskDefinition;
}

export class CodeBuildForCdDeploy extends Construct {
    constructor(scope: Construct, id: string, props: CodeBuildForCdDeployProps) {
        super(scope, id);

        const stack = scope as Stack;
        const context = props.context;

        const tagDeployOfSourceCDProject = new Project(this, 'DeployByGitTagCodeBuild', {
            projectName: context.wpk('deploy-by-github-tag'),
            description: 'GitHubでStageTag(文字列始まりの"production"等)が切られた場合、アプリ・Lambda・環境のデプロイを行う。',
            source: Source.gitHub({
                owner: 'kazuhito-m',
                repo: 'aws-laravel-websocket-sample',
                webhook: true,
                webhookFilters: [
                    FilterGroup
                        .inEventOf(EventAction.PUSH)
                        .andTagIs(context.currentStageId)
                ],
            }),
            buildSpec: BuildSpec.fromSourceFilename('cd/deploy/buildspec.yml'),
            badge: true,
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                environmentVariables: {
                    STAGE_ID: { value: context.currentStageId },
                    ECS_CLUSTER: { value: context.wpk('ecs-cluster') },
                    ECS_SERVICE: { value: context.wpk('app-service') },
                    ECS_TASK_FAMILY: { value: context.wpk('app-task-difinition-family') },
                    LAMBDA_FUNCTION_NAMES: { value: `${context.wpk('websocket-lambda')},${context.wpk('send-websocket-inner-route-lambda')}` },
                    CONTAINER_REGISTRY_URI_APP: { value: context.containerRegistryUriApp(stack) },
                    CONTAINER_REGISTRY_URI_LAMBDA: { value: context.containerRegistryUriLambda(stack) }
                }
            }
        });

        this.grantPolicyOfCodeBuildForCdDeploy(tagDeployOfSourceCDProject.grantPrincipal, props, stack);
    }

    private grantPolicyOfCodeBuildForCdDeploy(
        principal: IPrincipal,
        props: CodeBuildForCdDeployProps,
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
