import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { Project } from 'aws-cdk-lib/aws-codebuild';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Context } from '../../context/context';

export interface CodeBuildGrantPolicyForCdkMigrateProps {
    readonly context: Context;
    readonly codeBuildProject: Project;
    readonly ecsTaskDefinition: FargateTaskDefinition;
}

export class CodeBuildGrantPolicyForCdkMigrate extends Construct {
    constructor(stack: Stack, id: string, props: CodeBuildGrantPolicyForCdkMigrateProps) {
        super(stack, id);

        this.grantPolicy(props.codeBuildProject.grantPrincipal, props, stack);
    }

    private grantPolicy(
        principal: IPrincipal,
        props: CodeBuildGrantPolicyForCdkMigrateProps,
        stack: Stack
    ): void {
        const context = props.context;

    }
}
