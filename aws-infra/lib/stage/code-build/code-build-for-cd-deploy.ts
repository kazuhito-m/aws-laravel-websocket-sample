import { Construct } from 'constructs';
import { Project, Source, FilterGroup, EventAction, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Stack } from 'aws-cdk-lib';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Context } from '../../context/context';
import { CodeBuildGrantPolicy } from './code-build-grant-policy';

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

        new CodeBuildGrantPolicy(scope as Stack, 'CodeBuildGrantPolicy', {
            context: context,
            codeBuildProject: tagDeployOfSourceCDProject,
            ecsTaskDefinition: props.ecsTaskDefinition
        });
    }
}
