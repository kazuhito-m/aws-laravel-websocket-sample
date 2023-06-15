import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { Project } from 'aws-cdk-lib/aws-codebuild';
import { FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { Context } from '../../context/context';

export interface CodeBuildGrantPolicyForCdkMigrateProps {
    readonly context: Context;
    readonly codeBuildProject: Project;
    readonly ecsTaskDefinition: FargateTaskDefinition;
}

export class CodeBuildGrantPolicyForCdkMigrate extends Construct {
    constructor(stack: Stack, id: string, props: CodeBuildGrantPolicyForCdkMigrateProps) {
        super(stack, id);

        this.grantPolicy(props.codeBuildProject);
    }

    private grantPolicy(project: Project): void {
        const role = project.role as IRole;

        const awsManagedPolicyNames = [
            'AWSCodeBuildAdminAccess', // TODO AWSCodeBuildDeveloperAccess に変えられないか？
            'AmazonECS_FullAccess',
            'AmazonRDSFullAccess',
            'AmazonVPCFullAccess',
            `AmazonAPIGatewayAdministrator`,
            'AWSLambda_FullAccess',
            'AmazonDynamoDBFullAccess'
        ];

        for (const name of awsManagedPolicyNames) {
            role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(name));
        }
    }
}
